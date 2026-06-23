-- ════════════════════════════════════════════════════════════════════════
-- 0008_schedule — 현장 공정 일정(가벼운 체크리스트 + 사진 메모)
--   · tasks: 공정명·예정일·완료여부·순서
--   · task_photos: 공정에 첨부하는 현장 사진 (Storage 'site' 버킷)
-- ════════════════════════════════════════════════════════════════════════

create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id   uuid not null references public.projects (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  due_on       date,
  done         boolean not null default false,
  done_at      timestamptz,
  sort_order   integer not null default 0,
  memo         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_workspace_id_idx on public.tasks (workspace_id);
-- '오늘/이번 주' 모아보기용: 미완료 + 예정일
create index if not exists tasks_agenda_idx
  on public.tasks (workspace_id, due_on) where not done;

create table if not exists public.task_photos (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id      uuid not null references public.tasks (id) on delete cascade,
  project_id   uuid not null references public.projects (id) on delete cascade,
  file_path    text not null,         -- Storage 'site' 버킷 경로
  caption      text,
  created_at   timestamptz not null default now()
);
create index if not exists task_photos_task_id_idx on public.task_photos (task_id);
create index if not exists task_photos_workspace_id_idx on public.task_photos (workspace_id);

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- ── RLS: 멤버 읽기/쓰기 (운영 데이터) ────────────────────────────────────
alter table public.tasks enable row level security;
alter table public.task_photos enable row level security;

create policy "tasks_all_member" on public.tasks
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

create policy "task_photos_all_member" on public.task_photos
  for all using (workspace_id in (select public.current_workspace_ids()))
  with check (workspace_id in (select public.current_workspace_ids()));

-- ── 순서 일괄 변경 (드래그 정렬) ─────────────────────────────────────────
-- security invoker → RLS 로 자기 workspace 행만 변경된다.
create or replace function public.reorder_tasks(p_ids uuid[])
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.tasks t
     set sort_order = pos.ord, updated_at = now()
  from (
    select id, (ordinality - 1)::int as ord
    from unnest(p_ids) with ordinality as u(id, ordinality)
  ) pos
  where t.id = pos.id;
end;
$$;
grant execute on function public.reorder_tasks(uuid[]) to authenticated;

-- ── Storage 'site' 버킷(현장 사진) + workspace 단위 RLS (storage 있을 때만) ─
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('site', 'site', false)
    on conflict (id) do nothing;

    drop policy if exists "site_select_member" on storage.objects;
    create policy "site_select_member" on storage.objects for select to authenticated
      using (
        bucket_id = 'site'
        and (storage.foldername(name))[1] in (
          select workspace_id::text from public.members
          where user_id = auth.uid() and status <> 'disabled'
        )
      );
    drop policy if exists "site_insert_member" on storage.objects;
    create policy "site_insert_member" on storage.objects for insert to authenticated
      with check (
        bucket_id = 'site'
        and (storage.foldername(name))[1] in (
          select workspace_id::text from public.members
          where user_id = auth.uid() and status <> 'disabled'
        )
      );
    drop policy if exists "site_delete_member" on storage.objects;
    create policy "site_delete_member" on storage.objects for delete to authenticated
      using (
        bucket_id = 'site'
        and (storage.foldername(name))[1] in (
          select workspace_id::text from public.members
          where user_id = auth.uid() and status <> 'disabled'
        )
      );
  end if;
end$$;
