"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, Search, Hash, Loader2, ExternalLink, MessageCircle, Heart, Repeat2, Quote, Eye, Bookmark, BookmarkCheck, Flame } from "lucide-react";
import { ThreadsIcon } from "@/components/ui/icons";
import {
  searchThreads,
  getTrending,
  enrichPosts,
  getTrendingWithFallback,
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
        const r = await searchThreads(keyword, type, 50);
        setItems(r.data);
        setMeta({});
        setDataSource("live-search");
      } else {
        const q = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
        const r = await searchThreads(q, type, 50);
        setItems(r.data);
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

  async function handleEnrich() {
    const candidates = items.filter((p) => p.permalink && !p._metrics).slice(0, 30);
    if (candidates.length === 0) {
      setEnrichError("permalink 있는 게시물 없음 또는 이미 모두 enrich 됨");
      return;
    }
    setEnriching(true);
    setEnrichError(null);
    try {
      const r = await enrichPosts(candidates.map((p) => ({ id: p.id, permalink: p.permalink! })));
      const byId: Record<string, PostMetrics> = {};
      for (const m of r.metrics) byId[m.id] = m;
      setItems((prev) => prev.map((p) => byId[p.id] ? { ...p, _metrics: byId[p.id] } : p));
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
  }, [items, timeWindow, sortMode]);

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
              placeholder="비트코인, 자취템, 부업 ..."
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
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
              {p.media_url && p.media_type === "IMAGE" && (
                <img src={p.media_url} alt={p.alt_text || ""} className="mt-3 max-h-96 rounded-lg object-cover" loading="lazy" />
              )}
              {p.media_url && p.media_type === "VIDEO" && p.thumbnail_url && (
                <img src={p.thumbnail_url} alt={p.alt_text || ""} className="mt-3 max-h-96 rounded-lg object-cover" loading="lazy" />
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
