import Link from "next/link";
import { TrendingUp, Search, BarChart3, FileText } from "lucide-react";
import { YoutubeIcon } from "@/components/ui/icons";

export default function YouTubePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <YoutubeIcon className="h-7 w-7 text-red-500" />
          유튜브 분석
        </h1>
        <p className="mt-1 text-muted-foreground">
          채널, 영상, 트렌드를 분석하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/youtube/trending"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-red-300 hover:shadow-md"
        >
          <TrendingUp className="h-8 w-8 text-red-500" />
          <h2 className="mt-3 text-lg font-semibold">트렌딩 영상</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            한국에서 지금 뜨고 있는 영상을 실시간으로 확인하세요
          </p>
        </Link>

        <Link
          href="/youtube/channel"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-red-300 hover:shadow-md"
        >
          <BarChart3 className="h-8 w-8 text-red-500" />
          <h2 className="mt-3 text-lg font-semibold">채널 분석</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            채널의 구독자, 조회수, 성장 추이를 분석하세요
          </p>
        </Link>

        <Link
          href="/youtube/video"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-red-300 hover:shadow-md"
        >
          <FileText className="h-8 w-8 text-red-500" />
          <h2 className="mt-3 text-lg font-semibold">영상 분석</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            개별 영상의 조회수, 참여율, SEO를 상세 분석하세요
          </p>
        </Link>

        <Link
          href="/youtube/keywords"
          className="rounded-xl border border-border bg-card p-6 transition-all hover:border-red-300 hover:shadow-md"
        >
          <Search className="h-8 w-8 text-red-500" />
          <h2 className="mt-3 text-lg font-semibold">키워드 리서치</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            인기 키워드를 검색하고 관련 영상을 분석하세요
          </p>
        </Link>
      </div>
    </div>
  );
}
