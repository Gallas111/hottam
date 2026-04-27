import { NextRequest } from "next/server";
import { findOutliersForKeyword, OutlierVideo } from "@/lib/research/outlier";
import { KEYWORD_PRESETS, SHOPPING_SHORTS_KEYWORDS } from "@/lib/research/keywords";
import { getCached, setCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESULT_TTL = 60 * 60; // 1h

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const preset = params.get("preset") || "쇼핑 쇼츠 (한국)";
  const customKeyword = params.get("keyword") || undefined;
  const shortsOnly = params.get("shortsOnly") === "1";
  const minOutlier = Number(params.get("minOutlier") || "3");
  const maxDays = Number(params.get("maxDays") || "30");
  const limit = Math.min(Number(params.get("limit") || "30"), 60);

  let keywords: readonly string[];
  if (customKeyword) {
    keywords = [customKeyword];
  } else if (KEYWORD_PRESETS[preset]) {
    keywords = KEYWORD_PRESETS[preset];
  } else {
    keywords = SHOPPING_SHORTS_KEYWORDS;
  }

  const cacheKey = `outliers_${preset}_${customKeyword || ""}_${shortsOnly}_${minOutlier}_${maxDays}_${limit}`;
  const cached = getCached<{ items: OutlierVideo[]; keywords: string[]; fetchedAt: string }>(cacheKey);
  if (cached) {
    return Response.json({ ...cached, fromCache: true });
  }

  const all: OutlierVideo[] = [];
  const errors: string[] = [];

  // 키워드 직렬 처리 (quota 보호 + rate limit 회피)
  for (const kw of keywords) {
    try {
      const items = await findOutliersForKeyword({
        keyword: kw,
        maxResults: 15,
        shortsOnly,
        minOutlier,
        maxDays,
      });
      all.push(...items);
    } catch (e) {
      errors.push(`${kw}: ${(e as Error).message}`);
    }
  }

  // 영상 ID 중복 제거
  const seen = new Set<string>();
  const dedup: OutlierVideo[] = [];
  for (const v of all.sort((a, b) => b.opportunityScore - a.opportunityScore)) {
    if (seen.has(v.videoId)) continue;
    seen.add(v.videoId);
    dedup.push(v);
    if (dedup.length >= limit) break;
  }

  const payload = {
    items: dedup,
    keywords: [...keywords],
    fetchedAt: new Date().toISOString(),
    errors,
  };
  setCache(cacheKey, payload, RESULT_TTL);

  return Response.json({ ...payload, fromCache: false });
}
