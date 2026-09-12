import { Suspense } from "react";
import { ReservationBoard } from "@/components/reservations/board";

export default function ReservationsPage() {
  return (
    <Suspense>
      <ReservationBoard />
    </Suspense>
  );
}
