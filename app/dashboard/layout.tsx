import Sidebar from "@/components/admin/sidebar"
import Topbar from "@/components/admin/topbar"
import { PlatformProvider } from "@/components/providers/platform-provider"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </PlatformProvider>
  )
}
