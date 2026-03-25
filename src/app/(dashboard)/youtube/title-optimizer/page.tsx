"use client";

import { useState, useEffect } from "react";
import {
  Type,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Sparkles,
  Copy,
  Loader2,
} from "lucide-react";

/* ─── constants ─── */

const EMOTION_WORDS = [
  "충격",
  "미쳤다",
  "ㅋㅋ",
  "대박",
  "역대급",
  "실화",
  "꿀팁",
  "필수",
  "주의",
  "경고",
  "비밀",
  "최초",
  "레전드",
  "ㄷㄷ",
  "소름",
  "놀라운",
  "극혐",
  "개꿀",
  "핵꿀팁",
  "난리",
];

const TITLE_TEMPLATES = [
  { template: "[숫자]가지 [주제] 방법", example: "5가지 유튜브 썸네일 만드는 방법" },
  {
    template: "[주제] 해봤더니 충격적인 결과",
    example: "30일 새벽기상 해봤더니 충격적인 결과",
  },
  {
    template: "[주제] 이것만은 절대 하지마세요",
    example: "주식투자 이것만은 절대 하지마세요",
  },
  {
    template: "아무도 모르는 [주제]의 비밀",
    example: "아무도 모르는 유튜브 알고리즘의 비밀",
  },
  {
    template: "[주제] 전/후 비교 (반전주의)",
    example: "다이어트 전/후 비교 (반전주의)",
  },
  {
    template: "TOP [숫자] [주제] 추천",
    example: "TOP 10 가성비 노트북 추천",
  },
  {
    template: "[주제] 초보자가 꼭 알아야 할 것들",
    example: "캠핑 초보자가 꼭 알아야 할 것들",
  },
  {
    template: "[주제] 현실 리뷰 (솔직후기)",
    example: "아이폰16 현실 리뷰 (솔직후기)",
  },
];

/* ─── analysis types ─── */

interface Criterion {
  label: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
}

interface Analysis {
  score: number;
  criteria: Criterion[];
  suggestions: string[];
}

/* ─── analysis logic (100% client-side, no API) ─── */

