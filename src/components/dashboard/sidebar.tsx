"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Flame,
  TrendingUp,
  Users,
  Settings,
  Search,
  Menu,
  X,
} from "lucide-react";
import { YoutubeIcon, InstagramIcon, ThreadsIcon } from "@/components/ui/icons";
import { useState } from "react";

const navItems = [
  {
    label: "유튜브",
    icon: YoutubeIcon,
    href: "/youtube",
    color: "text-red-500",
    children: [
      { label: "트렌딩", href: "/youtube/trending" },
      { label: "🔥 아웃라이어", href: "/youtube/outliers" },
      { label: "🚀 라이징 채널", href: "/youtube/rising" },
      { label: "✨ 재창작 변환기", href: "/youtube/remake" },
      { label: "채널 분석", href: "/youtube/channel" },
      { label: "키워드 리서치", href: "/youtube/keywords" },
      { label: "영상 분석", href: "/youtube/video" },
      { label: "제목 최적화", href: "/youtube/title-optimizer" },
      { label: "자동 생성", href: "/youtube/generator" },
      { label: "인사이트", href: "/youtube/insights" },
    ],
  },
  {
    label: "인스타그램",
    icon: InstagramIcon,
    href: "/instagram",
    color: "text-pink-500",
    children: [
      { label: "트렌딩", href: "/instagram/trending" },
      { label: "계정 분석", href: "/instagram/account" },
      { label: "해시태그", href: "/instagram/hashtags" },
    ],
  },
  {
    label: "쓰레드",
    icon: ThreadsIcon,
    href: "/threads",
    color: "text-foreground",
    children: [
      { label: "트렌딩", href: "/threads/trending" },
      { label: "계정 분석", href: "/threads/account" },
    ],
  },
  {
    label: "크로스 플랫폼",
    icon: TrendingUp,
    href: "/cross-platform/trending",
    color: "text-primary",
    children: [
      { label: "통합 트렌딩", href: "/cross-platform/trending" },
      { label: "경쟁사 비교", href: "/cross-platform/competitors" },
      { label: "주제 추천", href: "/cross-platform/recommendations" },
    ],
  },
];

const bottomItems = [
  { label: "설정", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-sidebar p-2 text-sidebar-foreground lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-accent" />
            <span className="text-lg font-bold">핫탐</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="채널, 계정 검색..."
              className="w-full bg-transparent text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-active text-white"
                      : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className={clsx("h-5 w-5", isActive ? "text-white" : item.color)} />
                  {item.label}
                </Link>
                {isActive && item.children && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={clsx(
                          "block rounded-md px-3 py-1.5 text-xs transition-colors",
                          pathname === child.href
                            ? "bg-white/10 text-white"
                            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-white/10 px-3 py-3">
          {bottomItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
