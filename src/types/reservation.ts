import type { Prisma } from "@prisma/client";

export type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    tables: { include: { table: true } };
    source: true;
    customer: true;
  };
}>;

export type ReservationDetail = Prisma.ReservationGetPayload<{
  include: {
    tables: { include: { table: true } };
    source: true;
    customer: true;
    lineUser: true;
    logs: true;
  };
}>;

export interface DashboardSummary {
  date: string;
  isToday: boolean;
  reservationCount: number;
  totalPartySize: number;
  currentlySeatedCount: number;
  upcomingPartySize: number;
  cancelledCount: number;
  seatsTotal: number;
  availableSeatsNow: number;
  storeName: string;
}

export interface CapacitySlot {
  time: string;
  reservedSeats: number;
  availableSeats: number;
  capacityRatio: number;
}
