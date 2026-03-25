import Link from "next/link";
import { TrendingUp, Search, BarChart3, Hash } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";

export default function InstagramPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <InstagramIcon className="h-7 w-7 text-pink-500" />
          인스타그램 분석
        </h1>
        <p className="mt-1 text-muted-foreground">
          계정, 게시물, 해시태그를 분석하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/instagram/trending"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-pink-300 hover:shadow-md"
        >
          <TrendingUp className="h-8 w-8 text-pink-500" />
          <h2 className="mt-3 text-lg font-semibold">트렌딩</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            인기 게시물과 트렌드를 확인하세요
          </p>
        </Link>

        <Link
          href="/instagram/account"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-pink-300 hover:shadow-md"
        >
          <BarChart3 className="h-8 w-8 text-pink-500" />
          <h2 className="mt-3 text-lg font-semibold">계정 분석</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            팔로워, 인게이지먼트, 성장 추이를 분석하세요
          </p>
        </Link>

        <Link
          href="/instagram/hashtags"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-pink-300 hover:shadow-md"
        >
          <Hash className="h-8 w-8 text-pink-500" />
          <h2 className="mt-3 text-lg font-semibold">해시태그 리서치</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            인기 해시태그를 검색하고 관련 게시물을 분석하세요
          </p>
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <h3 className="font-semibold text-amber-800 dark:text-amber-400">
          Instagram API 설정 필요
        </h3>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          인스타그램 분석을 사용하려면 Meta Developer App을 설정하고 Instagram
          Graph API 액세스 토큰이 필요합니다.
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
