"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Users, Eye, Heart, MessageCircle, Repeat2, Quote, Loader2, ExternalLink, AtSign } from "lucide-react";
import {
  getMyProfile,
  getMyThreads,
  getMyInsights,
  getMyMentions,
  type ThreadsUser,
  type ThreadsPost,
  type ThreadsInsightsResponse,
  ThreadsAuthError,
} from "@/lib/api/threads";

function formatNum(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString("ko-KR");
}

function metricIcon(name: string) {
  if (/view/i.test(name)) return <Eye className="h-5 w-5" />;
  if (/like/i.test(name)) return <Heart className="h-5 w-5" />;
  if (/repl/i.test(name)) return <MessageCircle className="h-5 w-5" />;
  if (/repost/i.test(name)) return <Repeat2 className="h-5 w-5" />;
  if (/quote/i.test(name)) return <Quote className="h-5 w-5" />;
  if (/follow/i.test(name)) return <Users className="h-5 w-5" />;
  return <BarChart3 className="h-5 w-5" />;
}

export default function ThreadsAccountPage() {
  const [profile, setProfile] = useState<ThreadsUser | null>(null);
  const [insights, setInsights] = useState<ThreadsInsightsResponse | null>(null);
  const [posts, setPosts] = useState<ThreadsPost[]>([]);
  const [mentions, setMentions] = useState<ThreadsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      setAuthMissing(false);
      try {
        const [p, i, t, m] = await Promise.allSettled([
          getMyProfile(),
          getMyInsights(),
          getMyThreads(20),
          getMyMentions(15),
        ]);
        if (p.status === "fulfilled") setProfile(p.value);
        if (i.status === "fulfilled") setInsights(i.value);
        if (t.status === "fulfilled") setPosts(t.value.data);
        if (m.status === "fulfilled") setMentions(m.value.data);
        const firstReject = [p, i, t, m].find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
        if (firstReject) {
          if (firstReject.reason instanceof ThreadsAuthError) {
            setAuthMissing(true);
          } else {
            setError((firstReject.reason as Error).message);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (authMissing) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-purple-500" />
          <h1 className="text-2xl font-bold">계정 분석</h1>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
          <h3 className="font-semibold text-amber-900 dark:text-amber-300">Access Token 미설정</h3>
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-400">
            계정 분석을 사용하려면 본인 Threads Access Token이 필요합니다.
          </p>
          <Link href="/settings" className="mt-3 inline-block text-sm font-medium text-amber-900 underline dark:text-amber-300">
            → 설정에서 토큰 입력하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-purple-500" />
        <h1 className="text-2xl font-bold">계정 분석</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          ⚠ 일부 데이터 로드 실패: {error}
        </div>
      )}

      {/* 프로필 */}
      {profile && (
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          {profile.threads_profile_picture_url && (
            <img src={profile.threads_profile_picture_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <div>
            <div className="text-lg font-semibold">{profile.name || profile.username}</div>
            <div className="text-sm text-muted-foreground">@{profile.username}</div>
            {profile.threads_biography && (
              <p className="mt-1 max-w-2xl text-sm">{profile.threads_biography}</p>
            )}
          </div>
        </div>
      )}

      {/* 인사이트 메트릭 카드 */}
      {insights && insights.data.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">계정 인사이트</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {insights.data.map((m) => {
              const total = m.total_value?.value ?? m.values?.[0]?.value ?? 0;
              return (
                <div key={m.name} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {metricIcon(m.name)}
                    <span className="text-xs">{m.title || m.name}</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{formatNum(total)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 최근 게시물 */}
      {posts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            최근 내 게시물 ({posts.length})
          </h2>
          <div className="space-y-3">
            {posts.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                <header className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(p.timestamp).toLocaleString("ko-KR")}</span>
                  {p.permalink && (
                    <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                      <ExternalLink className="h-3.5 w-3.5" /> 보기
                    </a>
                  )}
                </header>
                <p className="whitespace-pre-wrap text-sm">{p.text}</p>
                {p.media_url && p.media_type === "IMAGE" && (
                  <img src={p.media_url} alt={p.alt_text || ""} className="mt-3 max-h-72 rounded-lg object-cover" loading="lazy" />
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* 멘션 */}
      {mentions.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AtSign className="h-4 w-4" /> 멘션 ({mentions.length})
          </h2>
          <div className="space-y-3">
            {mentions.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                <header className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  {p.username && <span className="font-medium text-foreground">@{p.username}</span>}
                  <span className="ml-auto">{new Date(p.timestamp).toLocaleString("ko-KR")}</span>
                </header>
                <p className="whitespace-pre-wrap text-sm">{p.text}</p>
                {p.permalink && (
                  <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                    <ExternalLink className="h-3 w-3" /> Threads에서 보기
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {!profile && !insights && posts.length === 0 && mentions.length === 0 && !error && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          데이터가 없습니다. 토큰 권한을 확인하세요.
        </div>
      )}
    </div>
  );
}
