import { Hash } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";

export default function InstagramHashtagsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Hash className="h-7 w-7 text-pink-500" />
          해시태그 리서치
        </h1>
        <p className="mt-1 text-muted-foreground">
          인기 해시태그를 검색하고 관련 게시물을 분석하세요
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <InstagramIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          Instagram API를 설정하면 해시태그 리서치 기능을 사용할 수 있습니다
        </p>
      </div>
    </div>
  );
}
