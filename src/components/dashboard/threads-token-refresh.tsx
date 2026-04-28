"use client";

import { useEffect } from "react";
import { maybeRefresh } from "@/lib/api/threads";

// dashboard 진입 시 1회 실행. 토큰이 50일 이상 됐으면 백그라운드로 갱신.
// 사용자에게 보이는 UI는 없음. 콘솔 로그만 남김.
export function ThreadsTokenRefresh() {
  useEffect(() => {
    maybeRefresh().then((r) => {
      if (r.refreshed) {
        console.log("[Threads] token auto-refreshed:", r.reason);
      }
    });
  }, []);
  return null;
}
