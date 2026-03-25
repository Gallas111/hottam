import Link from "next/link";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function ThreadsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.26 1.33-3.02.88-.725 2.107-1.132 3.555-1.18 1.036-.034 1.987.07 2.862.308-.06-.593-.222-1.087-.483-1.486-.377-.576-1-1.025-1.843-1.197-.784-.16-1.987-.056-2.796.222l-.67-1.89c1.094-.378 2.782-.56 4.005-.312 1.27.258 2.224.91 2.836 1.843.554.844.86 1.878.924 3.088.39.12.764.265 1.12.437 1.083.522 1.943 1.357 2.489 2.41.826 1.592.904 4.24-1.164 6.276-1.801 1.775-4.026 2.529-7.205 2.552ZM14.74 14.28c-.04-.545-.334-2.026-2.949-1.94-1.076.034-1.888.283-2.418.744-.495.43-.718 1.006-.685 1.672.047.867.726 1.828 2.692 1.72 1.476-.08 2.51-.735 3.074-1.946.133-.27.227-.556.286-.85v.6Z" />
          </svg>
          쓰레드 분석
        </h1>
        <p className="mt-1 text-muted-foreground">
          게시물, 인게이지먼트, 트렌드를 분석하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/threads/trending"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-purple-300 hover:shadow-md"
        >
          <TrendingUp className="h-8 w-8 text-purple-500" />
          <h2 className="mt-3 text-lg font-semibold">트렌딩</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            인기 쓰레드와 트렌드를 확인하세요
          </p>
        </Link>

        <Link
          href="/threads/account"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-purple-300 hover:shadow-md"
        >
          <BarChart3 className="h-8 w-8 text-purple-500" />
          <h2 className="mt-3 text-lg font-semibold">계정 분석</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            팔로워, 게시물 성과를 분석하세요
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <h3 className="font-semibold text-amber-800 dark:text-amber-400">
          Threads API 설정 필요
        </h3>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          쓰레드 분석을 사용하려면 Meta Developer App을 설정하고 Threads API
          액세스 토큰이 필요합니다.
        </p>
        <a
          href="https://developers.facebook.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-400"
        >
          Meta Developer Console 바로가기
        </a>
      </div>
    </div>
  );
}
