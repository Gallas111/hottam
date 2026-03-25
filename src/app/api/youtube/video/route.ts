import { NextRequest } from "next/server";
import { getVideos } from "@/lib/api/youtube";
import { getCached, setCache, TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id 파라미터가 필요합니다" }, { status: 400 });
  }

  const cacheKey = `video_${id}`;
  const cached = getCached<object>(cacheKey);
  if (cached) {
    return Response.json({ ...cached, fromCache: true });
  }

  try {
    const data = await getVideos([id]);
    if (!data.items || data.items.length === 0) {
      return Response.json({ error: "영상을 찾을 수 없습니다" }, { status: 404 });
    }

    const video = data.items[0];
    const result = {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      thumbnailUrl: video.snippet.thumbnails.high?.url ?? "",
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      duration: video.contentDetails?.duration ?? "",
      tags: video.snippet.tags ?? [],
      categoryId: video.snippet.categoryId ?? "",
    };

    setCache(cacheKey, result, TTL.VIDEO);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "API 오류";
    return Response.json({ error: message }, { status: 500 });
  }
}
