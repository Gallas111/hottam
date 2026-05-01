"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, Search, Hash, Loader2, ExternalLink, MessageCircle, Heart, Repeat2, Quote, Eye, Bookmark, BookmarkCheck, Flame } from "lucide-react";
import { ThreadsIcon } from "@/components/ui/icons";
import {
  scrapeSearchThreads,
  scrapeSearchByTag,
  getTrending,
  enrichPosts,
  getTrendingWithFallback,
  parseScrapedText,
  ageToTimestamp,
  isKoreanPost,
  type ThreadsPost,
  type PostMetrics,
  ThreadsAuthError,
} from "@/lib/api/threads";
import { isBookmarked, toggleBookmark } from "@/lib/threads-bookmarks";

const PRESETS = [
  "전체 추천",
  "쇼핑·살림·자취",
  "코인·재테크·투자",
  "부동산·청약",
  "뷰티·패션",
  "먹방·요리·맛집",
  "운동·헬스·피트니스",
  "건강·의학",
  "IT·테크·AI",
  "게임",
  "교육·자기계발",
  "육아·출산",
  "반려동물",
  "자동차",
  "여행·캠핑·아웃도어",
  "K-POP·드라마·예능",
  "인테리어·홈데코",
  "부업·사이드 프로젝트",
  "글로벌 가젯·해외 트렌드",
];

type Mode = "preset" | "keyword" | "hashtag";
type TimeWindow = "all" | "24h" | "7d" | "30d";
type SortMode = "default" | "likes" | "replies" | "reposts";
type LangFilter = "all" | "ko" | "foreign";

// 영어 키워드 → 한국어 추천 (자주 쓰는 것만)
const KO_HINTS: Record<string, string> = {
  "ai": "인공지능 / 챗지피티 / AI 도구",
  "chatgpt": "챗지피티 / ChatGPT 활용",
  "crypto": "코인 / 비트코인 / 이더리움",
  "btc": "비트코인",
  "eth": "이더리움",
  "stock": "주식 / 재테크",
  "diet": "다이어트 / 헬스 / 운동",
  "fashion": "패션 / 데일리룩 / 코디",
  "travel": "여행 / 캠핑 / 국내여행",
  "food": "맛집 / 요리 / 레시피",
  "game": "게임 / 신작 / 공략",
  "kpop": "케이팝 / 아이돌 / 최애",
  "drama": "드라마 / 예능",
};

const WINDOW_MS: Record<TimeWindow, number> = {
  all: 0,
  "24h": 24 * 3600 * 1000,
  "7d": 7 * 24 * 3600 * 1000,
  "30d": 30 * 24 * 3600 * 1000,
};

