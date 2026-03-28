import { NextRequest } from "next/server";
import { searchVideos, getVideos } from "@/lib/api/youtube";
import { getCached, setCache, TTL } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

const ALLOWED_ORDERS = ["relevance", "viewCount", "date"] as const;

export async function GET(request: NextRequest) {
  // Rate limit: 30 searches per minute per IP
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { ok } = rateLimit(`search_${ip}`, 30, 60_000);
  if (!ok) {
    return Response.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도하세요." }, { status: 429 });
  }

  const q = request.nextUrl.searchParams.get("q");
  const orderParam = request.nextUrl.searchParams.get("order") ?? "relevance";

  // Input validation
  if (!q || q.trim().length === 0) {
    return Response.json({ error: "q 파라미터가 필요합니다" }, { status: 400 });
  }
  if (q.length > 200) {
    return Response.json({ error: "검색어가 너무 깁니다" }, { status: 400 });
  }

  const order = ALLOWED_ORDERS.includes(orderParam as typeof ALLOWED_ORDERS[number])
    ? (orderParam as typeof ALLOWED_ORDERS[number])
    : "relevance";

  // Check cache
  const cacheKey = `search_${q.toLowerCase()}_${order}`;
  const cached = getCached<object>(cacheKey);
  if (cached) {
    return Response.json({ ...cached, fromCache: true });
  }

  try {
    const searchData = await searchVideos(q, 10, order);
    const videoIds = searchData.items.map((item) => item.id.videoId);

    let videos: Array<{
      id: string;
      title: string;
      description: string;
      channelTitle: string;
      publishedAt: string;
      thumbnailUrl: string;
      viewCount: string;
      likeCount: string;
      commentCount: string;
    }> = [];

    if (videoIds.length > 0) {
      const videoData = await getVideos(videoIds);
      videos = videoData.items.map((v) => ({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description.slice(0, 200),
        channelTitle: v.snippet.channelTitle,
        publishedAt: v.snippet.publishedAt,
        thumbnailUrl:
          v.snippet.thumbnails.high?.url ??
          v.snippet.thumbnails.medium?.url ??
          "",
        viewCount: v.statistics.viewCount,
        likeCount: v.statistics.likeCount,
        commentCount: v.statistics.commentCount,
      }));
    }

    const result = {
      videos,
      totalResults: searchData.pageInfo.totalResults,
    };

    // Cache for 2 hours
    setCache(cacheKey, result, TTL.SEARCH);
    return Response.json(result);
  } catch {
    return Response.json({ error: "검색 중 오류가 발생했습니다" }, { status: 500 });
  }
}
