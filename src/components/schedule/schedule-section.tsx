"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Check, Camera, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  createTaskAction,
  updateTaskAction,
  toggleTaskAction,
  deleteTaskAction,
  reorderTasksAction,
} from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskPhotoSheet } from "@/components/schedule/task-photo-sheet";
import type { Task } from "@/lib/data/tasks";

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
const fmt = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

export function ScheduleSection({
  projectId,
  workspaceId,
  tasks,
  photoCounts,
}: {
  projectId: string;
  workspaceId: string;
  tasks: Task[];
  photoCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Task[]>(tasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoTask, setPhotoTask] = useState<Task | null>(null);
  const [newName, setNewName] = useState("");
  const [newDue, setNewDue] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => setItems(tasks), [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const today = localToday();
  const total = items.length;
  const done = items.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      const next = arrayMove(prev, oldIndex, newIndex);
      startTransition(async () => {
        const res = await reorderTasksAction({ project_id: projectId, ids: next.map((t) => t.id) });
        if (!res.ok) {
          toast.error(res.error);
          router.refresh();
        }
      });
      return next;
    });
  }

  function toggle(task: Task) {
    setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)));
    startTransition(async () => {
      const res = await toggleTaskAction({ id: task.id, done: !task.done });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  function add() {
    if (!newName.trim()) {
      toast.error("공정명을 입력해주세요.");
      return;
    }
    startTransition(async () => {
      const res = await createTaskAction({
        project_id: projectId,
        name: newName.trim(),
        due_on: newDue || null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setNewName("");
      setNewDue("");
      router.refresh();
    });
  }

  function saveEdit(id: string, name: string, due: string) {
    startTransition(async () => {
      const res = await updateTaskAction({ id, name, due_on: due || null });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      const res = await deleteTaskAction({ id });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* 진행률 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">공정 진행률</span>
          <span className="num font-bold">
            {done}/{total} · {pct}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-profit transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* 체크리스트 / 타임라인 */}
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
          공정을 추가해 일정을 관리하세요. 드래그로 순서를 바꿀 수 있어요.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {items.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  today={today}
                  photoCount={photoCounts[t.id] ?? 0}
                  editing={editingId === t.id}
                  onToggle={() => toggle(t)}
                  onStartEdit={() => setEditingId(t.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={(name, due) => saveEdit(t.id, name, due)}
                  onDelete={() => remove(t.id)}
                  onPhotos={() => setPhotoTask(t)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* 추가 */}
      <div className="space-y-2 rounded-lg border border-border bg-card p-3">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="공정명 (예: 도배, 타일, 전기)"
          className="h-11"
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="h-11 flex-1"
          />
          <Button type="button" variant="accent" size="lg" onClick={add}>
            <Plus className="size-4" /> 추가
          </Button>
        </div>
      </div>

      <TaskPhotoSheet
        open={Boolean(photoTask)}
        task={photoTask}
        workspaceId={workspaceId}
        onClose={() => setPhotoTask(null)}
      />
    </div>
  );
}

function TaskRow({
  task,
  today,
  photoCount,
  editing,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onPhotos,
}: {
  task: Task;
  today: string;
  photoCount: number;
  editing: boolean;
  onToggle: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (name: string, due: string) => void;
  onDelete: () => void;
  onPhotos: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const overdue = task.due_on && task.due_on < today && !task.done;

  const [name, setName] = useState(task.name);
  const [due, setDue] = useState(task.due_on ?? "");
  useEffect(() => {
    if (editing) {
      setName(task.name);
      setDue(task.due_on ?? "");
    }
  }, [editing, task.name, task.due_on]);

  if (editing) {
    return (
      <li ref={setNodeRef} style={style} className="rounded-lg border border-border bg-card p-3">
        <div className="space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-10" autoFocus />
          <div className="flex gap-2">
            <Input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="h-10 flex-1"
            />
            <Button type="button" variant="outline" size="default" onClick={onCancelEdit}>
              취소
            </Button>
            <Button type="button" variant="accent" size="default" onClick={() => onSaveEdit(name, due)}>
              저장
            </Button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-border bg-card p-2.5",
        isDragging && "opacity-70 shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label="순서 이동"
        className="tap-target flex touch-none items-center justify-center text-muted-foreground/60"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* 완료 체크 (타임라인 점) */}
      <button
        type="button"
        aria-label={task.done ? "완료 취소" : "완료"}
        onClick={onToggle}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.done
            ? "border-success bg-success text-success-foreground"
            : "border-border text-transparent hover:border-success",
        )}
      >
        <Check className="size-4" />
      </button>

      <div className="min-w-0 flex-1" onClick={onStartEdit}>
        <p className={cn("truncate text-sm font-medium", task.done && "text-muted-foreground line-through")}>
          {task.name}
        </p>
        {task.due_on ? (
          <p className={cn("text-xs", overdue ? "font-semibold text-loss" : "text-muted-foreground")}>
            {fmt(task.due_on)}
            {overdue ? " · 지연" : ""}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        aria-label="사진"
        onClick={onPhotos}
        className="tap-target relative flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <Camera className="size-4.5" />
        {photoCount > 0 ? (
          <span className="num absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
            {photoCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        aria-label="수정"
        onClick={onStartEdit}
        className="tap-target flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        aria-label="삭제"
        onClick={onDelete}
        className="tap-target flex items-center justify-center text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </li>
  );
}
