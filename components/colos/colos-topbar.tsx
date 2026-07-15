"use client"

import { useRouter } from "next/navigation"
import { Building2, LogOut, Languages, Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/components/providers/language-provider"
import { LOCALES, LOCALE_LABELS } from "@/lib/locale"

export default function ColosTopbar() {
  const router = useRouter()
  const t = useTranslations("ColosTopbar")
  const tTopbar = useTranslations("Topbar")
  const { locale, setLocale } = useLanguage()

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
        <span className="text-lg font-semibold text-foreground">{t("title")}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title={tTopbar("language")}
            >
              <Languages className="w-5 h-5" />
              <span className="sr-only">{tTopbar("language")}</span>
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

        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4 mr-2" />
          {t("logOut")}
        </Button>
      </div>
    </header>
  )
}
