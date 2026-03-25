"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TrendingUp, Eye, ThumbsUp, MessageCircle, Clock, Loader2, ChevronDown, Search, X, Flame, Zap } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

const CATEGORY_KO: Record<string, string> = {
  "Film & Animation": "영화/애니메이션",
  "Autos & Vehicles": "자동차",
  "Music": "음악",
  "Pets & Animals": "동물",
  "Sports": "스포츠",
  "Short Movies": "단편영화",
  "Travel & Events": "여행/이벤트",
  "Gaming": "게임",
  "Videoblogging": "브이로그",
  "People & Blogs": "인물/블로그",
  "Comedy": "코미디",
  "Entertainment": "엔터테인먼트",
  "News & Politics": "뉴스/정치",
  "Howto & Style": "노하우/스타일",
  "Education": "교육",
  "Science & Technology": "과학/기술",
  "Movies": "영화",
  "Anime/Animation": "애니메이션",
  "Action/Adventure": "액션/모험",
  "Classics": "클래식",
  "Documentary": "다큐멘터리",
  "Drama": "드라마",
  "Family": "가족",
  "Foreign": "외국",
  "Horror": "공포",
  "Sci-Fi/Fantasy": "SF/판타지",
  "Thriller": "스릴러",
  "Shorts": "쇼츠",
  "Shows": "쇼",
  "Trailers": "예고편",
  "Nonprofits & Activism": "비영리/사회운동",
};

const CUSTOM_CATEGORIES = [
  { id: "custom_economy", label: "경제/재테크", keyword: "경제 재테크 투자 주식" },
  { id: "custom_realestate", label: "부동산", keyword: "부동산 아파트 청약 분양" },
  { id: "custom_mukbang", label: "먹방/요리", keyword: "먹방 요리 레시피 맛집" },
  { id: "custom_beauty", label: "뷰티/패션", keyword: "뷰티 메이크업 패션 화장" },
  { id: "custom_tech", label: "IT/테크", keyword: "IT 리뷰 테크 언박싱 스마트폰" },
  { id: "custom_health", label: "건강/운동", keyword: "운동 헬스 다이어트 건강" },
  { id: "custom_pet", label: "반려동물", keyword: "강아지 고양이 반려동물 펫" },
  { id: "custom_baby", label: "육아/출산", keyword: "육아 출산 아기 임신" },
  { id: "custom_study", label: "자기계발/공부", keyword: "자기계발 공부 독서 습관" },
  { id: "custom_interior", label: "인테리어/살림", keyword: "인테리어 살림 집꾸미기 정리" },
  { id: "custom_ai", label: "AI/인공지능", keyword: "AI 인공지능 ChatGPT 딥러닝" },
  { id: "custom_car", label: "자동차 리뷰", keyword: "자동차 리뷰 시승 신차" },
  { id: "custom_kpop", label: "K-POP/아이돌", keyword: "케이팝 아이돌 K-POP 걸그룹" },
  { id: "custom_drama", label: "드라마/예능", keyword: "드라마 예능 리뷰 리캡" },
  { id: "custom_camping", label: "캠핑/아웃도어", keyword: "캠핑 백패킹 아웃도어 등산" },
];

interface VideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string } };
    tags?: string[];
    categoryId?: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  contentDetails?: {
    duration: string;
  };
}

interface CategoryItem {
  id: string;
  snippet: { title: string };
}

function formatNum(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString("ko-KR");
}

function timeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return d.toLocaleDateString("ko-KR");
}

function parseDuration(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "0:00";
  const h = m[1] ? parseInt(m[1]) : 0;
  const min = m[2] ? parseInt(m[2]) : 0;
  const s = m[3] ? parseInt(m[3]) : 0;
  if (h > 0) return `${h}:${min.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${min}:${s.toString().padStart(2, "0")}`;
}

function engagement(views: number, likes: number, comments: number) {
  if (views === 0) return 0;
  return ((likes + comments) / views) * 100;
}

function viralScore(views: number, publishedAt: string): number {
  const hours = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  if (hours < 0.1) return views; // avoid division by near-zero
  return Math.round(views / hours);
}

function parseDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (m[1] ? parseInt(m[1]) * 3600 : 0) + (m[2] ? parseInt(m[2]) * 60 : 0) + (m[3] ? parseInt(m[3]) : 0);
}

