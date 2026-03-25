"use client";

import { useState } from "react";
import {
  BarChart3,
  Search,
  Users,
  Eye,
  Video,
  Trophy,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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

function formatNum(n: string | number) {
  const num = typeof n === "string" ? parseInt(n) : n;
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}천`;
  return num.toLocaleString("ko-KR");
}

function toNum(n: string | number) {
  return typeof n === "string" ? parseInt(n) : n;
}

type MetricKey = "subscribers" | "views" | "videos" | "avgViews" | "recentViews";

function getWinnerIndex(channels: ChannelData[], metric: MetricKey): number {
  let best = -1;
  let bestVal = -1;
  channels.forEach((ch, i) => {
    let val = 0;
    switch (metric) {
      case "subscribers":
        val = toNum(ch.subscriberCount);
        break;
      case "views":
        val = toNum(ch.viewCount);
        break;
      case "videos":
        val = toNum(ch.videoCount);
        break;
      case "avgViews": {
        const vc = toNum(ch.videoCount);
        val = vc > 0 ? toNum(ch.viewCount) / vc : 0;
        break;
      }
      case "recentViews":
        val = ch.videos?.[0] ? toNum(ch.videos[0].viewCount) : 0;
        break;
    }
    if (val > bestVal) {
      bestVal = val;
      best = i;
    }
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

  function addInput() {
    if (inputs.length < 3) {
      setInputs((prev) => [...prev, ""]);
    }
  }

  function removeInput(idx: number) {
    if (inputs.length > 2) {
      setInputs((prev) => prev.filter((_, i) => i !== idx));
    }
  }

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    const queries = inputs.filter((q) => q.trim());
    if (queries.length < 2) {
      setError("최소 2개의 채널을 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setChannels([]);

    try {
      const results = await Promise.all(
        queries.map(async (q) => {
          const res = await fetch(
            `/api/youtube/channel?q=${encodeURIComponent(q.trim())}`
          );
          const data = await res.json();
          if (!res.ok)
            throw new Error(
              data.error || `"${q}" 채널을 찾을 수 없습니다`
            );
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

  const metrics: { key: MetricKey; label: string; icon: typeof Users }[] = [
    { key: "subscribers", label: "구독자 수", icon: Users },
    { key: "views", label: "총 조회수", icon: Eye },
    { key: "videos", label: "영상 수", icon: Video },
    { key: "avgViews", label: "평균 조회수", icon: BarChart3 },
    { key: "recentViews", label: "최근 영상 조회수", icon: Eye },
  ];

  function getMetricValue(ch: ChannelData, key: MetricKey): string {
    switch (key) {
      case "subscribers":
        return formatNum(ch.subscriberCount);
      case "views":
        return formatNum(ch.viewCount);
      case "videos":
        return formatNum(ch.videoCount);
      case "avgViews": {
        const vc = toNum(ch.videoCount);
        return vc > 0 ? formatNum(Math.round(toNum(ch.viewCount) / vc)) : "0";
      }
      case "recentViews":
        return ch.videos?.[0] ? formatNum(ch.videos[0].viewCount) : "-";
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Trophy className="h-7 w-7 text-yellow-500" />
          채널 비교
        </h1>
        <p className="mt-1 text-muted-foreground">
          유튜브 채널 2~3개를 나란히 비교 분석하세요
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleCompare} className="mb-8">
        <div className="space-y-3">
          {inputs.map((input, idx) => (
            <div key={idx} className="flex gap-3">
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
                <button
                  type="button"
                  onClick={() => removeInput(idx)}
                  className="rounded-lg border border-border px-3 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          {inputs.length < 3 && (
            <button
              type="button"
              onClick={addInput}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              채널 추가
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "비교 중..." : "비교하기"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {channels.length >= 2 && (
        <div>
          {/* Channel Headers */}
          <div
            className="mb-6 grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${channels.length}, minmax(0, 1fr))`,
            }}
          >
            {channels.map((ch, i) => (
              <Card key={ch.id} className="text-center">
                <img
                  src={ch.thumbnailUrl}
                  alt={ch.title}
                  className="mx-auto h-20 w-20 rounded-full"
                />
                <h2 className="mt-3 text-lg font-bold">{ch.title}</h2>
                {ch.country && (
                  <span className="mt-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-xs">
                    {ch.country}
                  </span>
                )}
                <a
                  href={`https://www.youtube.com/channel/${ch.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-muted-foreground hover:text-primary"
                >
                  YouTube에서 보기
                </a>
              </Card>
            ))}
          </div>

          {/* Metrics Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>지표 비교</CardTitle>
            </CardHeader>
            <div className="space-y-1">
              {metrics.map((metric) => {
                const winnerIdx = getWinnerIndex(channels, metric.key);
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.key}
                    className="grid items-center gap-4 rounded-lg px-4 py-3 hover:bg-secondary/50"
                    style={{
                      gridTemplateColumns: `180px repeat(${channels.length}, minmax(0, 1fr))`,
                    }}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Icon className="h-4 w-4" />
                      {metric.label}
                    </div>
                    {channels.map((ch, i) => (
                      <div
                        key={ch.id}
                        className={`text-center text-lg font-bold ${
                          i === winnerIdx
                            ? "text-green-500"
                            : "text-foreground"
                        }`}
                      >
                        {getMetricValue(ch, metric.key)}
                        {i === winnerIdx && (
                          <Trophy className="ml-1 inline h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Videos */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>최근 영상</CardTitle>
            </CardHeader>
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${channels.length}, minmax(0, 1fr))`,
              }}
            >
              {channels.map((ch) => {
                const video = ch.videos?.[0];
                if (!video) {
                  return (
                    <div
                      key={ch.id}
                      className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground"
                    >
                      최근 영상 없음
                    </div>
                  );
                }
                return (
                  <a
                    key={ch.id}
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border p-3 transition-colors hover:bg-secondary"
                  >
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full rounded-md object-cover"
                    />
                    <p className="mt-2 line-clamp-2 text-sm font-medium">
                      {video.title}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>조회수 {formatNum(video.viewCount)}</span>
                      <span>좋아요 {formatNum(video.likeCount)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {channels.length === 0 && !error && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            채널 핸들 또는 ID를 입력하고 비교하기를 눌러주세요
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            예: @channelA vs @channelB
          </p>
        </div>
      )}
    </div>
  );
}
