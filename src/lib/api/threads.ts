const THREADS_API_BASE = "https://graph.threads.net/v1.0";

function getAccessToken() {
  const token = process.env.THREADS_ACCESS_TOKEN;
  if (!token) throw new Error("THREADS_ACCESS_TOKEN is not set");
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
    throw new Error(`Threads API error: ${res.status} - ${JSON.stringify(error)}`);
  }

  const data = await res.json();
  cache.set(url, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  return data as T;
}

// Get user profile
export async function getUserProfile(userId: string = "me") {
  const url = `${THREADS_API_BASE}/${userId}?fields=id,username,name,threads_biography,threads_profile_picture_url&access_token=${getAccessToken()}`;
  return fetchWithCache<ThreadsUserProfile>(url, 7200);
}

// Get user threads (posts)
export async function getUserThreads(userId: string = "me", limit = 25) {
  const url = `${THREADS_API_BASE}/${userId}/threads?fields=id,text,username,timestamp,media_type,media_url,shortcode,is_quote_post&limit=${limit}&access_token=${getAccessToken()}`;
  return fetchWithCache<ThreadsMediaResponse>(url, 3600);
}

// Get thread insights
export async function getThreadInsights(mediaId: string) {
  const url = `${THREADS_API_BASE}/${mediaId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${getAccessToken()}`;
  return fetchWithCache<ThreadsInsightsResponse>(url, 7200);
}

// Get user insights
export async function getUserInsights(userId: string = "me") {
  const url = `${THREADS_API_BASE}/${userId}/threads_insights?metric=views,likes,replies,reposts,quotes,followers_count&access_token=${getAccessToken()}`;
  return fetchWithCache<ThreadsInsightsResponse>(url, 7200);
}

// === Types ===

interface ThreadsUserProfile {
  id: string;
  username: string;
  name?: string;
  threads_biography?: string;
  threads_profile_picture_url?: string;
}

interface ThreadsPost {
  id: string;
  text?: string;
  username?: string;
  timestamp: string;
  media_type?: "TEXT_POST" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  shortcode?: string;
  is_quote_post?: boolean;
}

interface ThreadsMediaResponse {
  data: ThreadsPost[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

interface ThreadsInsightsResponse {
  data: Array<{
    name: string;
    period: string;
    values: Array<{ value: number }>;
    title: string;
  }>;
}

export type {
  ThreadsUserProfile,
  ThreadsPost,
  ThreadsMediaResponse,
  ThreadsInsightsResponse,
};
