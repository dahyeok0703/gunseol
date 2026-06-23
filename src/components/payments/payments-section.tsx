"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, Plus, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";

import { cn, formatKRW } from "@/lib/utils";
import {
  createPaymentAction,
  updatePaymentAction,
  togglePaidAction,
  deletePaymentAction,
} from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Payment } from "@/lib/data/payments";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function PaymentsSection({
  projectId,
  payments,
  canEdit,
  today,
}: {
  projectId: string;
  payments: Payment[];
  canEdit: boolean;
  today: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Payment[]>(payments);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => setItems(payments), [payments]);

  const soonLimit = addDays(today, 7);
  const receivable = items.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const collected = items.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);

  function toggle(p: Payment) {
    const paid = p.status !== "paid";
    setItems((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, status: paid ? "paid" : "pending" } : x)),
    );
    startTransition(async () => {
      const res = await togglePaidAction({ id: p.id, paid });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }
  function add() {
    if (!label.trim()) return toast.error("항목명을 입력해주세요.");
    startTransition(async () => {
      const res = await createPaymentAction({
        project_id: projectId,
        label: label.trim(),
        amount: Number(amount) || 0,
        due_on: due || null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setLabel("");
      setAmount("");
      setDue("");
      setOpen(false);
      router.refresh();
    });
  }
  function saveEdit(id: string, l: string, a: string, d: string) {
    startTransition(async () => {
      const res = await updatePaymentAction({ id, label: l, amount: Number(a) || 0, due_on: d || null });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((p) => p.id !== id));
    startTransition(async () => {
      const res = await deletePaymentAction({ id });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* 받을 돈 / 받은 돈 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">받을 돈</p>
          <p className="num text-xl font-bold text-warning">{formatKRW(receivable)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">받은 돈</p>
          <p className="num text-xl font-bold text-profit">{formatKRW(collected)}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          계약금·중도금·잔금 등 수금 항목을 추가해 받을 돈을 추적하세요.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((p) => {
            if (editingId === p.id) {
              return (
                <PaymentEdit
                  key={p.id}
                  payment={p}
                  onCancel={() => setEditingId(null)}
                  onSave={(l, a, d) => saveEdit(p.id, l, a, d)}
                />
              );
            }
            const paid = p.status === "paid";
            const overdue = !paid && p.due_on && p.due_on < today;
            const soon = !paid && !overdue && p.due_on && p.due_on <= soonLimit;
            return (
              <li
                key={p.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-card p-3"
              >
                <button
                  type="button"
                  aria-label={paid ? "입금 취소" : "입금 완료"}
                  onClick={() => canEdit && toggle(p)}
                  disabled={!canEdit}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    paid
                      ? "border-profit bg-profit text-white"
                      : "border-border text-transparent hover:border-profit",
                    !canEdit && "cursor-default",
                  )}
                >
                  <Check className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm font-medium", paid && "text-muted-foreground")}>
                    {p.label}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {p.due_on ? <span>{fmt(p.due_on)}</span> : <span>예정일 없음</span>}
                    {overdue ? (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-loss">
                        <AlertTriangle className="size-3" /> 연체
                      </span>
                    ) : soon ? (
                      <span className="inline-flex items-center gap-0.5 font-semibold text-warning">
                        <Clock className="size-3" /> 임박
                      </span>
                    ) : null}
                  </div>
                </div>
                <span className={cn("num font-bold", paid ? "text-muted-foreground" : "")}>
                  {formatKRW(Number(p.amount))}
                </span>
                {canEdit ? (
                  <>
                    <button
                      type="button"
                      aria-label="수정"
                      onClick={() => setEditingId(p.id)}
                      className="tap-target flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="삭제"
                      onClick={() => remove(p.id)}
                      className="tap-target flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit ? (
        open ? (
          <div className="space-y-2 rounded-lg border border-border bg-card p-3">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="항목 (예: 계약금 / 중도금 / 잔금)"
              className="h-11"
              autoFocus
            />
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="금액"
                className="h-11 flex-1"
              />
              <Input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="h-11 flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button type="button" variant="accent" size="lg" className="flex-1" onClick={add}>
                추가
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> 수금 항목 추가
          </Button>
        )
      ) : null}
    </div>
  );
}

function PaymentEdit({
  payment,
  onCancel,
  onSave,
}: {
  payment: Payment;
  onCancel: () => void;
  onSave: (label: string, amount: string, due: string) => void;
}) {
  const [label, setLabel] = useState(payment.label);
  const [amount, setAmount] = useState(String(payment.amount));
  const [due, setDue] = useState(payment.due_on ?? "");
  return (
    <li className="space-y-2 rounded-lg border border-border bg-card p-3">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-10" autoFocus />
      <div className="flex gap-2">
        <Input
          type="number"
          min={0}
          step={10000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-10 flex-1"
        />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-10 flex-1" />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="default" className="flex-1" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="button"
          variant="accent"
          size="default"
          className="flex-1"
          onClick={() => onSave(label, amount, due)}
        >
          저장
        </Button>
      </div>
    </li>
  );
}
