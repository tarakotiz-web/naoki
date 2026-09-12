"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Store, Table, ReservationSource } from "@prisma/client";
import type {
  ReservationWithRelations,
  ReservationDetail,
  DashboardSummary,
  CapacitySlot,
} from "@/types/reservation";
import { todayDateString } from "@/lib/time";
import { DateSwitcher } from "./date-switcher";
import { SummaryCards } from "./summary-cards";
import { CapacityStrip } from "./capacity-strip";
import { ReservationList } from "./reservation-list";
import { ReservationTimeline } from "./reservation-timeline";
import { ReservationFormModal } from "./reservation-form-modal";
import { ReservationDetailModal } from "./reservation-detail-modal";
import { WalkInModal } from "./walk-in-modal";
import clsx from "clsx";

const POLL_INTERVAL_MS = 30_000;

export function ReservationBoard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || todayDateString();

  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");
  const [store, setStore] = useState<Store | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [sources, setSources] = useState<ReservationSource[]>([]);
  const [reservations, setReservations] = useState<ReservationWithRelations[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [capacity, setCapacity] = useState<CapacitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReservationDetail | null>(null);

  const setDate = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", next);
      router.push(`/reservations?${params.toString()}`);
    },
    [router, searchParams]
  );

  const loadStoreMeta = useCallback(async () => {
    const res = await fetch("/api/store");
    const data = await res.json();
    setStore(data.store);
    setTables(data.tables);
    setSources(data.sources);
  }, []);

  const loadDateData = useCallback(async () => {
    const [resReservations, resSummary, resCapacity] = await Promise.all([
      fetch(`/api/reservations?date=${date}`),
      fetch(`/api/reservations/summary?date=${date}`),
      fetch(`/api/reservations/capacity?date=${date}`),
    ]);
    const [dataReservations, dataSummary, dataCapacity] = await Promise.all([
      resReservations.json(),
      resSummary.json(),
      resCapacity.json(),
    ]);
    setReservations(dataReservations.reservations ?? []);
    setSummary(dataSummary);
    setCapacity(dataCapacity.slots ?? []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    loadStoreMeta();
  }, [loadStoreMeta]);

  useEffect(() => {
    setLoading(true);
    loadDateData();
    const interval = setInterval(loadDateData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadDateData]);

  function openDetail(r: ReservationWithRelations) {
    setDetailId(r.id);
    setDetailOpen(true);
  }

  function handleEditFromDetail(r: ReservationDetail) {
    setDetailOpen(false);
    setEditTarget(r);
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <DateSwitcher date={date} onChange={setDate} />
        <div className="flex items-center gap-1 bg-[var(--surface-muted)] rounded-full p-1">
          <button
            onClick={() => setViewMode("timeline")}
            className={clsx(
              "px-4 h-9 rounded-full text-sm font-semibold transition-colors",
              viewMode === "timeline" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--foreground-muted)]"
            )}
          >
            タイムライン
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "px-4 h-9 rounded-full text-sm font-semibold transition-colors",
              viewMode === "list" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--foreground-muted)]"
            )}
          >
            一覧
          </button>
        </div>
      </div>

      {summary && <SummaryCards summary={summary} />}
      {capacity.length > 0 && <CapacityStrip slots={capacity} />}

      {loading ? (
        <div className="card p-10 text-center text-[var(--foreground-muted)]">読み込み中...</div>
      ) : viewMode === "timeline" && store ? (
        <ReservationTimeline
          reservations={reservations}
          tables={tables}
          store={store}
          date={date}
          onSelect={openDetail}
        />
      ) : (
        <ReservationList reservations={reservations} onSelect={openDetail} />
      )}

      {/* 常時表示のアクションボタン */}
      <div className="fixed bottom-5 right-4 sm:right-8 z-30 flex flex-col gap-3 items-end">
        <button
          onClick={() => setWalkInOpen(true)}
          className="btn btn-gold h-14 px-5 text-sm shadow-[var(--shadow-float)]"
        >
          🚶 WALK-IN
        </button>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn btn-primary h-14 px-6 text-base shadow-[var(--shadow-float)]"
        >
          ＋ 予約追加
        </button>
      </div>

      {store && (
        <ReservationFormModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSaved={loadDateData}
          mode="create"
          defaultDate={date}
          tables={tables}
          sources={sources}
          defaultDurationMinutes={store.defaultDurationMinutes}
        />
      )}

      {store && (
        <ReservationFormModal
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={loadDateData}
          mode="edit"
          reservation={editTarget}
          defaultDate={date}
          tables={tables}
          sources={sources}
          defaultDurationMinutes={store.defaultDurationMinutes}
        />
      )}

      <ReservationDetailModal
        reservationId={detailId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onChanged={loadDateData}
        onEdit={handleEditFromDetail}
      />

      <WalkInModal
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onSaved={loadDateData}
        tables={tables}
      />
    </div>
  );
}
