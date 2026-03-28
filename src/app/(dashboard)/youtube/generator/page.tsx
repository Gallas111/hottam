"use client";

import { useState } from "react";
import { Sparkles, Search, Copy, Check, FileText, Hash, Image, Type, Loader2, Eye, ThumbsUp } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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

interface GeneratedContent {
  titles: string[];
  description: string;
  hashtags: string[];
  thumbnailTips: string[];
  topPatterns: { pattern: string; example: string }[];
}

// Korean title templates
const TITLE_TEMPLATES = [
  "{keyword} {숫자}가지 방법 — {결과}",
  "{keyword}, 이것만 알면 끝! ({연도})",
  "{keyword} 완벽 가이드 | 초보자도 {시간}만에",
  "아직도 {keyword} 모르세요? {숫자}가지 핵심 정리",
  "{keyword} 전 vs 후, 차이가 미쳤습니다",
  "{keyword} 현실 후기 — 솔직하게 알려드림",
  "{직업/대상}을 위한 {keyword} 총정리 ({연도})",
  "{keyword}, {숫자}분 만에 마스터하기",
  "{keyword} 하면 안되는 실수 {숫자}가지",
  "{keyword} 비용 0원으로 시작하는 법",
];

function extractPatterns(titles: string[]): { numbers: boolean; question: boolean; brackets: boolean; emoji: boolean; vsFormat: boolean; yearMention: boolean } {
  const total = titles.length || 1;
  return {
    numbers: titles.filter((t) => /\d/.test(t)).length / total > 0.5,
    question: titles.filter((t) => /\?|까요|나요|세요/.test(t)).length / total > 0.3,
    brackets: titles.filter((t) => /[\[\]【】()（）]/.test(t)).length / total > 0.3,
    emoji: titles.filter((t) => /[\u{1F300}-\u{1FAFF}]/u.test(t)).length / total > 0.2,
    vsFormat: titles.filter((t) => /vs|VS|대|비교/.test(t)).length / total > 0.2,
    yearMention: titles.filter((t) => /202[4-9]|2030/.test(t)).length / total > 0.2,
  };
}

function generateTitles(keyword: string, topTitles: string[]): string[] {
  const patterns = extractPatterns(topTitles);
  const year = new Date().getFullYear();
  const results: string[] = [];

  // Template-based titles
  const fills: Record<string, string[]> = {
    "{keyword}": [keyword],
    "{숫자}": ["3", "5", "7", "10"],
    "{결과}": ["당장 효과 나는", "모르면 손해인", "돈 아끼는", "시간 절약하는"],
    "{연도}": [`${year}`],
    "{시간}": ["5분", "10분", "30분"],
    "{직업/대상}": ["직장인", "초보자", "대학생", "주부"],
  };

  TITLE_TEMPLATES.forEach((tpl) => {
    let title = tpl;
    for (const [key, vals] of Object.entries(fills)) {
      title = title.replace(key, vals[Math.floor(Math.random() * vals.length)]);
    }
    results.push(title);
  });

  // Pattern-enhanced titles
  if (patterns.question) {
    results.unshift(`${keyword}, 아직도 이렇게 하세요? (${year} 최신)`);
  }
  if (patterns.vsFormat) {
    results.unshift(`${keyword} A vs B — 뭐가 더 나을까?`);
  }
  if (patterns.numbers) {
    results.unshift(`${keyword} TOP 5 — 전문가가 추천하는 방법`);
  }

  // Deduplicate and limit
  return [...new Set(results)].slice(0, 8);
}

function generateDescription(keyword: string, hashtags: string[]): string {
  const year = new Date().getFullYear();
  const hashtagStr = hashtags.slice(0, 5).map((h) => `#${h}`).join(" ");

  return `${keyword}에 대해 자세히 알려드려요!
이 영상에서는 ${keyword}의 핵심 포인트를 정리했어요.

${hashtagStr}

---

00:00 인트로
00:30 ${keyword}란?
02:00 핵심 포인트 1
04:00 핵심 포인트 2
06:00 핵심 포인트 3
08:00 정리 및 추천

---

이 영상이 도움이 되셨다면 좋아요와 구독 부탁드려요!
궁금한 점은 댓글로 남겨주세요.

---

비즈니스 문의: (이메일 입력)

#${keyword} #${keyword}${year} ${hashtagStr}`;
}

