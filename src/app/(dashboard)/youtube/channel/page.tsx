"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Search, Users, Eye, Video, ExternalLink, Trophy, TrendingUp, TrendingDown, ThumbsUp, MessageCircle } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { UsageGuide } from "@/components/ui/usage-guide";

interface ChannelData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  country?: string;
  videos: Array<{
    id: string;
    title: string;
    viewCount: string;
    likeCount: string;
    commentCount: string;
    publishedAt: string;
    thumbnailUrl: string;
    duration: string;
  }>;
}

export default function ChannelAnalysisPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setChannel(null);

    try {
      const res = await fetch(
        `/api/youtube/channel?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "채널을 찾을 수 없습니다");
      setChannel(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function formatNum(n: string | number) {
    const num = typeof n === "string" ? parseInt(n) : n;
    if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
    if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}천`;
    return num.toLocaleString("ko-KR");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <BarChart3 className="h-7 w-7 text-red-500" />
          채널 분석
        </h1>
        <p className="mt-1 text-muted-foreground">
          유튜브 채널 ID 또는 @핸들을 입력하세요
        </p>
      </div>

      <UsageGuide
        steps={[
          { title: "먼저 내 채널을 분석하세요", description: "내 @핸들을 입력해서 구독자 대비 조회수, 영상당 평균 성과를 확인하세요." },
          { title: "같은 주제의 경쟁 채널을 분석하세요", description: "나보다 구독자가 2~5배 많은 채널을 찾아서 어떤 영상이 잘 되는지 보세요." },
          { title: "경쟁 채널의 인기 영상 패턴을 파악하세요", description: "최근 영상 중 조회수가 유독 높은 영상의 주제, 제목, 썸네일을 분석하세요." },
          { title: "채널 비교 기능으로 나란히 비교하세요", description: "아래 '채널 비교하러 가기' 버튼으로 내 채널 vs 경쟁 채널을 직접 비교할 수 있어요." },
        ]}
        tip="구독자 수보다 '영상당 평균 조회수'가 더 중요해요. 구독자 대비 조회수가 높으면 알고리즘이 밀어주는 채널이에요."
      />

      <div className="mb-6">
        <Link
          href="/youtube/channel/compare"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
        >
          <Trophy className="h-4 w-4 text-yellow-500" />
          채널 비교
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="@channelhandle 또는 채널 ID 입력..."
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-500 px-6 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "분석 중..." : "분석"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {channel && (
        <div>
          {/* Channel Header */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <img
                src={channel.thumbnailUrl}
                alt={channel.title}
                loading="lazy"
                className="h-20 w-20 rounded-full"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{channel.title}</h2>
                  <a
                    href={`https://www.youtube.com/channel/${channel.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {channel.description}
                </p>
                {channel.country && (
                  <span className="mt-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {channel.country}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              title="구독자"
              value={formatNum(channel.subscriberCount)}
              icon={Users}
            />
            <StatCard
              title="총 조회수"
              value={formatNum(channel.viewCount)}
              icon={Eye}
            />
            <StatCard
              title="영상 수"
              value={formatNum(channel.videoCount)}
              icon={Video}
            />
          </div>

          {/* Best / Worst Videos */}
          {channel.videos && channel.videos.length >= 3 && (() => {
            const sorted = [...channel.videos].sort((a, b) => (parseInt(b.viewCount) || 0) - (parseInt(a.viewCount) || 0));
            const avgViews = Math.round(sorted.reduce((sum, v) => sum + (parseInt(v.viewCount) || 0), 0) / sorted.length);
            const best = sorted.slice(0, 3);
            const worst = sorted.slice(-3).reverse();

            function VideoRow({ video, badge, badgeColor }: { video: typeof sorted[0]; badge: string; badgeColor: string }) {
              const views = parseInt(video.viewCount) || 0;
              const ratio = avgViews > 0 ? (views / avgViews) : 0;
              return (
                <a href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-secondary">
                  <div className="relative flex-shrink-0">
                    <img src={video.thumbnailUrl} alt={video.title} loading="lazy" className="h-16 w-28 rounded-md object-cover" />
                    <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-xs font-bold text-white ${badgeColor}`}>{badge}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">{video.title}</p>
                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNum(video.viewCount)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{formatNum(video.likeCount)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatNum(video.commentCount)}</span>
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs font-semibold ${ratio >= 1.5 ? "text-green-500" : ratio >= 0.8 ? "text-blue-500" : "text-red-500"}`}>
                        채널 평균의 {ratio.toFixed(1)}배
                      </span>
                    </div>
                  </div>
                </a>
              );
            }

            return (
              <>
                <div className="mb-4 rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-xs text-muted-foreground">최근 영상 평균 조회수</p>
                  <p className="text-2xl font-bold">{formatNum(avgViews)}</p>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-green-500"><TrendingUp className="h-5 w-5" />베스트 영상 TOP 3</CardTitle></CardHeader>
                    <div className="space-y-2">{best.map((v, i) => <VideoRow key={v.id} video={v} badge={`#${i + 1}`} badgeColor="bg-green-500" />)}</div>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-red-500"><TrendingDown className="h-5 w-5" />저조한 영상 BOTTOM 3</CardTitle></CardHeader>
                    <div className="space-y-2">{worst.map((v, i) => <VideoRow key={v.id} video={v} badge={`#${sorted.length - 2 + i}`} badgeColor="bg-red-500" />)}</div>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle>전체 최근 영상</CardTitle></CardHeader>
                  <div className="space-y-3">
                    {channel.videos.map((video) => (
                      <a key={video.id} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-secondary">
                        <img src={video.thumbnailUrl} alt={video.title} loading="lazy" className="h-16 w-28 flex-shrink-0 rounded-md object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">{video.title}</p>
                          <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNum(video.viewCount)}</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{formatNum(video.likeCount)}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatNum(video.commentCount)}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </Card>
              </>
            );
          })()}
        </div>
      )}

      {!channel && !error && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            채널을 검색하면 구독자, 조회수, 최근 영상 등을 분석합니다
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            예: @channelhandle
          </p>
        </div>
      )}
    </div>
  );
}
