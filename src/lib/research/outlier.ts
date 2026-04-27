import { getChannel, getChannelVideos, getVideos, searchVideos } from "@/lib/api/youtube";

export interface OutlierVideo {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  durationSeconds: number;
  isShort: boolean;
  thumbnail: string;
  channelSubscribers: number;
  channelAvgViews: number;
  channelVideoCount: number;
  outlierScore: number;
  viewsPerDay: number;
  daysSinceUpload: number;
  opportunityScore: number;
  keyword: string;
}

export interface RisingChannel {
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  subscribers: number;
  videoCount: number;
  totalViews: number;
  avgViews: number;
  recentTopVideoId: string;
  recentTopVideoTitle: string;
  recentTopViews: number;
  recentTopOutlier: number;
  channelAgeDays: number | null;
  isNewChannel: boolean;
  risingScore: number;
}

const ISO8601_DURATION = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;

export function parseDurationSeconds(iso: string): number {
  const match = ISO8601_DURATION.exec(iso || "");
  if (!match) return 0;
  const h = parseInt(match[1] || "0", 10);
  const m = parseInt(match[2] || "0", 10);
  const s = parseInt(match[3] || "0", 10);
  return h * 3600 + m * 60 + s;
}

function safeNumber(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0;
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : 0;
}

function daysBetween(iso: string, now = Date.now()): number {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((now - t) / (24 * 3600 * 1000)));
}

export interface OutlierOptions {
  keyword: string;
  maxResults?: number;          // 검색 결과 수 (기본 20)
  shortsOnly?: boolean;         // 60초 이하만
  minOutlier?: number;          // 최소 아웃라이어 배율 (기본 3)
  maxDays?: number;             // 최대 며칠 이내 업로드 (기본 30)
}

/**
 * 키워드로 검색 → 채널별 평균과 비교 → 아웃라이어 점수 계산.
 *
 * Quota: search.list 100 + videos.list 1 + (채널 N개) channels.list 1 + channelVideos N개
 * 한 키워드당 약 100 + 1 + N(uploads) ≈ 5~10개 채널 모니터링이면 ~150 units.
 */
export async function findOutliersForKeyword(
  opts: OutlierOptions
): Promise<OutlierVideo[]> {
  const { keyword, maxResults = 20, shortsOnly = false, minOutlier = 3, maxDays = 30 } = opts;

  // 1. 키워드 검색 (조회수 순)
  const search = await searchVideos(keyword, maxResults, "viewCount");
  const videoIds = search.items.map((it) => it.id.videoId).filter(Boolean);
  if (videoIds.length === 0) return [];

  // 2. 영상 상세 일괄 조회
  const videos = await getVideos(videoIds);

  // 3. 영상 → 채널 매핑
  const byChannel = new Map<string, typeof videos.items>();
  for (const v of videos.items) {
    const cid = v.snippet.channelId;
    if (!byChannel.has(cid)) byChannel.set(cid, []);
    byChannel.get(cid)!.push(v);
  }

  const results: OutlierVideo[] = [];
  const now = Date.now();

  // 4. 채널별 평균 조회수 계산 + 아웃라이어 산출
  for (const [channelId, vids] of byChannel.entries()) {
    let channelAvg = 0;
    let subs = 0;
    let videoCount = 0;
    try {
      const ch = await getChannel(channelId);
      const stats = ch.items[0]?.statistics;
      const totalViews = safeNumber(stats?.viewCount);
      videoCount = safeNumber(stats?.videoCount);
      subs = safeNumber(stats?.subscriberCount);
      channelAvg = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
    } catch {
      continue;
    }
    if (channelAvg === 0) continue;

    for (const v of vids) {
      const views = safeNumber(v.statistics.viewCount);
      const days = daysBetween(v.snippet.publishedAt, now);
      if (maxDays > 0 && days > maxDays) continue;

      const durSec = parseDurationSeconds(v.contentDetails?.duration || "");
      const isShort = durSec > 0 && durSec <= 60;
      if (shortsOnly && !isShort) continue;

      const outlier = views / channelAvg;
      if (outlier < minOutlier) continue;

      const viewsPerDay = days > 0 ? Math.round(views / days) : views;
      const recencyScore = Math.max(0, 1 - days / 30); // 0~1
      const opportunity =
        outlier * 0.5 +
        (viewsPerDay / 10000) * 0.3 +
        recencyScore * 5 * 0.2;

      results.push({
        videoId: v.id,
        title: v.snippet.title,
        channelId,
        channelTitle: v.snippet.channelTitle,
        publishedAt: v.snippet.publishedAt,
        viewCount: views,
        likeCount: safeNumber(v.statistics.likeCount),
        commentCount: safeNumber(v.statistics.commentCount),
        duration: v.contentDetails?.duration || "",
        durationSeconds: durSec,
        isShort,
        thumbnail: v.snippet.thumbnails.high?.url || v.snippet.thumbnails.medium?.url || "",
        channelSubscribers: subs,
        channelAvgViews: channelAvg,
        channelVideoCount: videoCount,
        outlierScore: Number(outlier.toFixed(2)),
        viewsPerDay,
        daysSinceUpload: days,
        opportunityScore: Number(opportunity.toFixed(2)),
        keyword,
      });
    }
  }

  results.sort((a, b) => b.opportunityScore - a.opportunityScore);
  return results;
}

