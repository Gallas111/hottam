"use client";

import { useState, useRef } from "react";
import { Search, Eye, ThumbsUp, MessageCircle, Clock, BarChart3, TrendingUp, Zap, Hash } from "lucide-react";
import { UsageGuide } from "@/components/ui/usage-guide";

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
  recentAvgViews: number;
  avgViewsPerHour: number;
  competitionLevel: string;
  competitionColor: string;
  opportunity: string;
  opportunityColor: string;
}

export default function KeywordsPage() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"relevance" | "viewCount" | "date">("relevance");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stats, setStats] = useState<KeywordStats | null>(null);
  const [relatedKeywords, setRelatedKeywords] = useState<string[]>([]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (value.trim().length >= 2) {
      suggestTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/youtube/suggest?q=${encodeURIComponent(value.trim())}`);
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } catch {
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function selectSuggestion(s: string) {
    setQuery(s);
    setShowSuggestions(false);
  }

  async function handleSearch(e: React.FormEvent) {
    setShowSuggestions(false);
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

        // Count videos uploaded in last 90 days
        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const recentVideos = videos.filter(
          (v) => new Date(v.publishedAt).getTime() > ninetyDaysAgo
        );
        const recentUploads = recentVideos.length;

        // Recent videos average views (this is the real demand signal)
        const recentAvgViews = recentVideos.length > 0
          ? Math.round(recentVideos.reduce((sum, v) => sum + (parseInt(v.viewCount) || 0), 0) / recentVideos.length)
          : 0;

        // Views per hour (viral velocity) for recent videos
        const avgViewsPerHour = recentVideos.length > 0
          ? Math.round(recentVideos.reduce((sum, v) => {
              const vw = parseInt(v.viewCount) || 0;
              const hours = (Date.now() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60);
              return sum + (hours > 0 ? vw / hours : 0);
            }, 0) / recentVideos.length)
          : 0;

        // Competition level based on RECENT video performance
        let competitionLevel = "낮음";
        let competitionColor = "text-green-500";
        if (recentAvgViews > 100000 && recentUploads >= 5) {
          competitionLevel = "매우 높음";
          competitionColor = "text-red-500";
        } else if (recentAvgViews > 50000 && recentUploads >= 3) {
          competitionLevel = "높음";
          competitionColor = "text-orange-500";
        } else if (recentAvgViews > 10000 || recentUploads >= 5) {
          competitionLevel = "보통";
          competitionColor = "text-yellow-500";
        }

        // Opportunity score: high recent views + low competition = good opportunity
        let opportunity = "낮음";
        let opportunityColor = "text-muted-foreground";
        if (recentAvgViews > 10000 && recentUploads <= 3) {
          opportunity = "매우 좋음";
          opportunityColor = "text-green-500";
        } else if (recentAvgViews > 5000 && recentUploads <= 5) {
          opportunity = "좋음";
          opportunityColor = "text-blue-500";
        } else if (recentAvgViews > 1000) {
          opportunity = "보통";
          opportunityColor = "text-yellow-500";
        }

        setStats({ avgViews, avgLikes, avgComments, avgEngagement, recentUploads, recentAvgViews, avgViewsPerHour, competitionLevel, competitionColor, opportunity, opportunityColor });

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

      <UsageGuide
        steps={[
          { title: "내 채널 주제와 관련된 키워드를 검색하세요", description: "예: 요리 채널이면 '자취 요리', '간단 레시피', '편의점 요리' 등을 검색해보세요." },
          { title: "경쟁도 '낮음~보통' + 평균 조회수 '높음' 조합을 찾으세요", description: "이게 블루오션이에요. 수요는 있는데 경쟁이 적은 키워드가 성장에 유리해요." },
          { title: "관련 키워드를 클릭해서 틈새를 더 파보세요", description: "'다이어트'가 경쟁 과열이면 '직장인 다이어트 도시락' 같은 롱테일로 좁히세요." },
          { title: "상위 영상의 제목/설명/태그를 참고하세요", description: "1~3위 영상의 제목 구조, 키워드 배치를 보고 내 영상에 적용하세요." },
        ]}
        tip="같은 키워드를 '관련도순'과 '조회수순'으로 둘 다 검색해보세요. 관련도순은 알고리즘이 밀어주는 영상, 조회수순은 실제 수요를 보여줘요."
      />

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="검색할 키워드 입력..."
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card shadow-lg">
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">유튜브 검색 추천</div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => selectSuggestion(s)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
                  >
                    <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}
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
        <div className="mb-6">
          {/* Row 1: Key decision metrics */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border-2 border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-4 w-4" />
                기회 점수
              </div>
              <p className={`mt-1 text-2xl font-bold ${stats.opportunityColor}`}>
                {stats.opportunity}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.opportunity === "매우 좋음" ? "수요 높고 경쟁 적음 — 지금 바로 만드세요!" : stats.opportunity === "좋음" ? "해볼 만한 키워드예요" : stats.opportunity === "보통" ? "차별화 포인트가 필요해요" : "다른 키워드를 찾아보세요"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="h-4 w-4" />
                최근 90일 평균 조회수
              </div>
              <p className={`mt-1 text-xl font-bold ${stats.recentAvgViews >= 100000 ? "text-green-500" : stats.recentAvgViews >= 10000 ? "text-blue-500" : stats.recentAvgViews >= 1000 ? "text-yellow-500" : "text-muted-foreground"}`}>
                {stats.recentAvgViews > 0 ? formatNum(stats.recentAvgViews) : "데이터 없음"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.recentAvgViews >= 100000 ? "핫한 키워드 — 최근 영상도 조회수 폭발" : stats.recentAvgViews >= 10000 ? "살아있는 키워드 — 지금도 수요 있음" : stats.recentAvgViews >= 1000 ? "소규모 수요 — 니치 전략으로" : stats.recentAvgViews > 0 ? "수요 적음 — 다른 키워드 추천" : "최근 90일 내 영상이 없어요"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                경쟁도 (최근 기준)
              </div>
              <p className={`mt-1 text-xl font-bold ${stats.competitionColor}`}>
                {stats.competitionLevel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.competitionLevel === "낮음" ? "진입하기 좋은 키워드" : stats.competitionLevel === "보통" ? "적절한 경쟁 수준" : stats.competitionLevel === "높음" ? "차별화 전략 필요" : "틈새 키워드를 찾아보세요"}
              </p>
            </div>
          </div>

          {/* Row 2: Detail metrics */}
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                시간당 조회수 (바이럴)
              </div>
              <p className={`mt-1 text-lg font-bold ${stats.avgViewsPerHour >= 500 ? "text-green-500" : stats.avgViewsPerHour >= 50 ? "text-blue-500" : "text-muted-foreground"}`}>
                {stats.avgViewsPerHour > 0 ? formatNum(stats.avgViewsPerHour) + "/시간" : "-"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.avgViewsPerHour >= 500 ? "폭발적 — 지금 핫한 주제" : stats.avgViewsPerHour >= 50 ? "꾸준한 유입" : "느린 성장"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                평균 참여율
              </div>
              <p className={`mt-1 text-lg font-bold ${stats.avgEngagement >= 5 ? "text-green-500" : stats.avgEngagement >= 2 ? "text-blue-500" : "text-yellow-500"}`}>
                {stats.avgEngagement.toFixed(2)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.avgEngagement >= 5 ? "매우 높음 — 시청자 반응이 뜨거운 주제" : stats.avgEngagement >= 2 ? "양호 — 평균적인 반응" : "낮음 — 시청만 하고 반응은 적은 주제"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                최근 90일 업로드
              </div>
              <p className={`mt-1 text-lg font-bold ${stats.recentUploads >= 5 ? "text-red-500" : stats.recentUploads >= 2 ? "text-yellow-500" : "text-green-500"}`}>
                {stats.recentUploads}개 / 10개 중
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.recentUploads >= 5 ? "경쟁 활발 — 계속 새 영상이 올라옴" : stats.recentUploads >= 2 ? "적당한 활동량" : "블루오션 — 최근 올리는 사람이 적어요"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Hash className="h-4 w-4" />
                총 결과
              </div>
              <p className="mt-1 text-xl font-bold">{formatNum(totalResults)}</p>
            </div>
          </div>

          {/* 키워드 판단 가이드 */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">키워드 판단 가이드</p>
            <div className="mt-2 grid gap-2 text-xs text-blue-600 dark:text-blue-400 sm:grid-cols-3">
              <div>
                <p className="font-medium">지금 바로 만드세요</p>
                <p>기회 점수 "매우 좋음" — 최근 영상 조회수 높은데 경쟁은 적음</p>
              </div>
              <div>
                <p className="font-medium">차별화하면 가능</p>
                <p>기회 점수 "좋음~보통" — 바이럴 속도를 보고 트렌드인지 확인</p>
              </div>
              <div>
                <p className="font-medium">피해야 할 키워드</p>
                <p>경쟁 높음 + 최근 업로드 많음 + 바이럴 속도 낮음 = 레드오션</p>
              </div>
            </div>
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
