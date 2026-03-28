import { NextRequest } from "next/server";
import { getCached, setCache, TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return Response.json({ error: "q 파라미터가 필요합니다" }, { status: 400 });
  }

  const cacheKey = `suggest_${q.toLowerCase()}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) {
    return Response.json({ suggestions: cached, fromCache: true });
  }

  try {
    // YouTube autocomplete API (free, no quota)
    const res = await fetch(
      `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&hl=ko&gl=kr&q=${encodeURIComponent(q)}&ds=yt`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const text = await res.text();

    // Parse JSONP response: window.google.ac.h([...])
    const match = text.match(/\[.*\]/s);
    if (!match) {
      return Response.json({ suggestions: [] });
    }

    const data = JSON.parse(match[0]);
    // data[1] is array of suggestion arrays, each suggestion[0] is the text
    const suggestions: string[] = (data[1] || [])
      .map((item: string[]) => item[0])
      .filter((s: string) => s && s.toLowerCase() !== q.toLowerCase())
      .slice(0, 10);

    setCache(cacheKey, suggestions, TTL.SEARCH);
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] });
  }
}