function generateThumbnailTips(keyword: string, patterns: { numbers: boolean; question: boolean; brackets: boolean }): string[] {
  const tips: string[] = [
    `큰 텍스트로 "${keyword}" 핵심 키워드를 넣으세요 (3~5단어 이내)`,
    "배경과 텍스트 색상 대비를 강하게 하세요 (노란 배경+검정 글씨, 빨간 배경+흰 글씨)",
    "사람 얼굴을 넣으면 CTR이 올라가요 (놀란 표정, 가리키는 손가락)",
  ];

  if (patterns.numbers) {
    tips.push("숫자를 크게 넣으세요 (예: '5가지' → 큰 숫자 5 강조)");
  }
  if (patterns.question) {
    tips.push("질문형 텍스트로 호기심 유발 (예: '이거 실화?', '왜 아무도 안 알려줄까?')");
  }

  tips.push("비포/애프터 구도가 클릭률 높아요 (왼쪽 Before → 오른쪽 After)");
  tips.push("빨간색 원이나 화살표로 시선을 유도하세요");
  tips.push("상위 영상 썸네일을 참고하되 똑같이 하지 마세요 — 차별화 포인트 1개 넣기");

  return tips;
}

export default function GeneratorPage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError("");
    setContent(null);

    try {
      // Fetch top videos for this keyword
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(keyword.trim())}&order=viewCount`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "검색 실패");

      const videos = (data.videos || []) as SearchResult[];
      if (videos.length === 0) {
        setError("검색 결과가 없습니다. 다른 키워드를 시도해보세요.");
        return;
      }

      // Extract top titles
      const topTitles = videos.map((v) => v.title);

      // Generate titles
      const titles = generateTitles(keyword.trim(), topTitles);

      // Extract hashtags from video descriptions and titles
      const allWords = videos.flatMap((v) => [
        ...v.title.replace(/[^가-힣a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2),
        ...v.description.replace(/[^가-힣a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2),
      ]);
      const wordFreq = new Map<string, number>();
      allWords.forEach((w) => {
        const key = w.toLowerCase();
        if (key !== keyword.toLowerCase() && key.length >= 2) {
          wordFreq.set(key, (wordFreq.get(key) || 0) + 1);
        }
      });
      const hashtags = [
        keyword.trim(),
        ...([...wordFreq.entries()]
          .filter(([, count]) => count >= 2)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 14)
          .map(([word]) => word)),
      ];

      // Generate description
      const description = generateDescription(keyword.trim(), hashtags);

      // Thumbnail tips
      const patterns = extractPatterns(topTitles);
      const thumbnailTips = generateThumbnailTips(keyword.trim(), patterns);

      // Top patterns analysis
      const topPatterns: { pattern: string; example: string }[] = [];
      if (patterns.numbers) topPatterns.push({ pattern: "숫자 사용", example: topTitles.find((t) => /\d/.test(t)) || "" });
      if (patterns.question) topPatterns.push({ pattern: "질문형 제목", example: topTitles.find((t) => /\?|까요|나요|세요/.test(t)) || "" });
      if (patterns.brackets) topPatterns.push({ pattern: "괄호/구분자 사용", example: topTitles.find((t) => /[\[\]【】()（）|]/.test(t)) || "" });
      if (patterns.vsFormat) topPatterns.push({ pattern: "비교 형식", example: topTitles.find((t) => /vs|VS|대|비교/.test(t)) || "" });
      if (patterns.yearMention) topPatterns.push({ pattern: "연도 표시", example: topTitles.find((t) => /202[4-9]/.test(t)) || "" });

      setContent({ titles, description, hashtags, thumbnailTips, topPatterns });
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function CopyButton({ text, field }: { text: string; field: string }) {
    return (
      <button
        onClick={() => copyText(text, field)}
        className="flex-shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        title="복사"
      >
        {copiedField === field ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Sparkles className="h-7 w-7 text-purple-500" />
          영상 메타데이터 자동 생성
        </h1>
        <p className="mt-1 text-muted-foreground">
          키워드만 입력하면 제목, 설명, 해시태그, 썸네일 가이드를 자동으로 만들어드려요
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          * 상위 영상 패턴 분석 기반 (AI API 없음, 100% 무료)
        </p>
      </div>

      <UsageGuide
        steps={[
          { title: "만들려는 영상의 핵심 키워드를 입력하세요", description: "예: '자취 요리', '주식 투자', '다이어트 식단' — 구체적일수록 좋아요." },
          { title: "생성된 제목 중 마음에 드는 걸 고르고 다듬으세요", description: "그대로 쓰지 말고 내 스타일로 수정하세요. 제목 최적화 도구에서 점수도 확인해보세요." },
          { title: "설명을 복사해서 타임스탬프와 링크를 채우세요", description: "템플릿 구조를 유지하고 실제 시간과 내용만 바꾸면 돼요." },
          { title: "해시태그 15개를 그대로 복사해서 붙이세요", description: "유튜브는 해시태그 15개까지 허용해요. 설명 맨 아래에 넣으세요." },
        ]}
        tip="같은 키워드를 여러 번 생성하면 다른 조합이 나와요. 3번 정도 돌려보고 가장 좋은 걸 고르세요."
      />

      {/* Input */}
      <form onSubmit={handleGenerate} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="영상 키워드 입력 (예: 자취 요리)"
              className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-purple-500 px-6 py-3 text-sm font-medium text-white hover:bg-purple-600 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "분석 중..." : "자동 생성"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      )}

      {content && (
        <div className="space-y-6">

          {/* Top Patterns */}
          {content.topPatterns.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />상위 영상 패턴 분석</CardTitle></CardHeader>
              <div className="space-y-2">
                {content.topPatterns.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">{p.pattern}</span>
                    <p className="text-sm text-muted-foreground line-clamp-1">{p.example}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Generated Titles */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" />제목 후보 ({content.titles.length}개)</CardTitle></CardHeader>
            <div className="space-y-2">
              {content.titles.map((title, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-300">{i + 1}</span>
                  <p className="flex-1 text-sm font-medium">{title}</p>
                  <CopyButton text={title} field={`title-${i}`} />
                </div>
              ))}
            </div>
          </Card>

          {/* Generated Description */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />영상 설명 템플릿</CardTitle>
                <CopyButton text={content.description} field="description" />
              </div>
            </CardHeader>
            <pre className="whitespace-pre-wrap rounded-lg bg-secondary/50 p-4 text-sm leading-relaxed text-foreground">{content.description}</pre>
          </Card>

          {/* Hashtags */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Hash className="h-5 w-5" />해시태그 ({content.hashtags.length}개)</CardTitle>
                <CopyButton text={content.hashtags.map((h) => `#${h}`).join(" ")} field="hashtags" />
              </div>
            </CardHeader>
            <div className="flex flex-wrap gap-2">
              {content.hashtags.map((tag, i) => (
                <span key={i} className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
                  #{tag}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">유튜브 설명 맨 아래에 복사해서 붙이세요. 처음 3개는 영상 위에 표시돼요.</p>
          </Card>

          {/* Thumbnail Tips */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />썸네일 제작 가이드</CardTitle></CardHeader>
            <div className="space-y-2">
              {content.thumbnailTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900 dark:text-amber-300">{i + 1}</span>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!content && !error && !loading && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">키워드를 입력하면 제목, 설명, 해시태그, 썸네일 가이드를 자동으로 만들어드려요</p>
          <p className="mt-1 text-sm text-muted-foreground">예: 자취 요리, 주식 투자, 다이어트 식단</p>
        </div>
      )}
    </div>
  );
}