function viralColor(score: number): string {
  if (score >= 100_000) return "text-red-500";
  if (score >= 10_000) return "text-orange-500";
  return "text-muted-foreground";
}

function viralBg(score: number): string {
  if (score >= 100_000) return "bg-red-100 dark:bg-red-900/30";
  if (score >= 10_000) return "bg-orange-100 dark:bg-orange-900/30";
  return "bg-secondary";
}

function CategoryDropdown({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const ytItems = categories.map((c) => ({
    id: c.id,
    label: CATEGORY_KO[c.snippet.title] || c.snippet.title,
    group: "youtube" as const,
  }));

  const customItems = CUSTOM_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    group: "custom" as const,
  }));

  const allItems = [
    { id: "all", label: "전체", group: "all" as const },
    ...customItems,
    ...ytItems,
  ];

  const filtered = allItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustom = filtered.filter((i) => i.group === "custom" || i.group === "all");
  const filteredYt = filtered.filter((i) => i.group === "youtube");

  const customMatch = CUSTOM_CATEGORIES.find((c) => c.id === selectedCategory);
  const selectedLabel =
    selectedCategory === "all"
      ? "전체"
      : customMatch
        ? customMatch.label
        : CATEGORY_KO[
            categories.find((c) => c.id === selectedCategory)?.snippet.title ?? ""
          ] ||
          categories.find((c) => c.id === selectedCategory)?.snippet.title ||
          "전체";

  return (
    <div ref={ref} className="relative mb-6 w-full sm:w-72">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
      >
        <span>카테고리: {selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          {/* Search */}
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="카테고리 검색..."
                className="w-full bg-transparent text-sm focus:outline-none"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-center text-sm text-muted-foreground">
                결과 없음
              </p>
            ) : (
              <>
                {filteredCustom.length > 0 && (
                  <>
                    {filteredCustom.some((i) => i.group === "custom") && !search && (
                      <p className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground">인기 카테고리</p>
                    )}
                    {filteredCustom.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors ${
                          selectedCategory === item.id
                            ? "bg-red-50 font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "hover:bg-secondary"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </>
                )}
                {filteredYt.length > 0 && (
                  <>
                    {!search && (
                      <div className="my-1 border-t border-border">
                        <p className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground">YouTube 공식 카테고리</p>
                      </div>
                    )}
                    {filteredYt.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelect(item.id);
                          setOpen(false);
                          setSearch("");
                        }}
                        className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors ${
                          selectedCategory === item.id
                            ? "bg-red-50 font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400"
                            : "hover:bg-secondary"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function YouTubeTrendingPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<"trending" | "viral">("trending");
  const [durationFilter, setDurationFilter] = useState<"all" | "shorts" | "long">("all");

  const fetchTrending = useCallback(async (categoryId?: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();

      // Check if it's a custom keyword-based category
      const custom = CUSTOM_CATEGORIES.find((c) => c.id === categoryId);
      if (custom) {
        params.set("keyword", custom.keyword);
        params.set("max", "20");
      } else if (categoryId && categoryId !== "all") {
        params.set("category", categoryId);
        params.set("max", "30");
      } else {
        params.set("max", "30");
      }

      const res = await fetch(`/api/youtube/trending?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideos(data.videos);
      if (data.categories && categories.length === 0) {
        setCategories(data.categories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터를 불러올 수 없습니다");
    } finally {
      setLoading(false);
    }
  }, [categories.length]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  function handleCategoryChange(categoryId: string) {
    setSelectedCategory(categoryId);
    fetchTrending(categoryId);
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c.snippet.title]));

  const totalViews = videos.reduce((s, v) => s + parseInt(v.statistics.viewCount), 0);
  const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
  const avgEng = videos.length > 0
    ? videos.reduce((s, v) => s + engagement(
        parseInt(v.statistics.viewCount),
        parseInt(v.statistics.likeCount),
        parseInt(v.statistics.commentCount)
      ), 0) / videos.length
    : 0;

  const displayVideos = (() => {
    let result = [...videos];
    if (durationFilter === "shorts") {
      result = result.filter((v) => {
        if (!v.contentDetails?.duration) return false;
        return parseDurationSeconds(v.contentDetails.duration) < 60;
      });
    } else if (durationFilter === "long") {
      result = result.filter((v) => {
        if (!v.contentDetails?.duration) return true;
        return parseDurationSeconds(v.contentDetails.duration) >= 60;
      });
    }
    if (sortMode === "viral") {
      result.sort((a, b) =>
        viralScore(parseInt(b.statistics.viewCount), b.snippet.publishedAt) -
        viralScore(parseInt(a.statistics.viewCount), a.snippet.publishedAt)
      );
    }
    return result;
  })();

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <TrendingUp className="h-7 w-7 text-red-500" />
          유튜브 트렌딩
        </h1>
        <p className="mt-1 text-muted-foreground">
          한국에서 지금 인기 있는 영상
        </p>
      </div>

      {/* Category Dropdown */}
      <CategoryDropdown
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={handleCategoryChange}
      />

      {/* Sort & Filter Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Sort Buttons */}
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setSortMode("trending")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              sortMode === "trending"
                ? "bg-red-500 text-white"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            트렌딩순
          </button>
          <button
            onClick={() => setSortMode("viral")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              sortMode === "viral"
                ? "bg-orange-500 text-white"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            바이럴순
          </button>
        </div>

        {/* Duration Filter */}
        <div className="flex rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setDurationFilter("all")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              durationFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setDurationFilter("shorts")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              durationFilter === "shorts"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            숏폼
          </button>
          <button
            onClick={() => setDurationFilter("long")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              durationFilter === "long"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            롱폼
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">트렌딩 영상 로딩 중...</span>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <StatCard title="평균 조회수" value={formatNum(avgViews)} icon={Eye} />
            <StatCard title="평균 인게이지먼트" value={`${avgEng.toFixed(2)}%`} icon={ThumbsUp} />
            <StatCard title="트렌딩 영상 수" value={videos.length} icon={TrendingUp} />
          </div>

          {displayVideos.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                {durationFilter === "shorts" ? "이 카테고리에 숏폼 영상이 없습니다" : durationFilter === "long" ? "이 카테고리에 롱폼 영상이 없습니다" : "이 카테고리에 트렌딩 영상이 없습니다"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md"
                >
                  {/* Rank */}
                  <div className="flex w-8 flex-shrink-0 items-start justify-center pt-1">
                    <span className={`text-lg font-bold ${index < 3 ? "text-red-500" : "text-muted-foreground"}`}>
                      {index + 1}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.snippet.thumbnails.high?.url ?? video.snippet.thumbnails.medium?.url ?? ""}
                      alt={video.snippet.title}
                      className="h-24 w-42 rounded-lg object-cover sm:h-28 sm:w-50"
                    />
                    {video.contentDetails?.duration && (
                      <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
                        {parseDuration(video.contentDetails.duration)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-sm font-semibold hover:text-primary sm:text-base"
                    >
                      {video.snippet.title}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {video.snippet.channelTitle}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {formatNum(parseInt(video.statistics.viewCount))}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" />
                        {formatNum(parseInt(video.statistics.likeCount))}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {formatNum(parseInt(video.statistics.commentCount))}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {timeAgo(video.snippet.publishedAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {video.snippet.categoryId && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {CATEGORY_KO[categoryMap.get(video.snippet.categoryId) ?? ""] ?? categoryMap.get(video.snippet.categoryId) ?? video.snippet.categoryId}
                        </span>
                      )}
                      {video.snippet.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Engagement & Viral Score */}
                  <div className="hidden flex-shrink-0 text-right sm:block">
                    {(() => {
                      const vs = viralScore(parseInt(video.statistics.viewCount), video.snippet.publishedAt);
                      return (
                        <div className={`mb-2 rounded-lg px-2 py-1 ${viralBg(vs)}`}>
                          <div className={`flex items-center justify-end gap-1 text-sm font-bold ${viralColor(vs)}`}>
                            <Flame className="h-3.5 w-3.5" />
                            {formatNum(vs)}
                          </div>
                          <div className="text-xs text-muted-foreground">시간당 조회수</div>
                        </div>
                      );
                    })()}
                    <div className="text-sm font-semibold text-primary">
                      {engagement(
                        parseInt(video.statistics.viewCount),
                        parseInt(video.statistics.likeCount),
                        parseInt(video.statistics.commentCount)
                      ).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">인게이지먼트</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
