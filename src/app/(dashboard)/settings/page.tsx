"use client";

import { useEffect, useState } from "react";
import { Settings, Key, CheckCircle2, XCircle, Loader2, RefreshCw, Calendar } from "lucide-react";
import { YoutubeIcon, InstagramIcon, ThreadsIcon } from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  getThreadsToken,
  setThreadsToken,
  clearThreadsToken,
  validateToken,
  refreshTokenNow,
  getTokenInfo,
  type ThreadsUser,
} from "@/lib/api/threads";

interface TokenInfo {
  token: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
  ageInDays: number | null;
  daysUntilExpiry: number | null;
}

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ ok: boolean; profile?: ThreadsUser; error?: string } | null>(null);
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const t = getThreadsToken();
    setSavedToken(t);
    if (t) setToken(t);
    setInfo(getTokenInfo());
  }, []);

  async function handleSave() {
    if (!token || token.length < 10) {
      setValidation({ ok: false, error: "토큰이 너무 짧습니다" });
      return;
    }
    setThreadsToken(token);
    setSavedToken(token);
    setInfo(getTokenInfo());
    setValidating(true);
    setValidation(null);
    const r = await validateToken();
    setValidating(false);
    setValidation({ ok: r.valid, profile: r.profile, error: r.error });
  }

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshResult(null);
    const r = await refreshTokenNow();
    setRefreshing(false);
    setInfo(getTokenInfo());
    if (r.ok) {
      setSavedToken(getThreadsToken());
      setToken(getThreadsToken() || "");
      setRefreshResult({ ok: true, msg: `갱신 완료. 새 만료일: ${r.expiresAt?.toLocaleDateString("ko-KR")}` });
    } else {
      setRefreshResult({ ok: false, msg: r.error || "갱신 실패" });
    }
  }

  function handleClear() {
    clearThreadsToken();
    setToken("");
    setSavedToken(null);
    setValidation(null);
    setInfo(null);
    setRefreshResult(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Settings className="h-7 w-7 text-muted-foreground" />
          설정
        </h1>
        <p className="mt-1 text-muted-foreground">
          API 키와 연결 계정을 관리하세요
        </p>
      </div>

      <div className="space-y-6">
        {/* YouTube API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <YoutubeIcon className="h-5 w-5 text-red-500" />
              <CardTitle>YouTube Data API</CardTitle>
            </div>
            <CardDescription>
              hottam-api Worker 시크릿(YOUTUBE_API_KEY)에 등록되어 있습니다. 별도 설정 불필요.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              일일 무료 할당량: 10,000 유닛. 운영자 측에서 관리됩니다.
            </p>
          </div>
        </Card>

        {/* Threads API — BYOT */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ThreadsIcon className="h-5 w-5" />
              <CardTitle>Threads Access Token</CardTitle>
            </div>
            <CardDescription>
              본인 Meta Developer 앱에서 발급한 토큰을 입력하세요. 브라우저 localStorage 에만 저장되며 서버로 전송되지 않습니다.
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Access Token</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="password"
                  placeholder="THAA..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSave}
                  disabled={validating || !token}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장 + 검증"}
                </button>
                {savedToken && (
                  <button
                    onClick={handleClear}
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>

            {validation && (
              <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                validation.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              }`}>
                {validation.ok
                  ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  : <XCircle className="h-5 w-5 flex-shrink-0" />}
                <div>
                  {validation.ok && validation.profile ? (
                    <>
                      <div className="font-medium">검증 성공</div>
                      <div className="mt-1 text-xs">@{validation.profile.username} · {validation.profile.name}</div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium">검증 실패</div>
                      <div className="mt-1 text-xs">{validation.error}</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 토큰 만료/갱신 정보 */}
            {savedToken && info && info.expiresAt && (
              <div className="rounded-lg border border-border bg-secondary/30 p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">토큰 자동 갱신</span>
                      <span className={`rounded px-2 py-0.5 text-xs ${
                        (info.daysUntilExpiry ?? 0) > 10
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : (info.daysUntilExpiry ?? 0) > 0
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}>
                        {info.daysUntilExpiry !== null && info.daysUntilExpiry > 0
                          ? `${Math.floor(info.daysUntilExpiry)}일 남음`
                          : "만료됨"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      발급일: {info.issuedAt?.toLocaleDateString("ko-KR")}
                      {info.ageInDays !== null && ` · ${info.ageInDays.toFixed(0)}일 경과`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      만료일: {info.expiresAt.toLocaleDateString("ko-KR")} ({info.expiresAt.toLocaleTimeString("ko-KR")})
                    </div>
                    <div className="mt-2 rounded bg-background/50 p-2 text-xs text-muted-foreground">
                      💡 hottam을 1~2달에 한 번이라도 들어오시면 <strong>50일째에 자동으로 갱신</strong>됩니다.
                      한번 발급한 토큰이 사실상 영구로 유지됩니다.
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-secondary disabled:opacity-50"
                  >
                    {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    수동 갱신
                  </button>
                  {refreshResult && (
                    <span className={`text-xs ${refreshResult.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                      {refreshResult.msg}
                    </span>
                  )}
                </div>
              </div>
            )}

            <details className="rounded-lg border border-border bg-secondary/50 p-3 text-sm">
              <summary className="cursor-pointer font-medium">토큰 발급 가이드 (3분)</summary>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs text-muted-foreground">
                <li>
                  <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Meta Developer Console
                  </a>
                  에서 새 앱 생성 (유형: <strong>비즈니스</strong>)
                </li>
                <li>앱에 <strong>Threads API</strong> 제품 추가</li>
                <li>설정 → 기본 → <strong>Threads API 사용 케이스</strong>에서 다음 권한 활성화:
                  <ul className="mt-1 list-disc pl-5">
                    <li><code className="rounded bg-background px-1">threads_basic</code></li>
                    <li><code className="rounded bg-background px-1">threads_content_publish</code></li>
                    <li><code className="rounded bg-background px-1">threads_manage_insights</code></li>
                    <li><code className="rounded bg-background px-1">threads_keyword_search</code></li>
                    <li><code className="rounded bg-background px-1">threads_manage_replies</code></li>
                  </ul>
                </li>
                <li><strong>Tools → Graph API Explorer</strong> 에서 위 권한 모두 체크 후 토큰 생성</li>
                <li>발급된 단기 토큰을 <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Access Token Debugger</a>에서 <strong>장기(60일) 토큰</strong>으로 교환</li>
                <li>그 장기 토큰을 위 입력란에 붙여넣고 [저장 + 검증]</li>
              </ol>
              <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">
                ⚠ 60일마다 토큰 갱신 필요. 만료 1~2주 전 알림 추가 예정.
              </p>
            </details>

            <a
              href="https://developers.facebook.com/docs/threads/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Key className="h-3.5 w-3.5" />
              Meta 공식 Threads API 시작 가이드
            </a>
          </div>
        </Card>

        {/* Instagram API (placeholder) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <InstagramIcon className="h-5 w-5 text-pink-500" />
              <CardTitle>Instagram Graph API</CardTitle>
            </div>
            <CardDescription>
              Instagram Graph API 통합 (예정). 비즈니스/크리에이터 계정 필요.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
