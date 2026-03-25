"use client";

import { useState } from "react";
import {
  Search,
  Eye,
  ThumbsUp,
  MessageCircle,
  Clock,
  Tag,
  ExternalLink,
  TrendingUp,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";

interface VideoData {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string;
  tags: string[];
  categoryId: string;
}

function extractVideoId(input: string): string | null {
  const trimmed = input.trim();

  // youtu.be/XXX
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // youtube.com/watch?v=XXX
  const longMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (longMatch) return longMatch[1];

  // youtube.com/embed/XXX or youtube.com/v/XXX
  const embedMatch = trimmed.match(/youtube\.com\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Raw video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  return null;
}

function parseDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatNum(n: string | number): string {
  const num = typeof n === "string" ? parseInt(n) : n;
  if (isNaN(num)) return "0";
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}억`;
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}만`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}천`;
  return num.toLocaleString("ko-KR");
}

function calcEngagementRate(views: string, likes: string, comments: string): number {
  const v = parseInt(views) || 0;
  const l = parseInt(likes) || 0;
  const c = parseInt(comments) || 0;
  if (v === 0) return 0;
  return ((l + c) / v) * 100;
}

function calcViewsPerHour(views: string, publishedAt: string): number {
  const v = parseInt(views) || 0;
  const published = new Date(publishedAt).getTime();
  const now = Date.now();
  const hours = (now - published) / (1000 * 60 * 60);
  if (hours <= 0) return v;
  return Math.round(v / hours);
}

interface SeoItem {
  label: string;
  status: "good" | "bad" | "warning";
  detail: string;
}

function analyzeSeo(video: VideoData): { score: number; items: SeoItem[] } {
  const items: SeoItem[] = [];
  let score = 0;

  // Title length
  const titleLen = video.title.length;
  if (titleLen >= 40 && titleLen <= 60) {
    items.push({ label: "제목 길이", status: "good", detail: `${titleLen}자 (권장: 40-60자)` });
    score += 35;
  } else if (titleLen >= 20 && titleLen < 40) {
    items.push({ label: "제목 길이", status: "warning", detail: `${titleLen}자 (권장: 40-60자, 조금 짧음)` });
    score += 20;
  } else if (titleLen > 60 && titleLen <= 80) {
    items.push({ label: "제목 길이", status: "warning", detail: `${titleLen}자 (권장: 40-60자, 조금 김)` });
    score += 20;
  } else {
    items.push({ label: "제목 길이", status: "bad", detail: `${titleLen}자 (권장: 40-60자)` });
    score += 5;
  }

  // Description length
  const descLen = video.description.length;
  if (descLen >= 500) {
    items.push({ label: "설명 길이", status: "good", detail: `${descLen}자 (500자 이상)` });
    score += 35;
  } else if (descLen >= 200) {
    items.push({ label: "설명 길이", status: "warning", detail: `${descLen}자 (500자 이상 권장)` });
    score += 20;
  } else {
    items.push({ label: "설명 길이", status: "bad", detail: `${descLen}자 (500자 이상 권장)` });
    score += 5;
  }

  // Tags count
  const tagCount = video.tags.length;
  if (tagCount > 5) {
    items.push({ label: "태그 수", status: "good", detail: `${tagCount}개 (5개 이상)` });
    score += 30;
  } else if (tagCount >= 1) {
    items.push({ label: "태그 수", status: "warning", detail: `${tagCount}개 (5개 이상 권장)` });
    score += 15;
  } else {
    items.push({ label: "태그 수", status: "bad", detail: "태그 없음 (5개 이상 권장)" });
    score += 0;
  }

  return { score, items };
}

function seoScoreColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

function seoScoreLabel(score: number): string {
  if (score >= 80) return "우수";
  if (score >= 50) return "보통";
  return "개선 필요";
}

export default function VideoAnalysisPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    const videoId = extractVideoId(input);
    if (!videoId) {
      setError("유효한 YouTube URL 또는 영상 ID를 입력하세요");
      return;
    }

    setLoading(true);
    setError("");
    setVideo(null);

    try {
      const res = await fetch(`/api/youtube/video?id=${encodeURIComponent(videoId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "영상을 찾을 수 없습니다");
      setVideo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  const engagementRate = video
    ? calcEngagementRate(video.viewCount, video.likeCount, video.commentCount)
    : 0;

  const viewsPerHour = video
    ? calcViewsPerHour(video.viewCount, video.publishedAt)
    : 0;

  const seo = video ? analyzeSeo(video) : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <FileText className="h-7 w-7 text-red-500" />
          영상 분석
        </h1>
        <p className="mt-1 text-muted-foreground">
          YouTube 영상 URL 또는 ID를 입력하여 상세 분석하세요
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="YouTube URL 또는 영상 ID 입력..."
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

      {video && (
        <div>
          {/* Video Header */}
          <Card className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full rounded-lg object-cover sm:h-40 sm:w-72"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <h2 className="text-lg font-bold leading-snug">{video.title}</h2>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex-shrink-0 text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <a
                  href={`https://www.youtube.com/channel/${video.channelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm text-muted-foreground hover:text-primary"
                >
                  {video.channelTitle}
                </a>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(video.publishedAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  게시
                </p>
                {video.duration && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {parseDuration(video.duration)}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="조회수"
              value={formatNum(video.viewCount)}
              icon={Eye}
            />
            <StatCard
              title="좋아요"
              value={formatNum(video.likeCount)}
              icon={ThumbsUp}
            />
            <StatCard
              title="댓글"
              value={formatNum(video.commentCount)}
              icon={MessageCircle}
            />
            <StatCard
              title="참여율"
              value={`${engagementRate.toFixed(2)}%`}
              change="(좋아요+댓글) / 조회수"
              changeType={engagementRate >= 5 ? "positive" : engagementRate >= 2 ? "neutral" : "negative"}
              icon={TrendingUp}
            />
          </div>

          {/* Viral Velocity */}
          <div className="mb-6">
            <StatCard
              title="시간당 조회수 (바이럴 속도)"
              value={formatNum(viewsPerHour)}
              change="게시 이후 평균"
              changeType={viewsPerHour >= 1000 ? "positive" : viewsPerHour >= 100 ? "neutral" : "negative"}
              icon={Zap}
            />
          </div>

          {/* Tags */}
          {video.tags.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  태그 ({video.tags.length}개)
                </CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* SEO Analysis */}
          {seo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>SEO 분석</span>
                  <span className={`text-2xl font-bold ${seoScoreColor(seo.score)}`}>
                    {seo.score}점 / 100점
                    <span className="ml-2 text-base font-medium">
                      ({seoScoreLabel(seo.score)})
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {seo.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    {item.status === "good" && (
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    )}
                    {item.status === "warning" && (
                      <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
                    )}
                    {item.status === "bad" && (
                      <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>영상 설명</CardTitle>
            </CardHeader>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
              {video.description || "설명 없음"}
            </p>
          </Card>
        </div>
      )}

      {!video && !error && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            영상 URL을 입력하면 조회수, 참여율, SEO 등을 분석합니다
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            예: https://youtube.com/watch?v=dQw4w9WgXcQ
          </p>
        </div>
      )}
    </div>
  );
}