export default function ThreadsTrendingPage() {
  const [mode, setMode] = useState<Mode>("preset");
  const [preset, setPreset] = useState(PRESETS[0]);
  const [keyword, setKeyword] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [type, setType] = useState<"TOP" | "RECENT">("TOP");
  const [perKeyword, setPerKeyword] = useState(10);

  const [items, setItems] = useState<ThreadsPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMissing, setAuthMissing] = useState(false);
  const [meta, setMeta] = useState<{ keywords?: string[]; preset?: string; fetchedAt?: string } | null>(null);

  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [langFilter, setLangFilter] = useState<LangFilter>("ko");  // 기본: 한국어만
  const [enriching, setEnriching] = useState(false);
  const [enrichSummary, setEnrichSummary] = useState<{ scraped: number; cached: number; failed: number } | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [bookmarkTick, setBookmarkTick] = useState(0);  // 리렌더 트리거

  // GitHub 자동 수집 모드 (0 한도, 6h 갱신). preset 모드에서만 의미.
  const [useCollected, setUseCollected] = useState(true);
  const [dataSource, setDataSource] = useState<"github-collected" | "live-search" | null>(null);
  const [staleMinutes, setStaleMinutes] = useState<number | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setAuthMissing(false);
    setEnrichSummary(null);
    setEnrichError(null);
    setDataSource(null);
    setStaleMinutes(null);
    try {
      if (mode === "preset" && useCollected) {
        // ⭐ GitHub 자동 수집 우선 (0 한도). 비어있으면 라이브 검색 자동 fallback.
        const r = await getTrendingWithFallback({ preset, type, perKeyword, preferCollected: true });
        setItems(r.items);
        setMeta({ preset: r.preset, fetchedAt: r.fetchedAt });
        setDataSource(r.source);
        setStaleMinutes(r.staleMinutes ?? null);
        // GitHub 수집 데이터에 _metrics 가 이미 들어있으면 자동 정렬
        if (r.source === "github-collected" && r.items.some((p) => p._metrics)) {
          setSortMode("likes");
        }
      } else if (mode === "preset") {
        const data = await getTrending({ preset, type, perKeyword });
        setItems(data.items || []);
        setMeta({ keywords: data.keywords, preset: data.preset, fetchedAt: data.fetchedAt });
        setDataSource("live-search");
      } else if (mode === "keyword") {
        // CF Browser Rendering 으로 threads.net 검색 페이지 직접 scrape (토큰 0)
        const r = await scrapeSearchThreads(keyword, type, 50);
        const items = r.posts.map((p) => {
          const parsed = parseScrapedText(p.text || "", p.username || "");
          const px = p as typeof p & { media_images?: string[]; video_url?: string | null; video_poster?: string | null };
          const nowIso = new Date().toISOString();
          const post: ThreadsPost = {
            id: p.id,
            text: parsed.body,
            username: parsed.author.replace(/^@/, ""),
            timestamp: ageToTimestamp(parsed.age, nowIso) || nowIso,
            permalink: p.permalink,
            media_type: p.has_video ? "VIDEO" : p.has_image ? "IMAGE" : "TEXT_POST",
            thumbnail_url: p.thumbnail_url || undefined,
            media_images: px.media_images,
            video_url: px.video_url ?? null,
            video_poster: px.video_poster ?? null,
          };
          if (parsed.metrics) {
            post._metrics = {
              id: p.id,
              ...parsed.metrics,
              view_count: 0,
              fetched_at: Date.now(),
              source: "scraped",
            };
          }
          return post;
        });
        setItems(items);
        setMeta({});
        setDataSource("live-search");
      } else {
        const r = await scrapeSearchByTag(hashtag, 50);
        const items = r.posts.map((p) => {
          const parsed = parseScrapedText(p.text || "", p.username || "");
          const px = p as typeof p & { media_images?: string[]; video_url?: string | null; video_poster?: string | null };
          const nowIso = new Date().toISOString();
          const post: ThreadsPost = {
            id: p.id,
            text: parsed.body,
            username: parsed.author.replace(/^@/, ""),
            timestamp: ageToTimestamp(parsed.age, nowIso) || nowIso,
            permalink: p.permalink,
            media_type: p.has_video ? "VIDEO" : p.has_image ? "IMAGE" : "TEXT_POST",
            thumbnail_url: p.thumbnail_url || undefined,
            media_images: px.media_images,
            video_url: px.video_url ?? null,
            video_poster: px.video_poster ?? null,
          };
          if (parsed.metrics) {
            post._metrics = {
              id: p.id,
              ...parsed.metrics,
              view_count: 0,
              fetched_at: Date.now(),
              source: "scraped",
            };
          }
          return post;
        });
        setItems(items);
        setMeta({});
        setDataSource("live-search");
      }
    } catch (e) {
      if (e instanceof ThreadsAuthError) {
        setAuthMissing(true);
      } else {
        setError((e as Error).message);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const [enrichInfo, setEnrichInfo] = useState<string | null>(null);
  async function handleEnrich() {
    const candidates = items.filter((p) => p.permalink && !p._metrics).slice(0, 30);
    if (candidates.length === 0) {
      setEnrichInfo("이미 모든 게시물에 메트릭이 있습니다 — 추출할 필요 없음");
      return;
    }
    setEnriching(true);
    setEnrichError(null);
    setEnrichInfo(null);
    try {
      const r = await enrichPosts(candidates.map((p) => ({ id: p.id, permalink: p.permalink! })));
      const byId: Record<string, PostMetrics> = {};
      for (const m of r.metrics) byId[m.id] = m;
      // enrich 결과의 media_images / video_url / timestamp 모두 머지
      setItems((prev) => prev.map((p) => {
        const m = byId[p.id];
        if (!m) return p;
        return {
          ...p,
          _metrics: m,
          media_images: (m.media_images && m.media_images.length > 0) ? m.media_images : p.media_images,
          video_url: m.video_url ?? p.video_url,
          timestamp: m.timestamp_iso || p.timestamp,  // 정확한 작성 시각으로 갱신
        };
      }));
      setEnrichSummary({ scraped: r.summary.scraped, cached: r.summary.cached, failed: r.summary.failed });
      // 첫 enrich 시 자동으로 likes 정렬로 전환
      if (sortMode === "default") setSortMode("likes");
    } catch (e) {
      setEnrichError((e as Error).message);
    } finally {
      setEnriching(false);
    }
  }

  function handleBookmark(p: ThreadsPost) {
    toggleBookmark(p, p._metrics);
    setBookmarkTick((t) => t + 1);
  }

  // 클라이언트 필터 + 정렬
  const visibleItems = useMemo(() => {
    let arr = items;
    // 언어 필터
    if (langFilter === "ko") arr = arr.filter((p) => isKoreanPost(p));
    else if (langFilter === "foreign") arr = arr.filter((p) => !isKoreanPost(p));
    if (timeWindow !== "all") {
      const cutoff = Date.now() - WINDOW_MS[timeWindow];
      arr = arr.filter((p) => {
        const ts = new Date(p.timestamp).getTime();
        return Number.isFinite(ts) && ts >= cutoff;
      });
    }
    if (sortMode !== "default") {
      const key: keyof PostMetrics =
        sortMode === "likes" ? "like_count" :
        sortMode === "replies" ? "reply_count" : "repost_count";
      arr = [...arr].sort((a, b) => (b._metrics?.[key] as number ?? -1) - (a._metrics?.[key] as number ?? -1));
    }
    return arr;
  }, [items, timeWindow, sortMode, langFilter]);

  // 언어별 카운트 (탭 라벨용)
  const langCounts = useMemo(() => {
    let ko = 0, foreign = 0;
    for (const p of items) (isKoreanPost(p) ? ko++ : foreign++);
    return { all: items.length, ko, foreign };
  }, [items]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <TrendingUp className="h-7 w-7 text-purple-500" />
            쓰레드 트렌딩
          </h1>
          <p className="mt-1 text-muted-foreground">
            분야별 키워드 또는 해시태그로 인기 쓰레드 발굴
          </p>
        </div>
        <Link
          href="/threads/bookmarks"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary"
        >
          <Bookmark className="h-4 w-4" />
          북마크
        </Link>
      </div>

      {/* 검색 모드 */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setMode("preset")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "preset" ? "bg-purple-600 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <ThreadsIcon className="mr-1.5 inline-block h-4 w-4" />
            카테고리
          </button>
          <button
            onClick={() => setMode("keyword")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "keyword" ? "bg-purple-600 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="mr-1.5 inline-block h-4 w-4" />
            직접 키워드
          </button>
          <button
            onClick={() => setMode("hashtag")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "hashtag" ? "bg-purple-600 text-white" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hash className="mr-1.5 inline-block h-4 w-4" />
            해시태그
          </button>
        </div>

        {mode === "preset" && (
          <div className="space-y-3">
            <label className="flex items-start gap-2 rounded-lg bg-emerald-50 p-2 text-xs dark:bg-emerald-900/20">
              <input
                type="checkbox"
                checked={useCollected}
                onChange={(e) => setUseCollected(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-emerald-800 dark:text-emerald-300">
                <span className="font-medium">📦 자동 수집 모드</span> — GitHub Actions 가 6시간마다 자동 수집한 데이터 우선 사용 (likes/replies 수치 포함, 한도 0). 비어있으면 BYOT 라이브 검색으로 자동 fallback.
              </span>
            </label>
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {PRESETS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">키워드당 게시물 수</label>
              <input
                type="number"
                min="3"
                max="25"
                value={perKeyword}
                onChange={(e) => setPerKeyword(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
        {mode === "keyword" && (
          <div>
            <label className="text-sm font-medium">키워드</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="인공지능, 챗지피티, 비트코인, 자취템 ..."
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              💡 한국어 키워드로 검색해야 한국어 게시물이 나옵니다 (Threads 검색 정책). 영어 키워드 → 영어 결과만.
            </p>
          </div>
        )}
        {mode === "hashtag" && (
          <div>
            <label className="text-sm font-medium">해시태그 (# 자동 추가)</label>
            <input
              type="text"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value)}
              placeholder="비트코인, 자취, 부업 ..."
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <div>
            <label className="text-sm font-medium">정렬</label>
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => setType("TOP")}
                className={`rounded-lg border px-3 py-1.5 text-xs ${type === "TOP" ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "border-border"}`}
              >
                인기 (TOP)
              </button>
              <button
                onClick={() => setType("RECENT")}
                className={`rounded-lg border px-3 py-1.5 text-xs ${type === "RECENT" ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "border-border"}`}
              >
                최신 (RECENT)
              </button>
            </div>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleSearch}
              disabled={loading || (mode === "keyword" && !keyword) || (mode === "hashtag" && !hashtag)}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
            </button>
          </div>
        </div>
      </div>

      {/* 결과 영역 */}
      {authMissing && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-400">
            Threads Access Token 미설정. <Link href="/settings" className="font-medium underline">설정에서 입력하세요</Link>
          </p>
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-400">⚠ {error}</p>
        </div>
      )}

      {meta?.keywords && meta.keywords.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {meta.keywords.map((k) => (
            <span key={k} className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              {k}
            </span>
          ))}
        </div>
      )}

      {/* 영어 키워드 검색 후 한국어 0건 안내 */}
      {items.length > 0 && langCounts.ko === 0 && /^[A-Za-z0-9\s]+$/.test(keyword || "") && mode === "keyword" && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          ⚠ 영어 키워드라 한국어 결과가 0건입니다. <strong>한국어 키워드</strong>로 검색해보세요 (예: <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">{keyword}</code> → <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">{KO_HINTS[keyword.toLowerCase()] || `${keyword} 한국 / 사용법 / 추천`}</code>)
        </div>
      )}

      {/* 언어 탭 */}
      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-card p-2">
          <span className="ml-1 mr-1 text-xs font-medium text-muted-foreground">언어</span>
          {([
            { key: "ko" as const, label: "🇰🇷 한국어", count: langCounts.ko },
            { key: "foreign" as const, label: "🌍 외국어", count: langCounts.foreign },
            { key: "all" as const, label: "전체", count: langCounts.all },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setLangFilter(tab.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${langFilter === tab.key ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* 시간 필터 + 수치 정렬 + enrich 버튼 */}
      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          <span className="mr-1 text-xs font-medium text-muted-foreground">기간</span>
          {(["all", "24h", "7d", "30d"] as TimeWindow[]).map((w) => (
            <button
              key={w}
              onClick={() => setTimeWindow(w)}
              className={`rounded-lg border px-2.5 py-1 text-xs ${timeWindow === w ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "border-border"}`}
            >
              {w === "all" ? "전체" : w === "24h" ? "24시간" : w === "7d" ? "7일" : "30일"}
            </button>
          ))}
          <span className="mx-2 text-border">|</span>
          <span className="mr-1 text-xs font-medium text-muted-foreground">정렬</span>
          {(["default", "likes", "replies", "reposts"] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortMode(s)}
              className={`rounded-lg border px-2.5 py-1 text-xs ${sortMode === s ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : "border-border"}`}
            >
              {s === "default" ? "기본" : s === "likes" ? "좋아요순" : s === "replies" ? "댓글순" : "리포스트순"}
            </button>
          ))}
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            title="공개 페이지에서 좋아요·댓글·리포스트 수치 추출 (CF Browser Rendering, 무료)"
          >
            {enriching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flame className="h-3.5 w-3.5" />}
            {enriching ? "수치 추출 중..." : "🔥 수치 추출"}
          </button>
        </div>
      )}

      {enrichSummary && (
        <div className="mb-3 text-xs text-muted-foreground">
          수치 추출 완료 — 신규 {enrichSummary.scraped} / 캐시 {enrichSummary.cached} / 실패 {enrichSummary.failed}
        </div>
      )}
      {enrichError && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          ⚠ 수치 추출 실패: {enrichError} (검색 결과는 그대로 유지)
        </div>
      )}
      {enrichInfo && (
        <div className="mb-3 rounded-lg border border-border bg-secondary/40 p-2 text-xs text-muted-foreground">
          ℹ {enrichInfo}
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{visibleItems.length}/{items.length}개 결과</span>
          {dataSource === "github-collected" && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              📦 자동 수집 {staleMinutes !== null ? `· ${staleMinutes < 60 ? `${staleMinutes}분 전` : `${Math.floor(staleMinutes / 60)}시간 전`}` : ""}
            </span>
          )}
          {dataSource === "live-search" && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              🔴 라이브 검색
            </span>
          )}
          {meta?.fetchedAt && <span>· {new Date(meta.fetchedAt).toLocaleString("ko-KR")}</span>}
        </div>
      )}

      <div className="space-y-4" data-bookmark-tick={bookmarkTick}>
        {visibleItems.map((p) => {
          const m = p._metrics;
          const bm = isBookmarked(p.id);
          return (
            <article key={p.id} className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
              <header className="mb-2 flex items-center gap-2 text-sm">
                {p.thumbnail_url && (
                  <img src={p.thumbnail_url} alt="" className="h-7 w-7 rounded-full object-cover" loading="lazy" />
                )}
                {p.username && <span className="font-medium">@{p.username}</span>}
                {p._keyword && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {p._keyword}
                  </span>
                )}
                {p.media_type && p.media_type !== "TEXT_POST" && (
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                    {p.media_type}
                  </span>
                )}
                <button
                  onClick={() => handleBookmark(p)}
                  className="ml-auto inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:text-purple-600"
                  title={bm ? "북마크 해제" : "북마크"}
                >
                  {bm ? <BookmarkCheck className="h-4 w-4 text-purple-600" /> : <Bookmark className="h-4 w-4" />}
                </button>
                <span className="text-xs text-muted-foreground">
                  {new Date(p.timestamp).toLocaleDateString("ko-KR")}
                </span>
              </header>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>
              {/* 첨부 이미지 (1~4장 grid) */}
              {p.media_images && p.media_images.length > 0 && (
                <>
                  <div className={`mt-3 grid gap-2 ${p.media_images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {p.media_images.slice(0, 4).map((src, i) => (
                      <a key={i} href={p.permalink} target="_blank" rel="noopener noreferrer">
                        <img
                          src={src}
                          alt={p.alt_text || ""}
                          className="max-h-96 w-full rounded-lg object-cover hover:opacity-90"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </a>
                    ))}
                  </div>
                  {/* 검색 단에서 1장만 잡힌 경우 — carousel 가능성 안내 */}
                  {p.media_images.length === 1 && !p._metrics && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      📷 캐러셀일 수 있어요 — 🔥 수치 추출 누르면 모든 이미지가 보입니다
                    </p>
                  )}
                </>
              )}
              {/* 첨부 비디오 (포스터 우선, src 있으면 재생) */}
              {p.video_url && (
                <video
                  src={p.video_url}
                  poster={p.video_poster || undefined}
                  className="mt-3 max-h-96 w-full rounded-lg"
                  controls
                  preload="metadata"
                />
              )}
              {/* 비디오 URL 없지만 포스터만 있는 경우 */}
              {!p.video_url && p.video_poster && p.media_type === "VIDEO" && (
                <a href={p.permalink} target="_blank" rel="noopener noreferrer">
                  <img src={p.video_poster} alt="" className="mt-3 max-h-96 w-full rounded-lg object-cover" loading="lazy" />
                </a>
              )}
              {/* 옛 형식 fallback (Meta API 응답) */}
              {!p.media_images?.length && !p.video_url && !p.video_poster && p.media_url && p.media_type === "IMAGE" && (
                <img src={p.media_url} alt={p.alt_text || ""} className="mt-3 max-h-96 rounded-lg object-cover" loading="lazy" />
              )}
              {/* engagement metric (enrich 후) */}
              {m && (
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <Heart className="h-3.5 w-3.5" />
                    {m.like_count.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {m.reply_count.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Repeat2 className="h-3.5 w-3.5" />
                    {m.repost_count.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                    <Quote className="h-3.5 w-3.5" />
                    {m.quote_count.toLocaleString()}
                  </span>
                  {m.view_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      {m.view_count.toLocaleString()}
                    </span>
                  )}
                  {m.source === "failed" && (
                    <span className="text-amber-600 dark:text-amber-400">⚠ 추출 실패</span>
                  )}
                  {m.source === "cached" && (
                    <span className="text-muted-foreground">(캐시)</span>
                  )}
                </div>
              )}
              <footer className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                {p.permalink && (
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Threads에서 보기
                  </a>
                )}
                {p.is_quote_post && <span className="flex items-center gap-1"><Quote className="h-3.5 w-3.5" /> 인용</span>}
                {p.is_reply && <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> 답글</span>}
              </footer>
            </article>
          );
        })}
      </div>

      {!loading && items.length === 0 && !error && !authMissing && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          위에서 카테고리/키워드/해시태그를 선택하고 [검색]을 누르세요
        </div>
      )}
    </div>
  );
}
