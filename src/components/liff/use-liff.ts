"use client";

import { useEffect, useState } from "react";

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface LiffState {
  status: "loading" | "not_configured" | "error" | "ready";
  error: string | null;
  idToken: string | null;
  profile: LiffProfile | null;
}

/**
 * LIFF SDKの初期化・ログインをまとめたフック。
 * NEXT_PUBLIC_LINE_LIFF_ID が未設定の環境(LINE Developersアカウント未作成の間)では
 * status: "not_configured" を返し、呼び出し側で案内メッセージを出す。
 */
export function useLiff() {
  const [state, setState] = useState<LiffState>({
    status: "loading",
    error: null,
    idToken: null,
    profile: null,
  });

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    if (!liffId) {
      setState({ status: "not_configured", error: null, idToken: null, profile: null });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { default: liff } = await import("@line/liff");
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const idToken = liff.getIDToken();
        const rawProfile = await liff.getProfile();
        if (cancelled) return;
        setState({
          status: "ready",
          error: null,
          idToken,
          profile: {
            userId: rawProfile.userId,
            displayName: rawProfile.displayName,
            pictureUrl: rawProfile.pictureUrl,
          },
        });
      } catch (e) {
        if (cancelled) return;
        setState({
          status: "error",
          error: e instanceof Error ? e.message : "LIFFの初期化に失敗しました。",
          idToken: null,
          profile: null,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
