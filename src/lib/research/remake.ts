import { getVideos } from "@/lib/api/youtube";

export interface SourceVideo {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  duration: string;
}

export async function fetchSourceVideo(videoId: string): Promise<SourceVideo | null> {
  const res = await getVideos([videoId]);
  const item = res.items[0];
  if (!item) return null;
  return {
    videoId: item.id,
    title: item.snippet.title,
    description: item.snippet.description?.slice(0, 1500) || "",
    channelTitle: item.snippet.channelTitle,
    publishedAt: item.snippet.publishedAt,
    viewCount: Number(item.statistics.viewCount || 0),
    likeCount: Number(item.statistics.likeCount || 0),
    commentCount: Number(item.statistics.commentCount || 0),
    tags: item.snippet.tags || [],
    duration: item.contentDetails?.duration || "",
  };
}

export interface RemakeOptions {
  source: SourceVideo;
  productName: string;
  productCategory?: string;
  targetAudience?: string;
  tone?: string;
  language?: "ko" | "en";
}

export interface RemakePlan {
  project_name: string;
  duration_sec: number;
  hook: string;
  script: string[];
  shots: Array<{
    id: string;
    type: string;
    duration: number;
    caption: string;
    narration: string;
    visual_goal: string;
    visual_prompt: string;
    asset_dependencies: string[];
  }>;
  metadata: {
    aspect_ratio: string;
    resolution: [number, number];
    fps: number;
  };
  source_reference: {
    video_id: string;
    title: string;
    channel: string;
    why_it_worked: string;
    inspired_hook: string;
  };
}

const SYSTEM_PROMPT = `당신은 한국어 쇼핑 쇼츠 카피라이터입니다. 발견된 인기 영상을 참고로,
사용자가 만들 본인 제품 쇼츠의 plan.json을 작성합니다.

규칙:
1. 원본 영상을 그대로 모방하지 말 것. 훅·문제·해결 구조만 차용해서 본인 제품으로 재구성.
2. 27초 분량 (5개 shot, 각 약 5.4초).
3. 첫 3초 훅이 가장 중요. 문제 제기 또는 강한 의문문.
4. 한국어 자연체, "~거든요", "~더라고요". 광고 톤 금지.
5. visual_prompt는 영어로 (Wan22 I2V 호환). 9:16 vertical 명시.
6. shot type 5종: hook_product_closeup → hero_product_spin → feature_demo → detail_macro → cta_endcard
7. 출력은 JSON만. 코드 블록 없이 순수 JSON 객체.`;

export async function generateRemakePlan(opts: RemakeOptions): Promise<RemakePlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const userPrompt = `# 발견된 인기 영상
- 제목: ${opts.source.title}
- 채널: ${opts.source.channelTitle}
- 조회수: ${opts.source.viewCount.toLocaleString("ko-KR")}
- 좋아요: ${opts.source.likeCount.toLocaleString("ko-KR")}
- 태그: ${opts.source.tags.slice(0, 8).join(", ")}
- 설명 일부: ${opts.source.description.slice(0, 500)}

# 본인 제품 (재창작 대상)
- 제품명: ${opts.productName}
- 카테고리: ${opts.productCategory || "쇼핑/살림 일반"}
- 타깃: ${opts.targetAudience || "20~30대 자취생/신혼부부"}
- 톤: ${opts.tone || "친근한 대화체"}

# 작업
원본 영상이 왜 터졌는지 분석하고, 그 구조를 본인 제품에 맞게 재구성한 plan.json을 작성해주세요.
source_reference.why_it_worked에 분석 1~2문장, source_reference.inspired_hook에 차용한 훅 패턴 1문장.

project_name은 영문 슬러그로 (예: ${opts.productName.replace(/\s+/g, "_").toLowerCase()}_remake_${Date.now().toString(36).slice(-4)}).
metadata.aspect_ratio: "9:16", resolution: [720, 1280], fps: 30 고정.
duration_sec ≈ 27. shots 5개, asset_dependencies는 모두 빈 배열.

순수 JSON만 출력하세요. 코드 블록 마커 없이.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text || "";
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Claude 응답에서 JSON을 찾을 수 없습니다");
  }
  const json = text.slice(jsonStart, jsonEnd + 1);
  const plan = JSON.parse(json) as RemakePlan;

  // 필수 필드 보강
  plan.metadata = plan.metadata || { aspect_ratio: "9:16", resolution: [720, 1280], fps: 30 };
  plan.source_reference = plan.source_reference || {
    video_id: opts.source.videoId,
    title: opts.source.title,
    channel: opts.source.channelTitle,
    why_it_worked: "",
    inspired_hook: "",
  };
  plan.source_reference.video_id = opts.source.videoId;
  plan.source_reference.title = opts.source.title;
  plan.source_reference.channel = opts.source.channelTitle;

  return plan;
}
