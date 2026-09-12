"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { ReservationDetail } from "@/types/reservation";
import type { ReservationSource, Table } from "@prisma/client";
import { sourceIcon } from "@/lib/reservation-source";

interface CustomerPreview {
  id: string;
  name: string;
  visitCount: number;
  lastVisitAt: string | null;
  notes: string | null;
  lineUser: { displayName: string | null } | null;
}

export function ReservationFormModal({
  open,
  onClose,
  onSaved,
  mode,
  reservation,
  defaultDate,
  tables,
  sources,
  defaultDurationMinutes,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode: "create" | "edit";
  reservation?: ReservationDetail | null;
  defaultDate: string;
  tables: Table[];
  sources: ReservationSource[];
  defaultDurationMinutes: number;
}) {
  const [reservationDate, setReservationDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("12:00");
  const [durationMinutes, setDurationMinutes] = useState(defaultDurationMinutes);
  const [partySize, setPartySize] = useState(2);
  const [adultCount, setAdultCount] = useState<string>("");
  const [childCount, setChildCount] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [tableIds, setTableIds] = useState<string[]>([]);
  const [sourceCode, setSourceCode] = useState(sources[0]?.code ?? "manual");
  const [menu, setMenu] = useState("");
  const [allergyInfo, setAllergyInfo] = useState("");
  const [hasStroller, setHasStroller] = useState(false);
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [anniversaryNote, setAnniversaryNote] = useState("");
  const [customerRequest, setCustomerRequest] = useState("");
  const [staffMemo, setStaffMemo] = useState("");

  const [customerPreview, setCustomerPreview] = useState<CustomerPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && reservation) {
      setReservationDate(reservation.reservationDate.toString().slice(0, 10));
      setStartTime(reservation.startTime);
      setDurationMinutes(reservation.durationMinutes);
      setPartySize(reservation.partySize);
      setAdultCount(reservation.adultCount?.toString() ?? "");
      setChildCount(reservation.childCount?.toString() ?? "");
      setCustomerName(reservation.customerName);
      setPhone(reservation.phone);
      setTableIds(reservation.tables.map((t) => t.tableId));
      setSourceCode(reservation.source.code);
      setMenu(reservation.menu ?? "");
      setAllergyInfo(reservation.allergyInfo ?? "");
      setHasStroller(reservation.hasStroller);
      setIsAnniversary(reservation.isAnniversary);
      setAnniversaryNote(reservation.anniversaryNote ?? "");
      setCustomerRequest(reservation.customerRequest ?? "");
      setStaffMemo(reservation.staffMemo ?? "");
    } else {
      setReservationDate(defaultDate);
      setStartTime("12:00");
      setDurationMinutes(defaultDurationMinutes);
      setPartySize(2);
      setAdultCount("");
      setChildCount("");
      setCustomerName("");
      setPhone("");
      setTableIds([]);
      setSourceCode(sources[0]?.code ?? "manual");
      setMenu("");
      setAllergyInfo("");
      setHasStroller(false);
      setIsAnniversary(false);
      setAnniversaryNote("");
      setCustomerRequest("");
      setStaffMemo("");
    }
    setError(null);
    setSuggestion(null);
    setCustomerPreview(null);
  }, [open, mode, reservation, defaultDate, defaultDurationMinutes, sources]);

  // 電話番号入力から既存顧客を照会(要件9: 予約登録画面からそのまま確認)
  useEffect(() => {
    const normalized = phone.replace(/[^\d+]/g, "");
    if (normalized.length < 8) {
      setCustomerPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(normalized)}`);
        const data = await res.json();
        if (data.customer) {
          setCustomerPreview({
            id: data.customer.id,
            name: data.customer.name,
            visitCount: data.customer.visitCount,
            lastVisitAt: data.customer.lastVisitAt,
            notes: data.customer.notes,
            lineUser: data.customer.lineUser,
          });
          if (mode === "create" && !customerName) setCustomerName(data.customer.name);
        } else {
          setCustomerPreview(null);
        }
      } catch {
        // 照会失敗は致命的ではないため無視
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const selectedTableSeats = useMemo(
    () => tables.filter((t) => tableIds.includes(t.id)).reduce((s, t) => s + t.maxSeats, 0),
    [tables, tableIds]
  );

  function toggleTable(id: string) {
    setTableIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuggestion(null);

    const payload = {
      reservationDate,
      startTime,
      durationMinutes,
      partySize,
      adultCount: adultCount ? Number(adultCount) : undefined,
      childCount: childCount ? Number(childCount) : undefined,
      customerName,
      phone,
      tableIds: tableIds.length > 0 ? tableIds : undefined,
      sourceCode,
      menu: menu || undefined,
      allergyInfo: allergyInfo || undefined,
      hasStroller,
      isAnniversary,
      anniversaryNote: anniversaryNote || undefined,
      customerRequest: customerRequest || undefined,
      staffMemo: staffMemo || undefined,
    };

    try {
      const url = mode === "create" ? "/api/reservations" : `/api/reservations/${reservation!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました。");
        if (data.suggestion) setSuggestion(data.suggestion);
        setSubmitting(false);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("通信エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "新規予約登録" : "予約編集"}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-[var(--color-danger-light)] text-[var(--color-danger)] px-4 py-3 text-sm font-medium">
            {error}
            {suggestion && <div className="mt-1">おすすめの空き時間: {suggestion}</div>}
          </div>
        )}

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="予約日" required className="col-span-2 sm:col-span-1">
            <input
              type="date"
              required
              value={reservationDate}
              onChange={(e) => setReservationDate(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="予約時間" required>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="利用予定時間(分)" required>
            <input
              type="number"
              required
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="人数" required>
            <input
              type="number"
              required
              min={1}
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="input"
            />
          </Field>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Field label="顧客名" required>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input"
              placeholder="山田 太郎"
            />
          </Field>
          <Field label="電話番号" required>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="090-1234-5678"
            />
          </Field>
        </section>

        {customerPreview && (
          <div className="rounded-xl border border-[var(--color-azure-light)] bg-[var(--color-azure-light)] px-4 py-3 text-sm">
            <p className="font-bold text-[var(--color-azure-dark)]">
              既存顧客: {customerPreview.name}様(来店{customerPreview.visitCount}回)
              {customerPreview.lineUser && " ・ LINE連携あり"}
            </p>
            {customerPreview.lastVisitAt && (
              <p className="text-[var(--foreground-muted)]">
                前回来店: {customerPreview.lastVisitAt.slice(0, 10)}
              </p>
            )}
            {customerPreview.notes && (
              <p className="text-[var(--foreground-muted)] mt-1">メモ: {customerPreview.notes}</p>
            )}
          </div>
        )}

        <section>
          <p className="text-sm font-semibold mb-2">
            テーブル(任意・複数選択可){" "}
            {tableIds.length > 0 && (
              <span className="text-[var(--foreground-muted)] font-normal">
                合計定員 {selectedTableSeats}名
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {tables
              .filter((t) => t.isActive)
              .map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggleTable(t.id)}
                  className={`btn h-10 px-3 text-sm ${
                    tableIds.includes(t.id) ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {t.name}({t.maxSeats}名)
                </button>
              ))}
          </div>
        </section>

        <section>
          <p className="text-sm font-semibold mb-2">予約経路</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <button
                type="button"
                key={s.code}
                onClick={() => setSourceCode(s.code)}
                className={`btn h-10 px-3 text-sm ${
                  sourceCode === s.code ? "btn-gold" : "btn-secondary"
                }`}
              >
                {sourceIcon(s.code)} {s.label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Field label="大人人数">
            <input
              type="number"
              min={0}
              value={adultCount}
              onChange={(e) => setAdultCount(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="子ども人数">
            <input
              type="number"
              min={0}
              value={childCount}
              onChange={(e) => setChildCount(e.target.value)}
              className="input"
            />
          </Field>
        </section>

        <Field label="予約メニュー">
          <input
            type="text"
            value={menu}
            onChange={(e) => setMenu(e.target.value)}
            className="input"
            placeholder="コースA、誕生日プレートなど"
          />
        </Field>

        <Field label="アレルギー">
          <input
            type="text"
            value={allergyInfo}
            onChange={(e) => setAllergyInfo(e.target.value)}
            className="input"
            placeholder="例: 卵、小麦、ナッツ"
          />
        </Field>

        <section className="flex flex-wrap gap-4">
          <Checkbox label="ベビーカー" checked={hasStroller} onChange={setHasStroller} />
          <Checkbox label="記念日" checked={isAnniversary} onChange={setIsAnniversary} />
        </section>

        {isAnniversary && (
          <Field label="記念日メモ">
            <input
              type="text"
              value={anniversaryNote}
              onChange={(e) => setAnniversaryNote(e.target.value)}
              className="input"
              placeholder="誕生日、記念日など"
            />
          </Field>
        )}

        <Field label="顧客からの要望">
          <textarea
            value={customerRequest}
            onChange={(e) => setCustomerRequest(e.target.value)}
            className="input min-h-[70px]"
          />
        </Field>

        <Field label="店舗スタッフ用メモ">
          <textarea
            value={staffMemo}
            onChange={(e) => setStaffMemo(e.target.value)}
            className="input min-h-[70px]"
          />
        </Field>

        <div className="flex gap-3 pt-2 sticky bottom-0 bg-[var(--surface)] pb-1">
          <button type="button" onClick={onClose} className="btn btn-secondary h-12 flex-1">
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary h-12 flex-1 disabled:opacity-60"
          >
            {submitting ? "保存中..." : mode === "create" ? "予約を登録" : "変更を保存"}
          </button>
        </div>
      </form>
      <style jsx global>{`
        .input {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border);
          background: white;
          font-size: 15px;
        }
        textarea.input {
          height: auto;
          padding-top: 10px;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px var(--color-azure);
        }
      `}</style>
    </Modal>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-sm font-semibold mb-1.5">
        {label}
        {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 accent-[var(--color-azure)]"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
