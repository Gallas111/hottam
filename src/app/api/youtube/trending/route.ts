import { NextRequest } from "next/server";
import {
  getTrendingVideos,
  getVideoCategories,
  searchVideos,
  getVideos,
} from "@/lib/api/youtube";
import { getCached, setCache, TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const categoryId =
    request.nextUrl.searchParams.get("category") || undefined;
  const keyword = request.nextUrl.searchParams.get("keyword") || undefined;
  const maxResults = parseInt(
    request.nextUrl.searchParams.get("max") || "20"
  );

  try {
    // Build cache key
    const cacheKey = keyword
      ? `trending_keyword_${keyword}_${maxResults}`
      : `trending_${categoryId || "all"}_${maxResults}`;

    // Check cache first
    const cached = getCached<{ videos: unknown[]; categories: unknown[]; source: string }>(cacheKey);
    if (cached) {
      return Response.json({ ...cached, fromCache: true });
    }

    // Fetch categories (cached separately for 24h)
    let categoriesItems;
    const cachedCategories = getCached<unknown[]>("yt_categories");
    if (cachedCategories) {
      categoriesItems = cachedCategories;
    } else {
      const categories = await getVideoCategories();
      categoriesItems = categories.items;
      setCache("yt_categories", categoriesItems, TTL.CATEGORIES);
    }

    // Custom keyword-based category
    if (keyword) {
      const searchData = await searchVideos(keyword, Math.min(maxResults, 20), "viewCount");
      const videoIds = searchData.items.map((item) => item.id.videoId);

      let videos: unknown[] = [];
      if (videoIds.length > 0) {
        const videoData = await getVideos(videoIds);
        videos = videoData.items;
      }

      const result = { videos, categories: categoriesItems, source: "search" };
      setCache(cacheKey, result, TTL.SEARCH);
      return Response.json(result);
    }

    // YouTube official category
    const trendingData = await getTrendingVideos(categoryId, Math.min(maxResults, 50));
    const result = { videos: trendingData.items, categories: categoriesItems, source: "trending" };
    setCache(cacheKey, result, TTL.TRENDING);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "API 오류";
    return Response.json({ error: message }, { status: 500 });
  }
}
