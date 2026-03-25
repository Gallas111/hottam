"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Search, Users, Eye, Video, ExternalLink, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";

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

          {/* Recent Videos */}
          {channel.videos && channel.videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>최근 영상</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {channel.videos.map((video) => (
                  <a
                    key={video.id}
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      loading="lazy"
                      className="h-16 w-28 flex-shrink-0 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">
                        {video.title}
                      </p>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        <span>조회수 {formatNum(video.viewCount)}</span>
                        <span>좋아요 {formatNum(video.likeCount)}</span>
                        <span>댓글 {formatNum(video.commentCount)}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </Card>
          )}
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