function analyzeTitle(title: string): Analysis {
  const trimmed = title.trim();
  if (!trimmed) {
    return { score: 0, criteria: [], suggestions: ["제목을 입력해주세요."] };
  }

  const len = trimmed.length;
  const criteria: Criterion[] = [];
  const suggestions: string[] = [];

  // 1. Title length (25pts)
  {
    let score = 0;
    let passed = false;
    let message = "";
    if (len >= 30 && len <= 60) {
      score = 25;
      passed = true;
      message = `${len}자 — 이상적인 길이입니다`;
    } else if (len >= 20 && len < 30) {
      score = 15;
      message = `${len}자 — 조금 짧습니다 (30~60자 권장)`;
      suggestions.push("제목을 30자 이상으로 늘려보세요. 부가 설명이나 괄호를 추가해보세요.");
    } else if (len > 60 && len <= 80) {
      score = 15;
      message = `${len}자 — 조금 깁니다 (30~60자 권장)`;
      suggestions.push("제목을 60자 이내로 줄여보세요. 검색 결과에서 잘릴 수 있습니다.");
    } else if (len < 20) {
      score = 5;
      message = `${len}자 — 너무 짧습니다`;
      suggestions.push("제목이 너무 짧습니다. 키워드와 설명을 추가하세요.");
    } else {
      score = 5;
      message = `${len}자 — 너무 깁니다`;
      suggestions.push("제목이 너무 깁니다. 핵심만 남기고 줄여보세요.");
    }
    criteria.push({ label: "제목 길이", passed, score, maxScore: 25, message });
  }

  // 2. Numbers (15pts)
  {
    const hasNumber = /\d/.test(trimmed);
    const score = hasNumber ? 15 : 0;
    criteria.push({
      label: "숫자 포함",
      passed: hasNumber,
      score,
      maxScore: 15,
      message: hasNumber
        ? "숫자가 포함되어 있어 클릭률이 높아집니다"
        : "숫자가 없습니다",
    });
    if (!hasNumber) {
      suggestions.push(
        '구체적인 숫자를 넣어보세요 (예: "5가지", "TOP 10", "3분만에").'
      );
    }
  }

  // 3. Emotion words (15pts)
  {
    const found = EMOTION_WORDS.filter((w) =>
      trimmed.toLowerCase().includes(w)
    );
    const count = found.length;
    let score = 0;
    let passed = false;
    let message = "";
    if (count === 1 || count === 2) {
      score = 15;
      passed = true;
      message = `감정 유발 단어 감지: ${found.join(", ")}`;
    } else if (count === 3) {
      score = 10;
      passed = true;
      message = `감정 단어 ${count}개 — 적당한 수준`;
    } else if (count > 3) {
      score = 5;
      message = `감정 단어 ${count}개 — 과도한 어그로는 역효과`;
      suggestions.push(
        "감정 유발 단어가 너무 많습니다. 2개 이하로 줄이세요."
      );
    } else {
      score = 0;
      message = "감정 유발 단어가 없습니다";
      suggestions.push(
        '호기심을 유발하는 단어를 추가해보세요 (예: "꿀팁", "필수", "레전드").'
      );
    }
    criteria.push({ label: "감정 유발 단어", passed, score, maxScore: 15, message });
  }

  // 4. Brackets (10pts)
  {
    const hasBrackets =
      /[\[\]【】\(\)]/.test(trimmed) ||
      /\[.*?\]/.test(trimmed) ||
      /【.*?】/.test(trimmed) ||
      /\(.*?\)/.test(trimmed);
    const score = hasBrackets ? 10 : 0;
    criteria.push({
      label: "괄호 사용",
      passed: hasBrackets,
      score,
      maxScore: 10,
      message: hasBrackets
        ? "괄호가 있어 CTR 향상에 도움됩니다"
        : "괄호가 없습니다",
    });
    if (!hasBrackets) {
      suggestions.push(
        '괄호를 사용해 부가 정보를 넣어보세요 (예: "[꿀팁]", "(반전주의)").'
      );
    }
  }

  // 5. Question mark (10pts)
  {
    const hasQuestion = trimmed.includes("?");
    const score = hasQuestion ? 10 : 0;
    criteria.push({
      label: "물음표 (호기심 유발)",
      passed: hasQuestion,
      score,
      maxScore: 10,
      message: hasQuestion
        ? "물음표로 호기심을 유발합니다"
        : "물음표가 없습니다",
    });
    if (!hasQuestion) {
      suggestions.push(
        "질문형 제목은 호기심을 유발합니다. 물음표 사용을 고려해보세요."
      );
    }
  }

  // 6. Separator (10pts)
  {
    const hasSep = /[|ㅣ\-–—]/.test(trimmed);
    const score = hasSep ? 10 : 0;
    criteria.push({
      label: "구분자 사용 (| 또는 -)",
      passed: hasSep,
      score,
      maxScore: 10,
      message: hasSep
        ? "구분자로 채널/시리즈 정보를 분리하고 있습니다"
        : "구분자가 없습니다",
    });
    if (!hasSep) {
      suggestions.push(
        '"|" 또는 "-"로 채널명이나 시리즈를 분리해보세요.'
      );
    }
  }

  // 7. Clickbait overload check (15pts — penalty based)
  {
    const emotionCount = EMOTION_WORDS.filter((w) =>
      trimmed.toLowerCase().includes(w)
    ).length;
    const excessivePunctuation =
      (trimmed.match(/[!！]{2,}/g) || []).length > 0 ||
      (trimmed.match(/[?？]{2,}/g) || []).length > 0;
    const allCaps =
      trimmed === trimmed.toUpperCase() && /[A-Za-z]/.test(trimmed);

    let score = 15;
    let passed = true;
    let message = "적절한 수준의 제목입니다";

    if (emotionCount > 3 || excessivePunctuation || allCaps) {
      score = 0;
      passed = false;
      const reasons: string[] = [];
      if (emotionCount > 3) reasons.push("감정 단어 과다");
      if (excessivePunctuation) reasons.push("과도한 느낌표/물음표");
      if (allCaps) reasons.push("전체 대문자");
      message = `어그로 과부하: ${reasons.join(", ")}`;
    }

    criteria.push({
      label: "어그로 과부하 체크",
      passed,
      score,
      maxScore: 15,
      message,
    });
  }

  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);

  return { score: totalScore, criteria, suggestions };
}

/* ─── score color ─── */

