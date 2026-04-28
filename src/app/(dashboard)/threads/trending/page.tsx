"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, Search, Hash, Loader2, ExternalLink, MessageCircle, Heart, Repeat2, Quote } from "lucide-react";
import { ThreadsIcon } from "@/components/ui/icons";
import {
  searchThreads,
  getTrending,
  type ThreadsPost,
  ThreadsAuthError,
} from "@/lib/api/threads";

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

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setAuthMissing(false);
    try {
      let data: { items?: ThreadsPost[]; data?: ThreadsPost[]; keywords?: string[]; preset?: string; fetchedAt?: string };
      if (mode === "preset") {
        data = await getTrending({ preset, type, perKeyword });
      } else if (mode === "keyword") {
        const r = await searchThreads(keyword, type, 50);
        data = { data: r.data };
      } else {
        const q = hashtag.startsWith("#") ? hashtag : `#${hashtag}`;
        const r = await searchThreads(q, type, 50);
        data = { data: r.data };
      }
      setItems(data.items || data.data || []);
      setMeta({ keywords: data.keywords, preset: data.preset, fetchedAt: data.fetchedAt });
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <TrendingUp className="h-7 w-7 text-purple-500" />
          쓰레드 트렌딩
        </h1>
        <p className="mt-1 text-muted-foreground">
          분야별 키워드 또는 해시태그로 인기 쓰레드 발굴
        </p>
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

      {/* 결과 */}
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

      {items.length > 0 && (
        <div className="mb-3 text-sm text-muted-foreground">
          {items.length}개 결과 {meta?.fetchedAt && `· ${new Date(meta.fetchedAt).toLocaleString("ko-KR")}`}
        </div>
      )}

      <div className="space-y-4">
        {items.map((p) => (
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
              <span className="ml-auto text-xs text-muted-foreground">
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
        ))}
      </div>

      {!loading && items.length === 0 && !error && !authMissing && (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          위에서 카테고리/키워드/해시태그를 선택하고 [검색]을 누르세요
        </div>
      )}
    </div>
  );
}
