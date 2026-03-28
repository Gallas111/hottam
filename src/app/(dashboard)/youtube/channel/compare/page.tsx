"use client";

import { useState } from "react";
import {
  BarChart3, Search, Users, Eye, Video, Trophy, Plus, X, Loader2,
  ThumbsUp, MessageCircle, TrendingUp, Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

const COLORS = ["#ef4444", "#3b82f6", "#22c55e"];

function formatNum(n: string | number) {
  const num = typeof n === "string" ? parseInt(n) : n;
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}천`;
  return num.toLocaleString("ko-KR");
}

function toNum(n: string | number) {
  return typeof n === "string" ? parseInt(n) || 0 : n;
}

function calcAvgEngagement(ch: ChannelData): number {
  if (!ch.videos || ch.videos.length === 0) return 0;
  const total = ch.videos.reduce((sum, v) => {
    const views = toNum(v.viewCount);
    const likes = toNum(v.likeCount);
    const comments = toNum(v.commentCount);
    return sum + (views > 0 ? ((likes + comments) / views) * 100 : 0);
  }, 0);
  return total / ch.videos.length;
}

function calcUploadFrequency(ch: ChannelData): string {
  if (!ch.videos || ch.videos.length < 2) return "-";
  const dates = ch.videos.map((v) => new Date(v.publishedAt).getTime()).sort((a, b) => b - a);
  const diffDays = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
  const avgDays = diffDays / (dates.length - 1);
  if (avgDays < 1) return "매일";
  if (avgDays < 3) return `${avgDays.toFixed(1)}일마다`;
  if (avgDays < 8) return `주 ${Math.round(7 / avgDays)}회`;
  if (avgDays < 32) return `월 ${Math.round(30 / avgDays)}회`;
  return `${Math.round(avgDays)}일마다`;
}

function calcAvgViews(ch: ChannelData): number {
  if (!ch.videos || ch.videos.length === 0) return 0;
  const total = ch.videos.reduce((sum, v) => sum + toNum(v.viewCount), 0);
  return Math.round(total / ch.videos.length);
}

type MetricKey = "subscribers" | "views" | "videos" | "avgViews" | "avgEngagement" | "uploadFreq";

function getMetricNumValue(ch: ChannelData, key: MetricKey): number {
  switch (key) {
    case "subscribers": return toNum(ch.subscriberCount);
    case "views": return toNum(ch.viewCount);
    case "videos": return toNum(ch.videoCount);
    case "avgViews": return calcAvgViews(ch);
    case "avgEngagement": return calcAvgEngagement(ch);
    case "uploadFreq": {
      if (!ch.videos || ch.videos.length < 2) return 0;
      const dates = ch.videos.map((v) => new Date(v.publishedAt).getTime()).sort((a, b) => b - a);
      const diffDays = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
      return (ch.videos.length - 1) / (diffDays || 1) * 30; // uploads per month
    }
  }
}

function getWinnerIndex(channels: ChannelData[], metric: MetricKey): number {
  let best = -1;
  let bestVal = -1;
  channels.forEach((ch, i) => {
    const val = getMetricNumValue(ch, metric);
    if (val > bestVal) { bestVal = val; best = i; }
  });
  return best;
}

export default function ChannelComparePage() {
  const [inputs, setInputs] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [error, setError] = useState("");

  function updateInput(idx: number, value: string) {
    setInputs((prev) => prev.map((v, i) => (i === idx ? value : v)));
  }
  function addInput() { if (inputs.length < 3) setInputs((prev) => [...prev, ""]); }
  function removeInput(idx: number) { if (inputs.length > 2) setInputs((prev) => prev.filter((_, i) => i !== idx)); }

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    const queries = inputs.filter((q) => q.trim());
    if (queries.length < 2) { setError("최소 2개의 채널을 입력해주세요"); return; }

    setLoading(true);
    setError("");
    setChannels([]);

    try {
      const results = await Promise.all(
        queries.map(async (q) => {
          const res = await fetch(`/api/youtube/channel?q=${encodeURIComponent(q.trim())}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `"${q}" 채널을 찾을 수 없습니다`);
          return data as ChannelData;
        })
      );
      setChannels(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  const metrics: { key: MetricKey; label: string; icon: typeof Users; format: (ch: ChannelData) => string }[] = [
    { key: "subscribers", label: "구독자 수", icon: Users, format: (ch) => formatNum(ch.subscriberCount) },
    { key: "views", label: "총 조회수", icon: Eye, format: (ch) => formatNum(ch.viewCount) },
    { key: "videos", label: "영상 수", icon: Video, format: (ch) => formatNum(ch.videoCount) },
    { key: "avgViews", label: "최근 영상 평균 조회수", icon: BarChart3, format: (ch) => formatNum(calcAvgViews(ch)) },
    { key: "avgEngagement", label: "평균 참여율", icon: TrendingUp, format: (ch) => `${calcAvgEngagement(ch).toFixed(2)}%` },
    { key: "uploadFreq", label: "업로드 빈도", icon: Calendar, format: (ch) => calcUploadFrequency(ch) },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Trophy className="h-7 w-7 text-yellow-500" />
          채널 비교
        </h1>
        <p className="mt-1 text-muted-foreground">유튜브 채널 2~3개를 나란히 비교 분석하세요</p>
      </div>

      <UsageGuide
        steps={[
          { title: "내 채널 + 경쟁 채널 1~2개를 입력하세요", description: "나보다 조금 앞서가는 채널을 비교 대상으로 넣으세요. 너무 큰 채널보다 비슷한 규모가 유용해요." },
          { title: "어떤 지표에서 지고 있는지 확인하세요", description: "구독자는 비슷한데 평균 조회수가 낮다면? 제목/썸네일에 문제가 있을 수 있어요." },
          { title: "참여율이 높은 채널의 전략을 배우세요", description: "참여율이 높은 채널은 댓글 유도, 질문형 제목 등 시청자 반응을 잘 이끌어내요." },
          { title: "업로드 빈도를 비교하고 내 목표를 세우세요", description: "경쟁 채널이 주 3회 올리는데 나는 월 2회라면, 빈도를 높이는 것만으로 성장할 수 있어요." },
        ]}
        tip="3개월마다 같은 채널을 다시 비교해보세요. 내가 얼마나 따라잡았는지 성장 추이를 확인할 수 있어요."
      />

      {/* Input Form */}
      <form onSubmit={handleCompare} className="mb-8">
        <div className="space-y-3">
          {inputs.map((input, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: COLORS[idx] }}>
                {idx + 1}
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => updateInput(idx, e.target.value)}
                  placeholder={`채널 ${idx + 1}: @handle 또는 채널 ID`}
                  className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {inputs.length > 2 && (
                <button type="button" onClick={() => removeInput(idx)} className="rounded-lg border border-border px-3 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          {inputs.length < 3 && (
            <button type="button" onClick={addInput} className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary">
              <Plus className="h-4 w-4" />채널 추가
            </button>
          )}
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "비교 중..." : "비교하기"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {/* Comparison Results */}
      {channels.length >= 2 && (
        <div>
          {/* Channel Headers */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((ch, i) => (
              <Card key={ch.id} className="text-center">
                <div className="mx-auto mb-2 h-1.5 w-20 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <img src={ch.thumbnailUrl} alt={ch.title} className="mx-auto h-20 w-20 rounded-full" />
                <h2 className="mt-3 text-lg font-bold">{ch.title}</h2>
                {ch.country && <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">{ch.country}</span>}
                <a href={`https://www.youtube.com/channel/${ch.id}`} target="_blank" rel="noopener noreferrer" className="mt-2 block text-xs text-muted-foreground hover:text-primary">
                  YouTube에서 보기
                </a>
              </Card>
            ))}
          </div>

          {/* Metrics Comparison with Visual Bars */}
          <Card className="mb-6">
            <CardHeader><CardTitle>지표 비교</CardTitle></CardHeader>
            <div className="space-y-1">
              {metrics.map((metric) => {
                const winnerIdx = getWinnerIndex(channels, metric.key);
                const maxVal = Math.max(...channels.map((ch) => getMetricNumValue(ch, metric.key)), 1);
                const Icon = metric.icon;
                return (
                  <div key={metric.key} className="rounded-lg px-4 py-3 hover:bg-secondary/50">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon className="h-4 w-4" />{metric.label}
                    </div>
                    <div className="space-y-2">
                      {channels.map((ch, i) => {
                        const val = getMetricNumValue(ch, metric.key);
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                          <div key={ch.id} className="flex items-center gap-3">
                            <div className="w-16 text-right text-xs font-medium text-muted-foreground">{ch.title.slice(0, 6)}</div>
                            <div className="flex-1">
                              <div className="h-6 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="flex h-full items-center justify-end rounded-full px-2 text-xs font-bold text-white transition-all"
                                  style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: COLORS[i] }}
                                >
                                  {metric.format(ch)}
                                </div>
                              </div>
                            </div>
                            {i === winnerIdx && <Trophy className="h-4 w-4 flex-shrink-0 text-yellow-500" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Overall Winner */}
          {(() => {
            const wins = channels.map((_, i) =>
              metrics.filter((m) => getWinnerIndex(channels, m.key) === i).length
            );
            const overallWinner = wins.indexOf(Math.max(...wins));
            return (
              <Card className="mb-6 border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10">
                <div className="flex items-center justify-center gap-3 py-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <span className="text-lg font-bold">{channels[overallWinner].title}</span>
                  <span className="text-sm text-muted-foreground">
                    {wins[overallWinner]}/{metrics.length} 항목 우승
                  </span>
                </div>
              </Card>
            );
          })()}

          {/* Recent Videos (Top 3 per channel) */}
          <Card>
            <CardHeader><CardTitle>최근 영상 비교</CardTitle></CardHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map((ch, chIdx) => (
                <div key={ch.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[chIdx] }} />
                    <span className="text-sm font-semibold">{ch.title}</span>
                  </div>
                  {(ch.videos || []).slice(0, 3).map((video) => (
                    <a key={video.id} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-border p-2 transition-colors hover:bg-secondary">
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full rounded-md object-cover" />
                      <p className="mt-2 line-clamp-2 text-xs font-medium">{video.title}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNum(video.viewCount)}</span>
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{formatNum(video.likeCount)}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{formatNum(video.commentCount)}</span>
                      </div>
                    </a>
                  ))}
                  {(!ch.videos || ch.videos.length === 0) && (
                    <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">최근 영상 없음</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {channels.length === 0 && !error && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">채널 핸들 또는 ID를 입력하고 비교하기를 눌러주세요</p>
          <p className="mt-1 text-sm text-muted-foreground">예: @channelA vs @channelB</p>
        </div>
      )}
    </div>
  );
}
