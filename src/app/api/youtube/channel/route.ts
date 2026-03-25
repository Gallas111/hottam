import { NextRequest } from "next/server";
import { getChannel, getChannelByHandle, getChannelVideos, getVideos } from "@/lib/api/youtube";
import { getCached, setCache, TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return Response.json({ error: "q 파라미터가 필요합니다" }, { status: 400 });
  }

  // Check cache
  const cacheKey = `channel_${q.toLowerCase()}`;
  const cached = getCached<object>(cacheKey);
  if (cached) {
    return Response.json({ ...cached, fromCache: true });
  }

  try {
    let channelData;
    if (q.startsWith("@")) {
      channelData = await getChannelByHandle(q);
    } else if (q.startsWith("UC")) {
      channelData = await getChannel(q);
    } else {
      try {
        channelData = await getChannelByHandle(q);
      } catch {
        channelData = await getChannel(q);
      }
    }

    if (!channelData.items || channelData.items.length === 0) {
      return Response.json({ error: "채널을 찾을 수 없습니다" }, { status: 404 });
    }

    const ch = channelData.items[0];
    const uploadsPlaylistId = "UU" + ch.id.slice(2);

    let videos: Array<{
      id: string;
      title: string;
      viewCount: string;
      likeCount: string;
      commentCount: string;
      publishedAt: string;
      thumbnailUrl: string;
      duration: string;
    }> = [];

    try {
      const playlist = await getChannelVideos(uploadsPlaylistId, 10);
      const videoIds = playlist.items.map((item) => item.snippet.resourceId.videoId);

      if (videoIds.length > 0) {
        const videoData = await getVideos(videoIds);
        videos = videoData.items.map((v) => ({
          id: v.id,
          title: v.snippet.title,
          viewCount: v.statistics.viewCount,
          likeCount: v.statistics.likeCount,
          commentCount: v.statistics.commentCount,
          publishedAt: v.snippet.publishedAt,
          thumbnailUrl: v.snippet.thumbnails.medium?.url ?? v.snippet.thumbnails.high?.url ?? "",
          duration: v.contentDetails?.duration ?? "",
        }));
      }
    } catch {
      // Videos fetch failed
    }

    const result = {
      id: ch.id,
      title: ch.snippet.title,
      description: ch.snippet.description,
      thumbnailUrl: ch.snippet.thumbnails.high?.url ?? "",
      subscriberCount: ch.statistics.subscriberCount,
      videoCount: ch.statistics.videoCount,
      viewCount: ch.statistics.viewCount,
      country: ch.snippet.country,
      videos,
    };

    // Cache for 6 hours
    setCache(cacheKey, result, TTL.CHANNEL);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "API 오류";
    return Response.json({ error: message }, { status: 500 });
  }
}
