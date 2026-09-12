"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("メールアドレスまたはパスワードが正しくありません。");
      return;
    }
    router.push(searchParams.get("callbackUrl") || "/reservations");
    router.refresh();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top,_#eaf3ff,_#f5f6f8_55%)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--foreground)] text-[var(--color-gold)] text-2xl font-bold mb-4">
            N
          </div>
          <h1 className="text-xl font-bold tracking-tight">Cafe &amp; Restaurant NODE</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">予約管理システム</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">メールアドレス</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 px-4 rounded-[var(--radius-control)] border border-[var(--border)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-azure)]"
              placeholder="admin@node-cafe.example"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">パスワード</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 rounded-[var(--radius-control)] border border-[var(--border)] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-azure)]"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full h-12 text-base disabled:opacity-60"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
