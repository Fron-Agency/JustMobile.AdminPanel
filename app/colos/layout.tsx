import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ColosAuthService } from "@/app/api/modules/colos/colos-auth.service"
import { COLOS_SESSION_COOKIE } from "@/utils/colos/require-auth"
import ColosTopbar from "@/components/colos/colos-topbar"
import ColosSidebar from "@/components/colos/colos-sidebar"

export default async function ColosLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COLOS_SESSION_COOKIE)?.value
  const user = token ? await ColosAuthService.getUserByToken(token) : null

  if (!user) {
    redirect("/login/colos")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ColosSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ColosTopbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
