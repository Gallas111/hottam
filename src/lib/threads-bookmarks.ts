// Threads 게시물 북마크/메모 — localStorage. 서버 전송 0.

import type { ThreadsPost, PostMetrics } from "./api/threads";

const KEY = "hottam_threads_bookmarks_v1";

export interface BookmarkEntry {
  post: ThreadsPost;
  metrics?: PostMetrics;
  note: string;
  bookmarkedAt: number;  // ms epoch
}

export function getBookmarks(): BookmarkEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isBookmarked(postId: string): boolean {
  return getBookmarks().some((b) => b.post.id === postId);
}

export function addBookmark(post: ThreadsPost, note = "", metrics?: PostMetrics): void {
  if (typeof window === "undefined") return;
  const list = getBookmarks();
  if (list.some((b) => b.post.id === post.id)) return;
  list.unshift({ post, metrics, note, bookmarkedAt: Date.now() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
}

export function removeBookmark(postId: string): void {
  if (typeof window === "undefined") return;
  const list = getBookmarks().filter((b) => b.post.id !== postId);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function updateNote(postId: string, note: string): void {
  if (typeof window === "undefined") return;
  const list = getBookmarks();
  const idx = list.findIndex((b) => b.post.id === postId);
  if (idx < 0) return;
  list[idx].note = note;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function toggleBookmark(post: ThreadsPost, metrics?: PostMetrics): boolean {
  if (isBookmarked(post.id)) {
    removeBookmark(post.id);
    return false;
  }
  addBookmark(post, "", metrics);
  return true;
}