export interface RisingOptions {
  keyword: string;
  maxResults?: number;
  maxSubscribers?: number;     // 신생/소형 채널 기준 (기본 50,000)
  minOutlier?: number;         // 최소 아웃라이어 (기본 5)
  maxDays?: number;            // 영상 업로드 최근일 (기본 30)
}

/**
 * 신생/소형 채널 중 갑자기 터진 영상이 있는 채널 발굴.
 */
export async function findRisingChannels(
  opts: RisingOptions
): Promise<RisingChannel[]> {
  const { keyword, maxResults = 30, maxSubscribers = 50000, minOutlier = 5, maxDays = 30 } = opts;

  const outliers = await findOutliersForKeyword({
    keyword,
    maxResults,
    minOutlier,
    maxDays,
  });

  const seen = new Set<string>();
  const results: RisingChannel[] = [];
  const now = Date.now();

  for (const v of outliers) {
    if (seen.has(v.channelId)) continue;
    if (v.channelSubscribers > maxSubscribers) continue;
    seen.add(v.channelId);

    let channelAge: number | null = null;
    let thumbnail = "";
    try {
      const ch = await getChannel(v.channelId);
      const item = ch.items[0];
      if (item) {
        thumbnail = item.snippet.thumbnails.high?.url || "";
        // YouTube channels API does not expose publishedAt in basic snippet,
        // so we approximate with first uploads date later if needed.
      }
    } catch {
      continue;
    }

    const totalViews = v.channelAvgViews * v.channelVideoCount;
    // 신생 가중치: 구독자 적고 + 아웃라이어 큼
    const subPenalty = Math.max(0.2, 1 - v.channelSubscribers / maxSubscribers);
    const risingScore = Number(
      (v.outlierScore * subPenalty + (v.viewsPerDay / 5000) * 0.5).toFixed(2)
    );

    results.push({
      channelId: v.channelId,
      channelTitle: v.channelTitle,
      thumbnail,
      subscribers: v.channelSubscribers,
      videoCount: v.channelVideoCount,
      totalViews,
      avgViews: v.channelAvgViews,
      recentTopVideoId: v.videoId,
      recentTopVideoTitle: v.title,
      recentTopViews: v.viewCount,
      recentTopOutlier: v.outlierScore,
      channelAgeDays: channelAge,
      isNewChannel: v.channelVideoCount <= 30,
      risingScore,
    });
  }

  results.sort((a, b) => b.risingScore - a.risingScore);
  return results;
}
