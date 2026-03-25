"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Hash,
  BarChart3,
  Users,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface VideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    tags?: string[];
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatNum(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString("ko-KR");
}

function toKST(dateStr: string): Date {
  const d = new Date(dateStr);
  // Convert to KST (UTC+9)
  return new Date(d.getTime() + 9 * 60 * 60 * 1000);
}

export default function YouTubeInsightsPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/youtube/trending?max=50");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setVideos(data.videos || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "데이터를 불러올 수 없습니다"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // === Analysis computations ===

  // Hour distribution (KST)
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0); // 0=Sun, 1=Mon ... 6=Sat

  videos.forEach((v) => {
    const kst = toKST(v.snippet.publishedAt);
    hourCounts[kst.getUTCHours()]++;
    dayCounts[kst.getUTCDay()]++;
  });

  const maxHourCount = Math.max(...hourCounts, 1);
  const maxDayCount = Math.max(...dayCounts, 1);

  // Top 3 hours
  const topHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Top day
  const topDay = dayCounts
    .map((count, day) => ({ day, count }))
    .sort((a, b) => b.count - a.count)[0];

  // Tag frequency
  const tagMap = new Map<string, number>();
  videos.forEach((v) => {
    v.snippet.tags?.forEach((tag) => {
      const lower = tag.toLowerCase();
      tagMap.set(lower, (tagMap.get(lower) || 0) + 1);
    });
  });

  const sortedTags = [...tagMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  const maxTagCount = sortedTags.length > 0 ? sortedTags[0][1] : 1;

  // Channel frequency
  const channelMap = new Map<
    string,
    { name: string; id: string; count: number }
  >();
  videos.forEach((v) => {
    const key = v.snippet.channelId;
    const existing = channelMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      channelMap.set(key, {
        name: v.snippet.channelTitle,
        id: v.snippet.channelId,
        count: 1,
      });
    }
  });

  const topChannels = [...channelMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Copy tag to clipboard
  async function copyTag(tag: string) {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 1500);
    } catch {
      // fallback
    }
  }

  // Tag pill size based on frequency
  function tagSize(count: number): string {
    const ratio = count / maxTagCount;
    if (ratio >= 0.7) return "text-base px-3.5 py-1.5 font-semibold";
    if (ratio >= 0.4) return "text-sm px-3 py-1 font-medium";
    return "text-xs px-2.5 py-1";
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <BarChart3 className="h-7 w-7 text-red-500" />
          유튜브 인사이트
        </h1>
        <p className="mt-1 text-muted-foreground">
          트렌딩 영상 데이터를 기반으로 최적 업로드 시간, 인기 태그, 인기 채널을
          분석합니다
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">
            트렌딩 데이터 분석 중...
          </span>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <StatCard
              title="분석 영상 수"
              value={videos.length}
              icon={TrendingUp}
            />
            <StatCard
              title="최적 업로드 시간"
              value={
                topHours.length > 0 ? `${topHours[0].hour}시` : "-"
              }
              change={
                topHours.length > 0
                  ? `트렌딩 영상 ${topHours[0].count}개가 이 시간에 업로드`
                  : undefined
              }
              changeType="positive"
              icon={Clock}
            />
            <StatCard
              title="최적 업로드 요일"
              value={topDay ? `${DAY_NAMES[topDay.day]}요일` : "-"}
              change={
                topDay
                  ? `트렌딩 영상 ${topDay.count}개가 이 요일에 업로드`
                  : undefined
              }
              changeType="positive"
              icon={Calendar}
            />
          </div>

          {/* Section 1: Best Upload Time */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Clock className="h-5 w-5 text-blue-500" />
              최적 업로드 시간 (KST)
            </h2>

            {/* Hour chart */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                시간대별 트렌딩 영상 수
              </h3>
              <div className="flex items-end gap-1" style={{ height: 160 }}>
                {hourCounts.map((count, hour) => {
                  const heightPct = maxHourCount > 0 ? (count / maxHourCount) * 100 : 0;
                  const isTop = topHours.some((t) => t.hour === hour);
                  return (
                    <div
                      key={hour}
                      className="group relative flex flex-1 flex-col items-center justify-end"
                      style={{ height: "100%" }}
                    >
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute -top-7 rounded bg-foreground px-2 py-0.5 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
                        {hour}시: {count}개
                      </div>
                      {/* Bar */}
                      <div
                        className={`w-full min-h-[2px] rounded-t transition-all ${
                          isTop
                            ? "bg-red-500"
                            : "bg-blue-400/60 dark:bg-blue-500/40"
                        }`}
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                      {/* Label */}
                      <span className="mt-1 text-[10px] text-muted-foreground">
                        {hour}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {topHours.map((t, i) => (
                  <span
                    key={t.hour}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                      i === 0
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {i === 0 ? "1위" : i === 1 ? "2위" : "3위"} {t.hour}시 (
                    {t.count}개)
                  </span>
                ))}
              </div>
            </div>

            {/* Day of week chart */}
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                요일별 트렌딩 영상 수
              </h3>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {/* Reorder to Mon-Sun (1,2,3,4,5,6,0) */}
                {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                  const count = dayCounts[dayIdx];
                  const heightPct =
                    maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
                  const isTop = topDay?.day === dayIdx;
                  return (
                    <div
                      key={dayIdx}
                      className="group relative flex flex-1 flex-col items-center justify-end"
                      style={{ height: "100%" }}
                    >
                      <div className="pointer-events-none absolute -top-7 rounded bg-foreground px-2 py-0.5 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
                        {count}개
                      </div>
                      <div
                        className={`w-full min-h-[2px] rounded-t transition-all ${
                          isTop
                            ? "bg-red-500"
                            : "bg-emerald-400/60 dark:bg-emerald-500/40"
                        }`}
                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                      />
                      <span
                        className={`mt-1 text-xs ${
                          isTop
                            ? "font-bold text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {DAY_NAMES[dayIdx]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Trending Tags */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Hash className="h-5 w-5 text-purple-500" />
              인기 태그 TOP 30
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              태그를 클릭하면 클립보드에 복사됩니다
            </p>

            {sortedTags.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                태그 데이터가 없습니다
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedTags.map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => copyTag(tag)}
                    className={`group relative inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary transition-all hover:border-purple-300 hover:bg-purple-50 dark:hover:border-purple-700 dark:hover:bg-purple-900/20 ${tagSize(
                      count
                    )}`}
                  >
                    <span>{tag}</span>
                    <span className="text-muted-foreground">({count})</span>
                    {copiedTag === tag ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Toast */}
            {copiedTag && (
              <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-400" />
                  &ldquo;{copiedTag}&rdquo; 복사됨!
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Trending Channels */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Users className="h-5 w-5 text-green-500" />
              인기 채널 TOP 10
            </h2>

            {topChannels.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                채널 데이터가 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {topChannels.map((ch, i) => {
                  const barWidth =
                    topChannels[0].count > 0
                      ? (ch.count / topChannels[0].count) * 100
                      : 0;
                  return (
                    <div key={ch.id} className="flex items-center gap-3">
                      <span
                        className={`w-7 flex-shrink-0 text-center text-sm font-bold ${
                          i < 3
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <a
                            href={`https://www.youtube.com/channel/${ch.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-sm font-medium hover:text-red-500 hover:underline"
                          >
                            {ch.name}
                          </a>
                          <span className="ml-2 flex-shrink-0 text-xs font-semibold text-muted-foreground">
                            {ch.count}개 영상
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all ${
                              i === 0
                                ? "bg-red-500"
                                : i < 3
                                  ? "bg-orange-400"
                                  : "bg-blue-400/60"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
