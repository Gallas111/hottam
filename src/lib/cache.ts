import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), ".cache");

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCachePath(key: string): string {
  // Sanitize key for filename
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 200);
  return join(CACHE_DIR, `${safe}.json`);
}

export function getCached<T>(key: string): T | null {
  try {
    const path = getCachePath(key);
    if (!existsSync(path)) return null;

    const raw = readFileSync(path, "utf-8");
    const entry: CacheEntry<T> = JSON.parse(raw);

    if (Date.now() > entry.expiresAt) {
      return null; // Expired
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  try {
    ensureCacheDir();
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
    };
    writeFileSync(getCachePath(key), JSON.stringify(entry));
  } catch {
    // Cache write failed, ignore
  }
}

// Pre-defined TTLs
export const TTL = {
  TRENDING: 60 * 60,       // 1시간
  SEARCH: 2 * 60 * 60,     // 2시간
  CHANNEL: 6 * 60 * 60,    // 6시간
  CATEGORIES: 24 * 60 * 60, // 24시간
  VIDEO: 2 * 60 * 60,      // 2시간
};
