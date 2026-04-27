"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, Rocket, Sparkles, TrendingUp, Users, Wand2 } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { UsageGuide } from "@/components/ui/usage-guide";

interface RisingChannel {
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  subscribers: number;
  videoCount: number;
  totalViews: number;
  avgViews: number;
  recentTopVideoId: string;
  recentTopVideoTitle: string;
  recentTopViews: number;
  recentTopOutlier: number;
  isNewChannel: boolean;
  risingScore: number;
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

export default function RisingPage() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [maxSubs, setMaxSubs] = useState(50000);
  const [minOutlier, setMinOutlier] = useState(5);
  const [maxDays, setMaxDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: RisingChannel[]; fromCache?: boolean; fetchedAt?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const u = new URL("/api/research/rising", window.location.origin);
      u.searchParams.set("preset", preset);
      u.searchParams.set("maxSubs", String(maxSubs));
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
  }, [preset, maxSubs, minOutlier, maxDays]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const items = data?.items || [];
  const newCount = items.filter((c) => c.isNewChannel).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Rocket className="h-8 w-8 text-purple-500" />
          <h1 className="text-3xl font-bold">신생 라이징 채널</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          구독자 적은데 영상이 터진 채널 발굴 — 포맷 자체가 먹히는 증거
        </p>
      </div>

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
            <label className="text-sm font-medium block mb-1.5">최대 구독자 (이하)</label>
            <select
              value={maxSubs}
              onChange={(e) => setMaxSubs(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value={5000}>5,000명 (극초기)</option>
              <option value={10000}>1만명</option>
              <option value={50000}>5만명 (추천)</option>
              <option value={100000}>10만명 (실버 직전)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">최소 아웃라이어</label>
            <select
              value={minOutlier}
              onChange={(e) => setMinOutlier(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value={3}>3배 이상</option>
              <option value={5}>5배 이상 (추천)</option>
              <option value={10}>10배 이상</option>
              <option value={30}>30배 이상</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">최근 업로드</label>
            <select
              value={maxDays}
              onChange={(e) => setMaxDays(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value={7}>7일</option>
              <option value={14}>14일</option>
              <option value={30}>30일</option>
              <option value={90}>90일</option>
            </select>
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

      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="발굴 채널 수" value={items.length} icon={Rocket} />
          <StatCard title="신생 채널 (영상 30개 이하)" value={`${newCount}개`} icon={Sparkles} />
          <StatCard
            title="최고 라이징 점수"
            value={items[0] ? items[0].risingScore.toFixed(1) : "-"}
            icon={TrendingUp}
            change={items[0]?.channelTitle}
          />
        </div>
      )}

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
        {items.map((c, idx) => (
          <div
            key={c.channelId}
            className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition"
          >
            <div className="flex gap-4">
              <div className="relative shrink-0">
                <span className="absolute -top-2 -left-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <a
                  href={`https://youtube.com/channel/${c.channelId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {c.thumbnail ? (
                    <img
                      src={c.thumbnail}
                      alt=""
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </a>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://youtube.com/channel/${c.channelId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:text-primary"
                  >
                    {c.channelTitle}
                  </a>
                  {c.isNewChannel && (
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-600">
                      NEW
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    구독 {formatNum(c.subscribers)}
                  </span>
                  <span>영상 {c.videoCount}개</span>
                  <span>평균 {formatNum(c.avgViews)} 조회</span>
                </div>
                <div className="mt-3 rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground mb-1">최근 터진 영상</p>
                  <a
                    href={`https://youtube.com/watch?v=${c.recentTopVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium line-clamp-1 hover:text-primary"
                  >
                    {c.recentTopVideoTitle}
                  </a>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 font-bold text-orange-600">
                      <Eye className="h-3 w-3" />
                      {formatNum(c.recentTopViews)} ({c.recentTopOutlier.toFixed(1)}배)
                    </span>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 font-bold text-purple-600">
                      Rising {c.risingScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 self-start">
                <a
                  href={`/youtube/remake?v=${c.recentTopVideoId}`}
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
          조건에 맞는 신생 채널이 없어요. 구독자 한도를 올리거나 아웃라이어 배율을 낮춰 보세요.
        </div>
      )}

      <UsageGuide
        steps={[
          {
            title: "1. 신생 채널이 진짜 인사이트",
            description: "대형 채널 빨이 아니라 '포맷 자체가 먹히는' 증거. 본인 신규 채널에 그대로 적용 가능성 높음.",
          },
          {
            title: "2. NEW 배지 = 영상 30개 이하",
            description: "본격 운영 1~3개월 차 채널. 본인 시작 단계 비교에 가장 적합.",
          },
          {
            title: "3. 라이징 점수 vs 아웃라이어 점수",
            description: "라이징 점수는 구독자 수도 함께 반영 (작은 채널일수록 가산). 진짜 다크호스 발굴용.",
          },
          {
            title: "4. 채널 클릭해서 다른 영상도 확인",
            description: "한 영상만 터졌는지 vs 여러 영상 일관 성공인지 확인. 후자가 진짜 모방 가치.",
          },
        ]}
        tip="신생 채널 + 5배 이상 + 7일 이내 조합이 가장 가치 있는 발견. 알고리즘이 지금 키우려는 채널이에요."
      />
    </div>
  );
}
