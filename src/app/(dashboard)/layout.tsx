import { Sidebar } from "@/components/dashboard/sidebar";
import { ThreadsTokenRefresh } from "@/components/dashboard/threads-token-refresh";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ThreadsTokenRefresh />
      <Sidebar />
      <main className="lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-6 sm:px-6 lg:px-8 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
