"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2, ExternalLink, Heart, MessageCircle, Repeat2, Quote, Eye, ArrowLeft } from "lucide-react";
import { getBookmarks, removeBookmark, updateNote, type BookmarkEntry } from "@/lib/threads-bookmarks";

export default function ThreadsBookmarksPage() {
  const [list, setList] = useState<BookmarkEntry[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setList(getBookmarks());
  }, []);

  function handleRemove(id: string) {
    removeBookmark(id);
    setList(getBookmarks());
  }

  function startEdit(b: BookmarkEntry) {
    setEditing(b.post.id);
    setDraft(b.note);
  }

  function saveEdit(id: string) {
    updateNote(id, draft);
    setEditing(null);
    setList(getBookmarks());
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/threads/trending" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          트렌딩으로
        </Link>
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Bookmark className="h-7 w-7 text-purple-500" />
          북마크
        </h1>
        <p className="mt-1 text-muted-foreground">
          참고용 게시물 모음 (브라우저 localStorage, 서버 저장 0)
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          아직 북마크한 게시물이 없습니다. <Link href="/threads/trending" className="font-medium text-purple-600 underline">트렌딩에서 북마크하기</Link>
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-muted-foreground">{list.length}개 북마크</div>
          <div className="space-y-4">
            {list.map((b) => {
              const p = b.post;
              const m = b.metrics;
              return (
                <article key={p.id} className="rounded-xl border border-border bg-card p-4">
                  <header className="mb-2 flex items-center gap-2 text-sm">
                    {p.username && <span className="font-medium">@{p.username}</span>}
                    {p._keyword && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {p._keyword}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      북마크: {new Date(b.bookmarkedAt).toLocaleDateString("ko-KR")}
                    </span>
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="rounded p-1 text-muted-foreground hover:text-red-600"
                      title="북마크 해제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </header>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.text}</p>

                  {m && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
                        <Heart className="h-3.5 w-3.5" />{m.like_count.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
                        <MessageCircle className="h-3.5 w-3.5" />{m.reply_count.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Repeat2 className="h-3.5 w-3.5" />{m.repost_count.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <Quote className="h-3.5 w-3.5" />{m.quote_count.toLocaleString()}
                      </span>
                      {m.view_count > 0 && (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3.5 w-3.5" />{m.view_count.toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 rounded-lg border border-border bg-background p-2">
                    {editing === p.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={3}
                          className="w-full resize-none rounded border border-border bg-card px-2 py-1 text-sm"
                          placeholder="이 게시물 어떻게 참고할지 메모..."
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(p.id)} className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700">저장</button>
                          <button onClick={() => setEditing(null)} className="rounded border border-border px-3 py-1 text-xs">취소</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(b)} className="block w-full text-left text-xs text-muted-foreground hover:text-foreground">
                        {b.note ? <span className="whitespace-pre-wrap">📝 {b.note}</span> : <span className="italic">메모 추가...</span>}
                      </button>
                    )}
                  </div>

                  <footer className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {p.permalink && (
                      <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Threads에서 보기
                      </a>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
