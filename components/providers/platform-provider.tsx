"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { type Platform, PLATFORM_COOKIE, isPlatform } from "@/lib/platform"

type PlatformContextValue = {
  platform: Platform
  setPlatform: (platform: Platform) => void
}

const PlatformContext = createContext<PlatformContextValue | null>(null)

function readCookiePlatform(): Platform | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${PLATFORM_COOKIE}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1]) : null
  return isPlatform(value) ? value : null
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [platform, setPlatformState] = useState<Platform>("justmobile")

  useEffect(() => {
    const stored = readCookiePlatform()
    if (stored) setPlatformState(stored)
  }, [])

  const setPlatform = (next: Platform) => {
    setPlatformState(next)
    document.cookie = `${PLATFORM_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.push("/dashboard")
  }

  return (
    <PlatformContext.Provider value={{ platform, setPlatform }}>
      {children}
    </PlatformContext.Provider>
  )
}

export function usePlatform() {
  const ctx = useContext(PlatformContext)
  if (!ctx) throw new Error("usePlatform must be used within a PlatformProvider")
  return ctx
}