function scoreColor(score: number) {
  if (score >= 80) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreRingColor(score: number) {
  if (score >= 80) return "stroke-green-500";
  if (score >= 50) return "stroke-yellow-500";
  return "stroke-red-500";
}

/* ─── trending type ─── */

interface TrendingVideo {
  title: string;
  channelTitle: string;
  viewCount: number;
}

/* ─── component ─── */

export default function TitleOptimizerPage() {
  const [title, setTitle] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [trendingTitles, setTrendingTitles] = useState<TrendingVideo[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  // real-time analysis
  useEffect(() => {
    const result = analyzeTitle(title);
    setAnalysis(result);
  }, [title]);

  // fetch trending titles
  useEffect(() => {
    setTrendingLoading(true);
    fetch("/api/youtube/trending?max=5")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items || data || [])
          .slice(0, 5)
          .map((v: Record<string, unknown>) => ({
            title:
              (v.title as string) ||
              ((v.snippet as Record<string, unknown>)?.title as string) ||
              "",
            channelTitle:
              (v.channelTitle as string) ||
              ((v.snippet as Record<string, unknown>)?.channelTitle as string) ||
              "",
            viewCount: Number(
              (v.viewCount as string) ||
                ((v.statistics as Record<string, unknown>)?.viewCount as string) ||
                0
            ),
          }));
        setTrendingTitles(items);
      })
      .catch(() => setTrendingTitles([]))
      .finally(() => setTrendingLoading(false));
  }, []);

  const copyTemplate = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  };

  const score = analysis?.score ?? 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (circumference * score) / 100;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Type className="h-7 w-7 text-red-500" />
          유튜브 제목 최적화
        </h1>
        <p className="mt-1 text-muted-foreground">
          제목을 입력하면 한국 유튜브 SEO 기준으로 실시간 분석합니다 (100% 무료,
          AI API 없음)
        </p>
      </div>

      {/* Input */}
      <div className="rounded-xl border border-border bg-card p-6">
        <label
          htmlFor="title-input"
          className="mb-2 block text-sm font-medium text-muted-foreground"
        >
          영상 제목 입력
        </label>
        <input
          id="title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='예: 5가지 유튜브 썸네일 꿀팁 | 조회수 폭발하는 비밀'
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg outline-none transition-colors focus:border-red-400 focus:ring-1 focus:ring-red-400"
          maxLength={150}
        />
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {title.trim().length}자
            {title.trim().length > 0 && (
              <span
                className={
                  title.trim().length >= 30 && title.trim().length <= 60
                    ? " text-green-500"
                    : title.trim().length >= 20 && title.trim().length <= 80
                    ? " text-yellow-500"
                    : " text-red-500"
                }
              >
                {title.trim().length >= 30 && title.trim().length <= 60
                  ? " (적정)"
                  : title.trim().length < 30
                  ? " (짧음)"
                  : " (김)"}
              </span>
            )}
          </span>
          <span>권장: 30~60자</span>
        </div>
      </div>

      {/* Score + Criteria */}
      {analysis && title.trim().length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Score circle */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6">
            <div className="relative h-32 w-32">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/20"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  className={scoreRingColor(score)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 0.4s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium">
              {score >= 80
                ? "훌륭한 제목입니다!"
                : score >= 50
                ? "개선 여지가 있습니다"
                : "제목을 개선해보세요"}
            </p>
          </div>

          {/* Criteria list */}
          <div className="md:col-span-2 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-red-500" />
              세부 평가
            </h2>
            <div className="space-y-3">
              {analysis.criteria.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                >
                  <div className="mt-0.5">
                    {c.passed ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {c.score}/{c.maxScore}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {c.message}
                    </p>
                    {/* mini bar */}
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/30">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          c.passed ? "bg-green-500" : "bg-red-400"
                        }`}
                        style={{
                          width: `${(c.score / c.maxScore) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis &&
        title.trim().length > 0 &&
        analysis.suggestions.length > 0 && (
          <div className="mt-6 rounded-xl border border-yellow-300/50 bg-yellow-50 p-6 dark:border-yellow-500/20 dark:bg-yellow-500/5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              개선 제안
            </h2>
            <ul className="space-y-2">
              {analysis.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Trending titles comparison */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <TrendingUp className="h-5 w-5 text-red-500" />
          지금 뜨는 영상 제목 참고
        </h2>
        {trendingLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            트렌딩 영상 불러오는 중...
          </div>
        ) : trendingTitles.length > 0 ? (
          <div className="space-y-3">
            {trendingTitles.map((v, i) => {
              const trendAnalysis = analyzeTitle(v.title);
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-border bg-background p-3"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${scoreBg(
                      trendAnalysis.score
                    )} text-sm font-bold text-white`}
                  >
                    {trendAnalysis.score}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{v.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.channelTitle}
                      {v.viewCount > 0 &&
                        ` · ${v.viewCount.toLocaleString()}회`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            트렌딩 데이터를 불러올 수 없습니다
          </p>
        )}
      </div>

      {/* Title templates */}
      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-red-500" />
          고성과 제목 템플릿
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TITLE_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => copyTemplate(t.template, i)}
              className="group rounded-lg border border-border bg-background p-4 text-left transition-all hover:border-red-300 hover:shadow-sm"
            >
              <p className="font-medium text-foreground">{t.template}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                예: {t.example}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <Copy className="h-3 w-3" />
                {copied === i ? "복사됨!" : "클릭하여 복사"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
