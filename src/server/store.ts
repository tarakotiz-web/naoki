import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * ログイン中スタッフに紐づく店舗を取得する。
 * ADMIN(storeId=null)の場合は暫定的に先頭の店舗を返す。
 * 将来の複数店舗対応では、ここにヘッダー/クエリでの店舗切り替えを追加する。
 */
export async function getCurrentStore() {
  const session = await auth();
  if (session?.user?.storeId) {
    const store = await prisma.store.findUnique({ where: { id: session.user.storeId } });
    if (store) return store;
  }
  const fallback = await prisma.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!fallback) {
    throw new Error("店舗が登録されていません。管理者にお問い合わせください。");
  }
  return fallback;
}
