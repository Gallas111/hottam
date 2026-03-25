import { NextRequest } from "next/server";
import { searchVideos, getVideos } from "@/lib/api/youtube";
import { getCached, setCache, TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const order = (request.nextUrl.searchParams.get("order") ?? "relevance") as
    | "relevance"
    | "viewCount"
    | "date";

  if (!q) {
    return Response.json({ error: "q 파라미터가 필요합니다" }, { status: 400 });
  }

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
  } catch (err) {
    const message = err instanceof Error ? err.message : "API 오류";
    return Response.json({ error: message }, { status: 500 });
  }
}
