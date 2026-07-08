"use client"

import { useRouter } from "next/navigation"
import { Building2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ColosTopbar() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/colos/logout", { method: "POST" })
    router.push("/login/colos")
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-foreground">Colos Admin</span>
      </div>

      <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
        <LogOut className="w-4 h-4 mr-2" />
        Log out
      </Button>
    </header>
  )
}
