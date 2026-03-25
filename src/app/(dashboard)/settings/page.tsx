"use client";

import { Settings, Key } from "lucide-react";
import { YoutubeIcon, InstagramIcon, ThreadsIcon } from "@/components/ui/icons";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <Settings className="h-7 w-7 text-muted-foreground" />
          설정
        </h1>
        <p className="mt-1 text-muted-foreground">
          API 키와 연결 계정을 관리하세요
        </p>
      </div>

      <div className="space-y-6">
        {/* YouTube API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <YoutubeIcon className="h-5 w-5 text-red-500" />
              <CardTitle>YouTube Data API</CardTitle>
            </div>
            <CardDescription>
              Google Cloud Console에서 YouTube Data API v3 키를 발급받으세요
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">API Key</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="password"
                  placeholder="AIza..."
                  disabled
                  className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                />
                <span className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  .env 파일에서 설정
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              YOUTUBE_API_KEY 환경변수를 .env 파일에 추가하세요. 일일 무료 할당량: 10,000 유닛
            </p>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Key className="h-3.5 w-3.5" />
              Google Cloud Console에서 키 발급
            </a>
          </div>
        </Card>

        {/* Instagram API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <InstagramIcon className="h-5 w-5 text-pink-500" />
              <CardTitle>Instagram Graph API</CardTitle>
            </div>
            <CardDescription>
              Meta Developer Console에서 Instagram Graph API를 설정하세요
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              INSTAGRAM_ACCESS_TOKEN 환경변수를 .env 파일에 추가하세요.
              비즈니스/크리에이터 계정이 필요합니다.
            </p>
            <a
              href="https://developers.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Key className="h-3.5 w-3.5" />
              Meta Developer Console
            </a>
          </div>
        </Card>

        {/* Threads API */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ThreadsIcon className="h-5 w-5" />
              <CardTitle>Threads API</CardTitle>
            </div>
            <CardDescription>
              Instagram과 같은 Meta Developer App에서 설정하세요
            </CardDescription>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              THREADS_ACCESS_TOKEN 환경변수를 .env 파일에 추가하세요.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
