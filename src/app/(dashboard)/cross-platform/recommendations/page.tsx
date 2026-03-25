import { Sparkles } from "lucide-react";

export default function RecommendationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Sparkles className="h-7 w-7 text-accent" />
          주제 추천
        </h1>
        <p className="mt-1 text-muted-foreground">
          트렌드 기반 블로그/콘텐츠 주제를 추천받으세요
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          트렌딩 데이터가 수집되면 블로그에 적합한 주제를 자동으로 추천합니다
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          각 플랫폼의 API를 설정하고 트렌딩 페이지를 먼저 확인해보세요
        </p>
      </div>
    </div>
  );
}
