import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAvailability } from "@/server/availability";
import { getCurrentStore } from "@/server/store";
import { requireActor, handleApiError } from "@/lib/api-utils";

const schema = z.object({
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMinutes: z.number().int().min(15).max(480),
  partySize: z.number().int().min(1).max(200),
  tableIds: z.array(z.string()).optional(),
  excludeReservationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireActor();
    const store = await getCurrentStore();
    const body = await req.json();
    const input = schema.parse(body);

    const { reservationDate, ...rest } = input;
    const result = await checkAvailability({ storeId: store.id, dateStr: reservationDate, ...rest });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
