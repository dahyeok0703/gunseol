-- ════════════════════════════════════════════════════════════════════════
-- 0007_brand_documents — 출력물(PDF) 지원
--   · workspaces 에 업체 프로필(상호·대표·사업자번호·연락처·주소·로고·도장) 추가
--   · 브랜드 자산(로고/도장) 저장용 Storage 버킷 + workspace 단위 RLS
-- ════════════════════════════════════════════════════════════════════════

alter table public.workspaces add column if not exists biz_name    text;
alter table public.workspaces add column if not exists biz_owner   text; -- 대표자
alter table public.workspaces add column if not exists biz_reg_no  text; -- 사업자등록번호
alter table public.workspaces add column if not exists biz_phone   text;
alter table public.workspaces add column if not exists biz_address text;
alter table public.workspaces add column if not exists logo_path   text; -- Storage 경로
alter table public.workspaces add column if not exists stamp_path  text; -- 도장 이미지 경로

-- ── Storage 버킷 + 정책 (Supabase storage 스키마가 있을 때만) ────────────
-- 경로 규약: brand/{workspace_id}/logo-*.png, brand/{workspace_id}/stamp-*.png
-- 로컬 stub(스토리지 없음)에서는 건너뛴다.
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('brand', 'brand', false)
    on conflict (id) do nothing;

    drop policy if exists "brand_select_member" on storage.objects;
    create policy "brand_select_member" on storage.objects for select to authenticated
      using (
        bucket_id = 'brand'
        and (storage.foldername(name))[1] in (
          select workspace_id::text from public.members
          where user_id = auth.uid() and status <> 'disabled'
        )
      );

    drop policy if exists "brand_insert_member" on storage.objects;
    create policy "brand_insert_member" on storage.objects for insert to authenticated
      with check (
        bucket_id = 'brand'
        and (storage.foldername(name))[1] in (
          select workspace_id::text from public.members
          where user_id = auth.uid() and status <> 'disabled'
        )
      );

    drop policy if exists "brand_update_member" on storage.objects;
    create policy "brand_update_member" on storage.objects for update to authenticated
      using (
        bucket_id = 'brand'
        and (storage.foldername(name))[1] in (
          select workspace_id::text from public.members
          where user_id = auth.uid() and status <> 'disabled'
        )
      );

    drop policy if exists "brand_delete_member" on storage.objects;
    create policy "brand_delete_member" on storage.objects for delete to authenticated
      using (
        bucket_id = 'brand'
        and (storage.foldername(name))[1] in (
          select workspace_id::text from public.members
          where user_id = auth.uid() and status <> 'disabled'
        )
      );
  end if;
end$$;
