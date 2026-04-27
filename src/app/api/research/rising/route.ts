import { NextRequest } from "next/server";
import { findRisingChannels, RisingChannel } from "@/lib/research/outlier";
import { KEYWORD_PRESETS, SHOPPING_SHORTS_KEYWORDS } from "@/lib/research/keywords";
import { getCached, setCache } from "@/lib/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESULT_TTL = 60 * 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const preset = params.get("preset") || "쇼핑 쇼츠 (한국)";
  const customKeyword = params.get("keyword") || undefined;
  const maxSubscribers = Number(params.get("maxSubs") || "50000");
  const minOutlier = Number(params.get("minOutlier") || "5");
  const maxDays = Number(params.get("maxDays") || "30");
  const limit = Math.min(Number(params.get("limit") || "20"), 50);

  let keywords: readonly string[];
  if (customKeyword) {
    keywords = [customKeyword];
  } else if (KEYWORD_PRESETS[preset]) {
    keywords = KEYWORD_PRESETS[preset];
  } else {
    keywords = SHOPPING_SHORTS_KEYWORDS;
  }

  const cacheKey = `rising_${preset}_${customKeyword || ""}_${maxSubscribers}_${minOutlier}_${maxDays}_${limit}`;
  const cached = getCached<{ items: RisingChannel[]; fetchedAt: string }>(cacheKey);
  if (cached) {
    return Response.json({ ...cached, fromCache: true });
  }

  const all: RisingChannel[] = [];
  for (const kw of keywords) {
    try {
      const items = await findRisingChannels({
        keyword: kw,
        maxResults: 15,
        maxSubscribers,
        minOutlier,
        maxDays,
      });
      all.push(...items);
    } catch {
      // skip keyword on quota / API error
    }
  }

  const seen = new Set<string>();
  const dedup: RisingChannel[] = [];
  for (const c of all.sort((a, b) => b.risingScore - a.risingScore)) {
    if (seen.has(c.channelId)) continue;
    seen.add(c.channelId);
    dedup.push(c);
    if (dedup.length >= limit) break;
  }

  const payload = {
    items: dedup,
    keywords: [...keywords],
    fetchedAt: new Date().toISOString(),
  };
  setCache(cacheKey, payload, RESULT_TTL);

  return Response.json({ ...payload, fromCache: false });
}
