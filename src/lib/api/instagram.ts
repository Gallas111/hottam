const IG_API_BASE = "https://graph.instagram.com/v21.0";

function getAccessToken() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) throw new Error("INSTAGRAM_ACCESS_TOKEN is not set");
  return token;
}

const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchWithCache<T>(url: string, ttlSeconds: number): Promise<T> {
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(`Instagram API error: ${res.status} - ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  cache.set(url, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data as T;
}

// Get user profile
export async function getUserProfile(userId: string = "me") {
  const url = `${IG_API_BASE}/${userId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${getAccessToken()}`;
  return fetchWithCache<IGUserProfile>(url, 7200);
}

// Get user media
export async function getUserMedia(userId: string = "me", limit = 25) {
  const url = `${IG_API_BASE}/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=${limit}&access_token=${getAccessToken()}`;
  return fetchWithCache<IGMediaResponse>(url, 3600);
}

// Get media insights (only for own media)
export async function getMediaInsights(mediaId: string) {
  const url = `${IG_API_BASE}/${mediaId}/insights?metric=impressions,reach,engagement,saved&access_token=${getAccessToken()}`;
  return fetchWithCache<IGInsightsResponse>(url, 7200);
}

// Search hashtag
export async function searchHashtag(hashtag: string) {
  const url = `${IG_API_BASE}/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&access_token=${getAccessToken()}`;
  return fetchWithCache<IGHashtagSearchResponse>(url, 86400);
}

// Get hashtag recent media
export async function getHashtagMedia(hashtagId: string, userId: string) {
  const url = `${IG_API_BASE}/${hashtagId}/recent_media?user_id=${userId}&fields=id,caption,media_type,like_count,comments_count,timestamp,permalink&access_token=${getAccessToken()}`;
  return fetchWithCache<IGMediaResponse>(url, 3600);
}

// === Types ===

interface IGUserProfile {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  profile_picture_url?: string;
}

interface IGMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

interface IGMediaResponse {
  data: IGMediaItem[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

interface IGInsightsResponse {
  data: Array<{
    name: string;
    period: string;
    values: Array<{ value: number }>;
    title: string;
  }>;
}

interface IGHashtagSearchResponse {
  data: Array<{ id: string }>;
}

export type {
  IGUserProfile,
  IGMediaItem,
  IGMediaResponse,
  IGInsightsResponse,
  IGHashtagSearchResponse,
};
