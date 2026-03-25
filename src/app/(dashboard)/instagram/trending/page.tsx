import { TrendingUp } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";

export default function InstagramTrendingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <TrendingUp className="h-7 w-7 text-pink-500" />
          인스타그램 트렌딩
        </h1>
        <p className="mt-1 text-muted-foreground">
          인기 게시물과 릴스를 확인하세요
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <InstagramIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          Instagram API를 설정하면 트렌딩 데이터가 표시됩니다
        </p>
      </div>
    </div>
  );
}
