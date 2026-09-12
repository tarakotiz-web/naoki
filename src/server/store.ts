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

/**
 * スタッフのログインセッションを前提にしない店舗解決。
 * LINE予約(LIFF)や外部連携APIなど、ログイン不要な導線から呼び出す。
 *
 * `storeSlug` を渡すと複数店舗運用時にその店舗を明示的に選べる
 * (LIFFのURLに `?store=<slug>` を付与する、外部APIに `store` クエリを渡す等)。
 * 省略時は運用中の店舗が1つだけの現状に合わせ、先頭のアクティブな店舗にフォールバックする。
 */
export async function getDefaultStoreForPublicAccess(storeSlug?: string | null) {
  if (storeSlug) {
    const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
    if (store && store.isActive) return store;
  }

  const store = await prisma.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  if (!store) {
    throw new Error("店舗が登録されていません。");
  }
  return store;
}
