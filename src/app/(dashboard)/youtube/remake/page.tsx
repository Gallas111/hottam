"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Download, Eye, Loader2, Sparkles, Wand2 } from "lucide-react";
import { UsageGuide } from "@/components/ui/usage-guide";
import { apiFetch } from "@/lib/api/base";

interface SourceVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
}

interface RemakePlan {
  project_name: string;
  duration_sec: number;
  hook: string;
  script: string[];
  shots: Array<Record<string, unknown>>;
  metadata: { aspect_ratio: string; resolution: [number, number]; fps: number };
  source_reference?: { why_it_worked?: string; inspired_hook?: string };
}

function formatNum(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString("ko-KR");
}

function RemakeInner() {
  const params = useSearchParams();
  const initialV = params.get("v") || "";

  const [videoId, setVideoId] = useState(initialV);
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [targetAudience, setTargetAudience] = useState("20~30대 자취생");
  const [tone, setTone] = useState("친근한 대화체");

  const [source, setSource] = useState<SourceVideo | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);

  const [plan, setPlan] = useState<RemakePlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fetchSource = useCallback(async (vid: string) => {
    if (!vid) return;
    setSourceLoading(true);
    setErr(null);
    try {
      const res = await apiFetch(`/api/research/remake?videoId=${encodeURIComponent(vid)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSource(json.source);
    } catch (e) {
      setErr((e as Error).message);
      setSource(null);
    } finally {
      setSourceLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialV) fetchSource(initialV);
  }, [initialV, fetchSource]);

  const handleGenerate = async () => {
    if (!videoId.trim() || !productName.trim()) {
      setErr("영상 ID와 제품명을 모두 입력해주세요");
      return;
    }
    setPlanLoading(true);
    setErr(null);
    setPlan(null);
    try {
      const res = await apiFetch("/api/research/remake", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          videoId: videoId.trim(),
          productName: productName.trim(),
          productCategory: productCategory.trim() || undefined,
          targetAudience: targetAudience.trim() || undefined,
          tone: tone.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setPlan(json.plan);
      if (json.source) setSource(json.source);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setPlanLoading(false);
    }
  };

  const downloadPlan = () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.project_name}_plan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPlan = async () => {
    if (!plan) return;
    await navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Wand2 className="h-8 w-8 text-pink-500" />
          <h1 className="text-3xl font-bold">재창작 변환기</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          발견된 인기 영상 → 본인 제품 쇼츠 plan.json 자동 생성
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium block mb-1.5">유튜브 영상 ID 또는 URL</label>
            <div className="flex gap-2">
              <input
                value={videoId}
                onChange={(e) => {
                  let v = e.target.value;
                  const m = v.match(/[?&]v=([\w-]{11})/) || v.match(/youtu\.be\/([\w-]{11})/) || v.match(/shorts\/([\w-]{11})/);
                  if (m) v = m[1];
                  setVideoId(v);
                }}
                placeholder="dQw4w9WgXcQ 또는 youtube.com/watch?v=..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={() => fetchSource(videoId.trim())}
                disabled={sourceLoading || !videoId.trim()}
                className="rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50"
              >
                {sourceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "확인"}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">본인 제품명 *</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="예: 에어프라이어 4L, 자석 키친타월 홀더"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">제품 카테고리 (선택)</label>
            <input
              value={productCategory}
              onChange={(e) => setProductCategory(e.target.value)}
              placeholder="주방가전, 청소도구, 수납용품 등"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">타깃 (선택)</label>
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1.5">톤 (선택)</label>
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={planLoading || !videoId.trim() || !productName.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 inline-flex items-center gap-2"
        >
          {planLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          plan.json 생성
        </button>
      </div>

      {err && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          에러: {err}
        </div>
      )}

      {source && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold mb-3">참고 원본 영상</h2>
          <div className="flex gap-4">
            <img
              src={`https://i.ytimg.com/vi/${source.videoId}/hqdefault.jpg`}
              alt=""
              className="h-24 w-40 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <a
                href={`https://youtube.com/watch?v=${source.videoId}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium hover:text-primary line-clamp-2"
              >
                {source.title}
              </a>
              <p className="text-xs text-muted-foreground mt-1">{source.channelTitle}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{formatNum(source.viewCount)}</span>
                <span>좋아요 {formatNum(source.likeCount)}</span>
                <span>댓글 {formatNum(source.commentCount)}</span>
              </div>
              {source.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {source.tags.slice(0, 6).map((t) => (
                    <span key={t} className="rounded bg-muted px-2 py-0.5 text-[10px]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {plan && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">생성된 plan.json</h2>
            <div className="flex gap-2">
              <button
                onClick={copyPlan}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs"
              >
                <Copy className="h-3.5 w-3.5" /> 복사
              </button>
              <button
                onClick={downloadPlan}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground"
              >
                <Download className="h-3.5 w-3.5" /> 다운로드
              </button>
            </div>
          </div>

          {plan.source_reference?.why_it_worked && (
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">왜 터졌나</p>
                <p className="text-sm mt-1">{plan.source_reference.why_it_worked}</p>
              </div>
              {plan.source_reference.inspired_hook && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">차용한 훅 패턴</p>
                  <p className="text-sm mt-1">{plan.source_reference.inspired_hook}</p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-2 text-sm">
            <div><span className="font-bold">프로젝트:</span> {plan.project_name}</div>
            <div><span className="font-bold">분량:</span> {plan.duration_sec}초 / {plan.shots.length}개 shot</div>
            <div><span className="font-bold">훅:</span> {plan.hook}</div>
          </div>

          <details className="rounded-lg border border-border">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium">JSON 미리보기</summary>
            <pre className="overflow-x-auto p-3 text-[11px] bg-muted/50 rounded-b-lg max-h-96">
              {JSON.stringify(plan, null, 2)}
            </pre>
          </details>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">다음 단계</p>
            <ol className="list-decimal list-inside text-amber-700 dark:text-amber-300 space-y-1 text-xs">
              <li>다운로드한 plan.json을 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">~/shopping-shorts/projects/{plan.project_name}/plan/plan.json</code> 위치에 저장</li>
              <li>제품 이미지 5장을 <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.../{plan.project_name}/assets/</code>에 복사</li>
              <li><code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">python -m app analyze {plan.project_name}</code></li>
              <li><code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">python -m app tts {plan.project_name}</code></li>
              <li><code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">python -m app render-scenes {plan.project_name}</code> → compose → export</li>
            </ol>
          </div>
        </div>
      )}

      <UsageGuide
        steps={[
          {
            title: "1. 아웃라이어/라이징 페이지에서 [재창작] 클릭",
            description: "영상 ID가 자동 입력됩니다. 직접 입력도 가능 (영상 URL 붙여넣기 OK).",
          },
          {
            title: "2. 본인 제품명 + 카테고리 입력",
            description: "Claude가 원본을 분석해 본인 제품에 맞춰 훅·대본·shot 5개·visual prompt까지 생성.",
          },
          {
            title: "3. plan.json 다운로드 → shopping-shorts에 투입",
            description: "shopping-shorts 표준 형식이라 그대로 analyze → tts → render → compose → export 가능.",
          },
          {
            title: "4. 원본 모방 X, 구조만 차용",
            description: "Claude가 'why it worked'와 'inspired hook'을 명시. 본인 제품으로 재창작이지 표절이 아님.",
          },
        ]}
        tip="Anthropic API 키 (ANTHROPIC_API_KEY) 환경변수 필요. Vercel 프로젝트 설정에 추가 후 재배포하세요."
      />
    </div>
  );
}

export default function RemakePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <RemakeInner />
    </Suspense>
  );
}
