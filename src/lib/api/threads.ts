// Threads API 클라이언트 — hottam-api Worker 경유 (BYOT)
// 사용자는 본인 Threads access token 을 localStorage 에 저장.
// 모든 호출 시 X-Threads-Token 헤더로 Worker 에 전달 (서버 저장 0).

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://hottam-api.j-810.workers.dev";
const TOKEN_KEY = "hottam_threads_token";
const TOKEN_ISSUED_AT_KEY = "hottam_threads_token_issued_at";  // ms epoch
const TOKEN_EXPIRES_AT_KEY = "hottam_threads_token_expires_at";  // ms epoch
const REFRESH_THRESHOLD_DAYS = 50;  // 50일 이상 지나면 자동 갱신
const TOKEN_LIFETIME_MS = 60 * 24 * 60 * 60 * 1000;  // 기본 60일

export function getThreadsToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getTokenInfo(): { token: string | null; issuedAt: Date | null; expiresAt: Date | null; ageInDays: number | null; daysUntilExpiry: number | null } {
  if (typeof window === "undefined") return { token: null, issuedAt: null, expiresAt: null, ageInDays: null, daysUntilExpiry: null };
  const token = localStorage.getItem(TOKEN_KEY);
  const issuedAtStr = localStorage.getItem(TOKEN_ISSUED_AT_KEY);
  const expiresAtStr = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  const issuedAt = issuedAtStr ? new Date(Number(issuedAtStr)) : null;
  const expiresAt = expiresAtStr ? new Date(Number(expiresAtStr)) : null;
  const now = Date.now();
  const ageInDays = issuedAt ? (now - issuedAt.getTime()) / 86_400_000 : null;
  const daysUntilExpiry = expiresAt ? (expiresAt.getTime() - now) / 86_400_000 : null;
  return { token, issuedAt, expiresAt, ageInDays, daysUntilExpiry };
}

export function setThreadsToken(token: string, expiresInSec?: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  const now = Date.now();
  localStorage.setItem(TOKEN_ISSUED_AT_KEY, String(now));
  const lifetime = expiresInSec ? expiresInSec * 1000 : TOKEN_LIFETIME_MS;
  localStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(now + lifetime));
}

export function clearThreadsToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_ISSUED_AT_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
}

export class ThreadsAuthError extends Error {
  constructor() {
    super("Threads access token 이 설정되지 않았습니다. /settings 에서 토큰을 입력하세요.");
    this.name = "ThreadsAuthError";
  }
}

