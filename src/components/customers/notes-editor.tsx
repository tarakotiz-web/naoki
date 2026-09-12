"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NotesEditor({ customerId, initialNotes }: { customerId: string; initialNotes: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full min-h-[100px] rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-sm"
        placeholder="顧客メモ(好み、注意事項など)"
      />
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn btn-primary h-10 px-4 text-sm">
          {saving ? "保存中..." : "メモを保存"}
        </button>
        {saved && <span className="text-sm text-[var(--color-success)]">保存しました</span>}
      </div>
    </div>
  );
}
