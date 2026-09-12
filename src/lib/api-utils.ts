import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AvailabilityError, InvalidTransitionError } from "@/server/reservations";
import { LineAuthError } from "@/server/line/verify-id-token";
import { LineReservationAccessError } from "@/server/line/reservations";
import { ExternalAuthError } from "@/lib/external-auth";
import { ZodError } from "zod";

export async function requireActor(): Promise<{
  email: string;
  storeId: string | null;
  role: string;
}> {
  const session = await auth();
  if (!session?.user?.email) {
    throw new UnauthorizedError();
  }
  return { email: session.user.email, storeId: session.user.storeId, role: session.user.role };
}

/** ADMIN権限が必要な操作(店舗設定変更など)向け。 */
export async function requireAdminActor(): Promise<{ email: string; storeId: string | null }> {
  const actor = await requireActor();
  if (actor.role !== "ADMIN") {
    throw new ForbiddenError("この操作には管理者権限が必要です。");
  }
  return actor;
}

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AvailabilityError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        suggestion: error.suggestion,
        conflictingTableIds: error.conflictingTableIds,
      },
      { status: 409 }
    );
  }
  if (error instanceof InvalidTransitionError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof LineAuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof LineReservationAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ExternalAuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "入力内容に誤りがあります。", details: error.flatten() },
      { status: 400 }
    );
  }
  console.error(error);
  const message = error instanceof Error ? error.message : "予期しないエラーが発生しました。";
  return NextResponse.json({ error: message }, { status: 500 });
}
