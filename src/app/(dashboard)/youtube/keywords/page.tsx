"use client";

import { useState } from "react";
import { Search, Eye, ThumbsUp, MessageCircle, Clock, BarChart3, TrendingUp, Zap, Hash } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

interface KeywordStats {
  avgViews: number;
  avgLikes: number;
  avgComments: number;
  avgEngagement: number;
  recentUploads: number;
  competitionLevel: string;
  competitionColor: string;
}

export default function KeywordsPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"relevance" | "viewCount" | "date">("relevance");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [stats, setStats] = useState<KeywordStats | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query.trim())}&order=${order}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "검색 실패");
      setResults(data.videos);
      setTotalResults(data.totalResults);

      // Calculate keyword stats from results
      if (data.videos.length > 0) {
        const videos = data.videos as SearchResult[];
        const views = videos.map((v) => parseInt(v.viewCount) || 0);
        const likes = videos.map((v) => parseInt(v.likeCount) || 0);
        const comments = videos.map((v) => parseInt(v.commentCount) || 0);

        const avgViews = Math.round(views.reduce((a, b) => a + b, 0) / views.length);
        const avgLikes = Math.round(likes.reduce((a, b) => a + b, 0) / likes.length);
        const avgComments = Math.round(comments.reduce((a, b) => a + b, 0) / comments.length);
        const avgEngagement = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;

        // Count videos uploaded in last 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentUploads = videos.filter(
          (v) => new Date(v.publishedAt).getTime() > thirtyDaysAgo
        ).length;

        // Competition level based on avg views and recent uploads
        let competitionLevel = "낮음";
        let competitionColor = "text-green-500";
        if (avgViews > 100000 && recentUploads >= 5) {
          competitionLevel = "매우 높음";
          competitionColor = "text-red-500";
        } else if (avgViews > 50000 && recentUploads >= 3) {
          competitionLevel = "높음";
          competitionColor = "text-orange-500";
        } else if (avgViews > 10000) {
          competitionLevel = "보통";
          competitionColor = "text-yellow-500";
        }

        setStats({ avgViews, avgLikes, avgComments, avgEngagement, recentUploads, competitionLevel, competitionColor });

        // Extract related keywords from titles
        const words = videos
          .flatMap((v) =>
            v.title
              .replace(/[^가-힣a-zA-Z0-9\s]/g, " ")
              .split(/\s+/)
              .filter((w) => w.length >= 2 && w.toLowerCase() !== query.toLowerCase())
          );
        const wordCount = new Map<string, number>();
        words.forEach((w) => {
          const key = w.toLowerCase();
          wordCount.set(key, (wordCount.get(key) || 0) + 1);
        });
        const sorted = [...wordCount.entries()]
          .filter(([, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([word]) => word);
        setRelatedKeywords(sorted);
      } else {
        setStats(null);
        setRelatedKeywords([]);
      }
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

  function timeAgo(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return "오늘";
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    if (days < 365) return `${Math.floor(days / 30)}개월 전`;
    return `${Math.floor(days / 365)}년 전`;
  }

  function searchRelated(keyword: string) {
    setQuery(keyword);
    const form = document.querySelector("form");
    if (form) {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Search className="h-7 w-7 text-red-500" />
          키워드 리서치
        </h1>
        <p className="mt-1 text-muted-foreground">
          키워드로 인기 영상을 검색하고 경쟁도를 분석하세요
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          * 검색 API는 쿼터 소비가 큽니다 (100 유닛/회). 하루 약 100회 검색 가능
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색할 키워드 입력..."
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value as "relevance" | "viewCount" | "date")}
            className="rounded-lg border border-border bg-card px-3 py-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="relevance">관련도순</option>
            <option value="viewCount">조회수순</option>
            <option value="date">최신순</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-500 px-6 py-3 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Keyword Stats Cards */}
      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              경쟁도
            </div>
            <p className={`mt-1 text-xl font-bold ${stats.competitionColor}`}>
              {stats.competitionLevel}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-4 w-4" />
              평균 조회수
            </div>
            <p className="mt-1 text-xl font-bold">{formatNum(stats.avgViews)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              평균 참여율
            </div>
            <p className="mt-1 text-xl font-bold">{stats.avgEngagement.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-4 w-4" />
              최근 30일 업로드
            </div>
            <p className="mt-1 text-xl font-bold">{stats.recentUploads}개</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="h-4 w-4" />
              총 결과
            </div>
            <p className="mt-1 text-xl font-bold">{formatNum(totalResults)}</p>
          </div>
        </div>
      )}

      {/* Related Keywords */}
      {relatedKeywords.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">관련 키워드</h3>
          <div className="flex flex-wrap gap-2">
            {relatedKeywords.map((kw) => (
              <button
                key={kw}
                onClick={() => searchRelated(kw)}
                className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      )}

      {totalResults > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          약 {formatNum(totalResults)}개의 결과
        </p>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((video, idx) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
          >
            <div className="relative flex-shrink-0">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                loading="lazy"
                className="h-24 w-40 rounded-lg object-cover"
              />
              <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-bold text-white">
                #{idx + 1}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-semibold sm:text-base">
                {video.title}
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {video.channelTitle}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {video.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {formatNum(video.viewCount)}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {formatNum(video.likeCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {formatNum(video.commentCount)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {timeAgo(video.publishedAt)}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {results.length === 0 && !error && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">
            키워드를 입력하면 경쟁도와 관련 키워드를 분석합니다
          </p>
        </div>
      )}
    </div>
  );
}
