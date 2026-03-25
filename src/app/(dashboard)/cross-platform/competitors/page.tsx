import Link from "next/link";
import { Users, Trophy } from "lucide-react";

export default function CompetitorsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Users className="h-7 w-7 text-primary" />
          경쟁사 비교
        </h1>
        <p className="mt-1 text-muted-foreground">
          경쟁 채널/계정을 나란히 비교 분석하세요
        </p>
      </div>

      <div className="mb-6">
        <Link
          href="/youtube/channel/compare"
          className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-5 py-3 text-sm font-medium text-white hover:bg-red-600 transition-colors"
        >
          <Trophy className="h-4 w-4" />
          유튜브 채널 비교하기
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          채널과 계정을 추적하면 경쟁사 비교 데이터가 여기에 표시됩니다
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          유튜브 채널 분석에서 채널을 검색하고 추적을 시작하세요
        </p>
      </div>
    </div>
  );
}
