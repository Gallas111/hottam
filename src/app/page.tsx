import Link from "next/link";
import {
  Flame,
  TrendingUp,
  Search,
  BarChart3,
  Users,
  Zap,
} from "lucide-react";
import { YoutubeIcon, InstagramIcon } from "@/components/ui/icons";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-accent" />
            <span className="text-xl font-bold">핫탐</span>
          </div>
          <Link
            href="/youtube"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            대시보드
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              소셜 미디어 트렌드를
              <br />
              <span className="text-primary">한눈에 분석</span>하세요
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              유튜브, 인스타그램, 쓰레드의 실시간 트렌드를 추적하고
              <br />
              경쟁사를 분석하고, 다음 콘텐츠 주제를 발굴하세요.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/youtube"
                className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
              >
                무료로 시작하기
              </Link>
              <Link
                href="#features"
                className="rounded-lg border border-border px-6 py-3 font-medium text-foreground hover:bg-secondary"
              >
                기능 살펴보기
              </Link>
            </div>
          </div>
        </section>

        {/* Platform Cards */}
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/youtube"
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-red-300 hover:shadow-lg"
            >
              <YoutubeIcon className="h-10 w-10 text-red-500" />
              <h3 className="mt-4 text-lg font-semibold">유튜브 분석</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                채널 성장 추이, 영상 성과, 키워드 리서치, 트렌딩 분석
              </p>
            </Link>
            <Link
              href="/instagram"
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-pink-300 hover:shadow-lg"
            >
              <InstagramIcon className="h-10 w-10 text-pink-500" />
              <h3 className="mt-4 text-lg font-semibold">인스타그램 분석</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                계정 성과, 해시태그 리서치, 인기 게시물 트렌드
              </p>
            </Link>
            <Link
              href="/threads"
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-purple-300 hover:shadow-lg"
            >
              <svg
                className="h-10 w-10 text-foreground"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.26 1.33-3.02.88-.725 2.107-1.132 3.555-1.18 1.036-.034 1.987.07 2.862.308-.06-.593-.222-1.087-.483-1.486-.377-.576-1-1.025-1.843-1.197-.784-.16-1.987-.056-2.796.222l-.67-1.89c1.094-.378 2.782-.56 4.005-.312 1.27.258 2.224.91 2.836 1.843.554.844.86 1.878.924 3.088.39.12.764.265 1.12.437 1.083.522 1.943 1.357 2.489 2.41.826 1.592.904 4.24-1.164 6.276-1.801 1.775-4.026 2.529-7.205 2.552ZM14.74 14.28c-.04-.545-.334-2.026-2.949-1.94-1.076.034-1.888.283-2.418.744-.495.43-.718 1.006-.685 1.672.047.867.726 1.828 2.692 1.72 1.476-.08 2.51-.735 3.074-1.946.133-.27.227-.556.286-.85v.6Z" />
              </svg>
              <h3 className="mt-4 text-lg font-semibold">쓰레드 분석</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                게시물 인게이지먼트, 팔로워 추이, 인기 콘텐츠
              </p>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border bg-secondary/50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-bold">주요 기능</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: TrendingUp,
                  title: "실시간 트렌딩",
                  desc: "3개 플랫폼의 인기 콘텐츠를 실시간으로 추적",
                },
                {
                  icon: Search,
                  title: "주제 발굴",
                  desc: "트렌드 기반 블로그/콘텐츠 주제 자동 추천",
                },
                {
                  icon: BarChart3,
                  title: "성과 분석",
                  desc: "조회수, 인게이지먼트, 성장률 심층 분석",
                },
                {
                  icon: Users,
                  title: "경쟁사 비교",
                  desc: "경쟁 채널/계정과 나란히 비교 분석",
                },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <Zap className="mx-auto h-10 w-10 text-accent" />
            <h2 className="mt-4 text-2xl font-bold">지금 바로 시작하세요</h2>
            <p className="mt-2 text-muted-foreground">
              무료로 유튜브, 인스타그램, 쓰레드 트렌드를 분석해보세요.
            </p>
            <Link
              href="/youtube"
              className="mt-6 inline-block rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground hover:opacity-90"
            >
              시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 핫탐. All rights reserved.</p>
      </footer>
    </div>
  );
}
