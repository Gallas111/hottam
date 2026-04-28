"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TrendingUp, BarChart3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ThreadsIcon } from "@/components/ui/icons";
import { getThreadsToken } from "@/lib/api/threads";

export default function ThreadsPage() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    setHasToken(!!getThreadsToken());
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <ThreadsIcon className="h-7 w-7" />
          쓰레드 분석
        </h1>
        <p className="mt-1 text-muted-foreground">
          Meta 공식 Threads API 로 게시물·인사이트·키워드 트렌드 수집
        </p>
      </div>

      {/* 토큰 상태 배너 */}
      {hasToken === false && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-300">Access Token 미설정</h3>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
              Threads 분석을 사용하려면 본인 Meta Developer 앱의 Access Token을 입력해야 합니다.
              브라우저 localStorage 에만 저장되며 서버로 전송되지 않습니다.
            </p>
            <Link
              href="/settings"
              className="mt-2 inline-block text-sm font-medium text-amber-900 underline dark:text-amber-300"
            >
              → 설정에서 토큰 입력하기
            </Link>
          </div>
        </div>
      )}
      {hasToken === true && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm text-emerald-800 dark:text-emerald-400">
            Access Token 등록됨. 모든 기능 사용 가능.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/threads/trending"
          className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-purple-300 hover:shadow-md"
        >
          <TrendingUp className="h-8 w-8 text-purple-500 transition-transform group-hover:scale-110" />
          <h2 className="mt-3 text-lg font-semibold">트렌딩</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            카테고리·키워드·해시태그별 인기 쓰레드 자동 발굴 (1번·4번)
          </p>
        </Link>

        <Link
          href="/threads/account"
          className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-purple-300 hover:shadow-md"
        >
          <BarChart3 className="h-8 w-8 text-purple-500 transition-transform group-hover:scale-110" />
          <h2 className="mt-3 text-lg font-semibold">계정 분석</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            내 게시물 성과 + 팔로워 추이 + 멘션 모니터링 (3번)
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-secondary/30 p-5">
        <h3 className="font-semibold">사용 흐름</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li><Link href="/settings" className="text-primary hover:underline">설정</Link>에서 본인 Threads Access Token 입력 (1회)</li>
          <li><strong>트렌딩</strong>에서 분야 선택 → 인기 게시물 발굴 (분야별 / 해시태그)</li>
          <li><strong>계정 분석</strong>에서 본인 계정 성과 모니터링</li>
        </ol>
      </div>
    </div>
  );
}
