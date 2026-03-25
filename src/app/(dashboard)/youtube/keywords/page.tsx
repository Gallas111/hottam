"use client";

import { useState } from "react";
import { Search, Eye, ThumbsUp, MessageCircle, Clock } from "lucide-react";

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

export default function KeywordsPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"relevance" | "viewCount" | "date">(
    "relevance"
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [totalResults, setTotalResults] = useState(0);

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Search className="h-7 w-7 text-red-500" />
          키워드 리서치
        </h1>
        <p className="mt-1 text-muted-foreground">
          키워드로 인기 영상을 검색하고 트렌드를 분석하세요
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
            onChange={(e) =>
              setOrder(e.target.value as "relevance" | "viewCount" | "date")
            }
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

      {totalResults > 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          약 {formatNum(totalResults)}개의 결과
        </p>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.map((video) => (
          <a
            key={video.id}
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              loading="lazy"
              className="h-24 w-40 flex-shrink-0 rounded-lg object-cover"
            />
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
            키워드를 입력하면 관련 영상의 성과를 분석합니다
          </p>
        </div>
      )}
    </div>
  );
}
