"use client"

import { createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import { type Locale, LOCALE_COOKIE } from "@/lib/locale"

type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

// Locale is resolved server-side per request (see i18n/request.ts), so the
// initial value always comes from the server-rendered messages via
// NextIntlClientProvider's locale — this provider only needs to mirror it
// for the switcher UI and trigger a server refresh on change.
export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = (next: Locale) => {
    setLocaleState(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.refresh()
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider")
  return ctx
}
