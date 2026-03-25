import { BarChart3 } from "lucide-react";
import { InstagramIcon } from "@/components/ui/icons";

export default function InstagramAccountPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <BarChart3 className="h-7 w-7 text-pink-500" />
          인스타그램 계정 분석
        </h1>
        <p className="mt-1 text-muted-foreground">
          계정의 팔로워, 인게이지먼트를 분석하세요
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <InstagramIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-muted-foreground">
          Instagram API를 설정하면 계정 분석 기능을 사용할 수 있습니다
        </p>
      </div>
    </div>
  );
}
