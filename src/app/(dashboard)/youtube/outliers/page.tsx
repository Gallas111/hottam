"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Flame, Loader2, Sparkles, TrendingUp, Wand2 } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { UsageGuide } from "@/components/ui/usage-guide";

interface OutlierVideo {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number;
  isShort: boolean;
  thumbnail: string;
  channelSubscribers: number;
  channelAvgViews: number;
  outlierScore: number;
  viewsPerDay: number;
  daysSinceUpload: number;
  opportunityScore: number;
  keyword: string;
}

const PRESETS = [
  "쇼핑 쇼츠 (한국)",
  "주방·살림",
  "청소·욕실",
  "자취 시작",
  "글로벌 가젯",
];

function formatNum(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString("ko-KR");
}

export default function OutliersPage() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [shortsOnly, setShortsOnly] = useState(true);
  const [minOutlier, setMinOutlier] = useState(3);
  const [maxDays, setMaxDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: OutlierVideo[]; fromCache?: boolean; fetchedAt?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const u = new URL("/api/research/outliers", window.location.origin);
      u.searchParams.set("preset", preset);
      u.searchParams.set("shortsOnly", shortsOnly ? "1" : "0");
      u.searchParams.set("minOutlier", String(minOutlier));
      u.searchParams.set("maxDays", String(maxDays));
      const res = await fetch(u.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [preset, shortsOnly, minOutlier, maxDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const items = data?.items || [];
  const top = items[0];
  const avgOutlier =
    items.length > 0 ? items.reduce((s, v) => s + v.outlierScore, 0) / items.length : 0;
  const shortsCount = items.filter((v) => v.isShort).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold">아웃라이어 영상</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          채널 평균 대비 비정상적으로 잘 나온 영상 — 알고리즘이 좋아한 소재 발굴
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">키워드 프리셋</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">최소 아웃라이어 배율</label>
            <select
              value={minOutlier}
              onChange={(e) => setMinOutlier(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value={2}>2배 이상</option>
              <option value={3}>3배 이상 (추천)</option>
              <option value={5}>5배 이상</option>
              <option value={10}>10배 이상 (대박)</option>
              <option value={30}>30배 이상 (역대급)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">최근 업로드</label>
            <select
              value={maxDays}
              onChange={(e) => setMaxDays(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value={7}>7일 이내</option>
              <option value={14}>14일 이내</option>
              <option value={30}>30일 이내</option>
              <option value={90}>90일 이내</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shortsOnly}
                onChange={(e) => setShortsOnly(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              쇼츠만 (60초 이하)
            </label>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 inline-flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          다시 분석
        </button>
        {data?.fromCache && (
          <p className="text-xs text-muted-foreground">
            캐시 데이터 ({data.fetchedAt && new Date(data.fetchedAt).toLocaleString("ko-KR")})
          </p>
        )}
      </div>

      {/* Stats */}
      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="발굴 영상 수" value={items.length} icon={TrendingUp} />
          <StatCard
            title="최고 아웃라이어"
            value={top ? `${top.outlierScore.toFixed(1)}배` : "-"}
            icon={Flame}
            change={top?.channelTitle}
          />
          <StatCard title="평균 아웃라이어" value={`${avgOutlier.toFixed(1)}배`} icon={TrendingUp} />
          <StatCard title="쇼츠 비율" value={`${items.length ? Math.round((shortsCount / items.length) * 100) : 0}%`} icon={Eye} />
        </div>
      )}

      {/* List */}
      {err && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          에러: {err}
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="space-y-3">
        {items.map((v, idx) => (
          <div
            key={v.videoId}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition"
          >
            <div className="flex gap-4">
              <div className="relative shrink-0">
                <span className="absolute -top-2 -left-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer">
                  <img
                    src={v.thumbnail}
                    alt=""
                    className="h-24 w-40 rounded-lg object-cover"
                  />
                </a>
                {v.isShort && (
                  <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    쇼츠
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={`https://youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium line-clamp-2 hover:text-primary"
                >
                  {v.title}
                </a>
                <div className="mt-1 text-xs text-muted-foreground">
                  <a
                    href={`https://youtube.com/channel/${v.channelId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    {v.channelTitle}
                  </a>
                  {" · "}구독 {formatNum(v.channelSubscribers)} · 채널 평균 {formatNum(v.channelAvgViews)} 조회
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 font-bold text-orange-600">
                    <Flame className="h-3 w-3" />
                    {v.outlierScore.toFixed(1)}배 아웃라이어
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {formatNum(v.viewCount)}
                  </span>
                  <span className="text-muted-foreground">
                    하루 {formatNum(v.viewsPerDay)} 조회
                  </span>
                  <span className="text-muted-foreground">
                    업로드 {v.daysSinceUpload}일 전
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5">
                    #{v.keyword}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <a
                  href={`/youtube/remake?v=${v.videoId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary hover:text-primary-foreground transition"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  재창작
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && items.length === 0 && !err && (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">
          조건에 맞는 아웃라이어 영상이 없어요. 배율을 낮춰 보세요.
        </div>
      )}

      <UsageGuide
        steps={[
          {
            title: "1. 배율로 진짜 터진 영상만 추출",
            description: "3배 이상으로 시작 → 5·10·30배로 좁혀가며 알고리즘이 강하게 푸시한 소재만 남기세요.",
          },
          {
            title: "2. 쇼츠만 체크하기",
            description: "본인 쇼핑 쇼츠 포맷에 바로 적용 가능한 60초 이하 소재만 보여요.",
          },
          {
            title: "3. 최근 7일 이내 = 지금 트렌드",
            description: "알고리즘이 지금 밀어주는 소재. 7일 → 14일 → 30일 순으로 넓혀가며 점검하세요.",
          },
          {
            title: "4. [재창작] 버튼으로 즉시 변환",
            description: "영상 ID가 본인 shopping-shorts plan.json 입력으로 자동 변환됩니다.",
          },
        ]}
        tip="검색은 search.list (100 quota/회). 일일 10K 한도 도달 시 1시간 후 재시도하세요. API 키 추가 시 한도 확장 가능."
      />
    </div>
  );
}
