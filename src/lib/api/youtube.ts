const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

function getApiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

// Simple in-memory cache for server-side
const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchWithCache<T>(
  url: string,
  ttlSeconds: number
): Promise<T> {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `YouTube API error: ${res.status} - ${JSON.stringify(error)}`
    );
  }

  const data = await res.json();
  cache.set(url, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data as T;
}

// Channel info (1 unit)
export async function getChannel(channelId: string) {
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${getApiKey()}`;
  return fetchWithCache<YouTubeChannelResponse>(url, 3600);
}

// Channel by username/handle (1 unit)
export async function getChannelByHandle(handle: string) {
  const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&forHandle=${cleanHandle}&key=${getApiKey()}`;
  return fetchWithCache<YouTubeChannelResponse>(url, 3600);
}

// Video details (1 unit per 50 videos)
export async function getVideos(videoIds: string[]) {
  const ids = videoIds.slice(0, 50).join(",");
  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${getApiKey()}`;
  return fetchWithCache<YouTubeVideoResponse>(url, 1800);
}

// Channel videos (1 unit for playlistItems, then 1 unit for videos)
export async function getChannelVideos(
  uploadsPlaylistId: string,
  maxResults = 20
) {
  const url = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${getApiKey()}`;
  return fetchWithCache<YouTubePlaylistResponse>(url, 1800);
}

// Trending videos in Korea (1 unit)
export async function getTrendingVideos(
  categoryId?: string,
  maxResults = 20
) {
  let url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=KR&maxResults=${maxResults}&key=${getApiKey()}`;
  if (categoryId) url += `&videoCategoryId=${categoryId}`;
  return fetchWithCache<YouTubeVideoResponse>(url, 3600);
}

// Search (100 units - use sparingly!)
export async function searchVideos(
  query: string,
  maxResults = 10,
  order: "relevance" | "viewCount" | "date" = "relevance"
) {
  const url = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&regionCode=KR&maxResults=${maxResults}&order=${order}&key=${getApiKey()}`;
  return fetchWithCache<YouTubeSearchResponse>(url, 3600);
}

// Video categories (1 unit)
export async function getVideoCategories() {
  const url = `${YOUTUBE_API_BASE}/videoCategories?part=snippet&regionCode=KR&key=${getApiKey()}`;
  return fetchWithCache<YouTubeCategoryResponse>(url, 86400);
}

// === Types ===

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      thumbnails: { high?: { url: string } };
      country?: string;
    };
    statistics: {
      subscriberCount: string;
      videoCount: string;
      viewCount: string;
    };
    brandingSettings?: {
      channel?: { keywords?: string };
    };
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
}

interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      channelId: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: { high?: { url: string }; medium?: { url: string } };
      tags?: string[];
      categoryId?: string;
    };
    statistics: {
      viewCount: string;
      likeCount: string;
      commentCount: string;
    };
    contentDetails?: {
      duration: string;
    };
  }>;
}

interface YouTubePlaylistResponse {
  items: Array<{
    snippet: {
      resourceId: { videoId: string };
      title: string;
      publishedAt: string;
      thumbnails: { high?: { url: string } };
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelId: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: { high?: { url: string } };
    };
  }>;
  nextPageToken?: string;
  pageInfo: { totalResults: number };
}

interface YouTubeCategoryResponse {
  items: Array<{
    id: string;
    snippet: { title: string };
  }>;
}

export type {
  YouTubeChannelResponse,
  YouTubeVideoResponse,
  YouTubePlaylistResponse,
  YouTubeSearchResponse,
  YouTubeCategoryResponse,
};