async function call<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = getThreadsToken();
  if (!token) throw new ThreadsAuthError();
  const url = new URL(API_BASE + path);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { "X-Threads-Token": token },
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response (${res.status})`);
  }
  if (!res.ok) {
    const msg = (json as { error?: string })?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

// ==================== Types ====================

export interface ThreadsUser {
  id: string;
  username: string;
  name?: string;
  threads_biography?: string;
  threads_profile_picture_url?: string;
}

export interface ThreadsPost {
  id: string;
  text?: string;
  username?: string;
  timestamp: string;
  permalink?: string;
  media_type?: "TEXT_POST" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "AUDIO";
  media_url?: string;
  thumbnail_url?: string;
  shortcode?: string;
  is_quote_post?: boolean;
  is_reply?: boolean;
  has_replies?: boolean;
  alt_text?: string;
  _keyword?: string;
}

export interface ThreadsListResponse<T> {
  data: T[];
  paging?: { cursors: { before: string; after: string }; next?: string };
}

export interface ThreadsInsightItem {
  name: string;
  period: string;
  values: { value: number; end_time?: string }[];
  title: string;
  description?: string;
  total_value?: { value: number };
}

export interface ThreadsInsightsResponse {
  data: ThreadsInsightItem[];
}

// ==================== API ====================

export async function getMyProfile() {
  const r = await call<{ profile: ThreadsUser }>("/api/threads/me");
  return r.profile;
}

export async function getMyThreads(limit = 25, since?: string) {
  const params: Record<string, string> = { limit: String(limit) };
  if (since) params.since = since;
  return call<ThreadsListResponse<ThreadsPost>>("/api/threads/me/threads", params);
}

export async function getMyInsights(since?: string, until?: string) {
  const params: Record<string, string> = {};
  if (since) params.since = since;
  if (until) params.until = until;
  return call<ThreadsInsightsResponse>("/api/threads/me/insights", params);
}

export async function getMyMentions(limit = 25) {
  return call<ThreadsListResponse<ThreadsPost>>("/api/threads/me/mentions", { limit: String(limit) });
}

export async function searchThreads(
  query: string,
  type: "TOP" | "RECENT" = "TOP",
  limit = 25,
) {
  return call<ThreadsListResponse<ThreadsPost> & { query: string; type: string }>(
    "/api/threads/search",
    { q: query, type, limit: String(limit) },
  );
}

export async function getTrending(opts: {
  preset?: string;
  keyword?: string;
  type?: "TOP" | "RECENT";
  perKeyword?: number;
}) {
  const params: Record<string, string> = {};
  if (opts.preset) params.preset = opts.preset;
  if (opts.keyword) params.keyword = opts.keyword;
  if (opts.type) params.type = opts.type;
  if (opts.perKeyword) params.perKeyword = String(opts.perKeyword);
  return call<{
    items: ThreadsPost[];
    keywords: string[];
    preset: string;
    type: string;
    fetchedAt: string;
    errors: string[];
  }>("/api/threads/trending", params);
}

export async function getThread(threadId: string) {
  return call<ThreadsPost>(`/api/threads/thread/${encodeURIComponent(threadId)}`);
}

export async function getThreadConversation(threadId: string, limit = 25) {
  return call<ThreadsListResponse<ThreadsPost>>(
    `/api/threads/thread/${encodeURIComponent(threadId)}/conversation`,
    { limit: String(limit) },
  );
}

export async function getThreadInsights(threadId: string) {
  return call<ThreadsInsightsResponse>(
    `/api/threads/thread/${encodeURIComponent(threadId)}/insights`,
  );
}

// 토큰 검증 (간단한 ping)
export async function validateToken(): Promise<{ valid: boolean; profile?: ThreadsUser; error?: string }> {
  try {
    const profile = await getMyProfile();
    return { valid: true, profile };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

// 토큰 수동 갱신 — 새 60일 토큰으로 교체
export async function refreshTokenNow(): Promise<{ ok: boolean; expiresAt?: Date; error?: string }> {
  const token = getThreadsToken();
  if (!token) return { ok: false, error: "no token" };
  try {
    const url = new URL(API_BASE + "/api/threads/refresh");
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "X-Threads-Token": token },
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: (json as { error?: string }).error || `HTTP ${res.status}` };
    const result = json as { access_token: string; expires_in: number; expires_at: string };
    setThreadsToken(result.access_token, result.expires_in);
    return { ok: true, expiresAt: new Date(result.expires_at) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// 자동 갱신 — 50일 이상 지났으면 백그라운드 갱신. 앱 진입 시 호출.
let refreshInProgress = false;
export async function maybeRefresh(): Promise<{ refreshed: boolean; reason?: string }> {
  if (refreshInProgress) return { refreshed: false, reason: "in progress" };
  const info = getTokenInfo();
  if (!info.token) return { refreshed: false, reason: "no token" };
  if (info.ageInDays === null) {
    // 발급일 정보 없음 (이전 버전 토큰) → 백필. 갱신은 아직 안 함.
    setThreadsToken(info.token);
    return { refreshed: false, reason: "back-filled issuedAt" };
  }
  if (info.ageInDays < REFRESH_THRESHOLD_DAYS) {
    return { refreshed: false, reason: `${info.ageInDays.toFixed(1)}d old, no refresh needed` };
  }
  refreshInProgress = true;
  try {
    const r = await refreshTokenNow();
    return { refreshed: r.ok, reason: r.ok ? `refreshed (new exp ${r.expiresAt?.toISOString()})` : `failed: ${r.error}` };
  } finally {
    refreshInProgress = false;
  }
}
