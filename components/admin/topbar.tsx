"use client"

import { usePathname, useRouter } from "next/navigation"
import { Bell, LogOut, Menu, Languages, Check } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/admin/sidebar"
import { useLanguage } from "@/components/providers/language-provider"
import { LOCALES, LOCALE_LABELS } from "@/lib/locale"

const pageTitleKeys: Record<string, string> = {
  "/dashboard": "dashboard",
  "/dashboard/leads": "leads",
  "/dashboard/plans_mobile": "plans",
  "/dashboard/plans_home": "plans",
  "/dashboard/providers": "providers",
  "/dashboard/categories": "categories",
  "/dashboard/partners": "partners",
  "/dashboard/users": "users",
  "/dashboard/settings": "settings",
}

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("Topbar")
  const tSidebar = useTranslations("Sidebar")
  const { locale, setLocale } = useLanguage()
  const titleKey = pageTitleKeys[pathname]
  const title = titleKey ? t(titleKey) : "Admin"
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <header className="h-16 flex items-center justify-between gap-2 px-3 sm:px-6 bg-card border-b border-border">
      <div className="flex items-center gap-2 min-w-0">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={() => setIsMenuOpen(true)}
            aria-label={tSidebar("openMenu")}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <SheetContent side="left" className="w-72 p-0 gap-0">
            <SheetTitle className="sr-only">{tSidebar("navigation")}</SheetTitle>
            <SheetDescription className="sr-only">{t("subtitle")}</SheetDescription>
            <SidebarContent onNavigate={() => setIsMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
          <p className="hidden sm:block text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title={t("language")}
            >
              <Languages className="w-5 h-5" />
              <span className="sr-only">{t("language")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {LOCALES.map((l) => (
              <DropdownMenuItem
                key={l}
                className="cursor-pointer justify-between"
                onClick={() => setLocale(l)}
              >
                {LOCALE_LABELS[l]}
                {l === locale && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  AU
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium text-foreground">{t("adminUser")}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
