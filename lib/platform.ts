export const PLATFORMS = ["justmobile", "justcompare"] as const

export type Platform = (typeof PLATFORMS)[number]

export const PLATFORM_LABELS: Record<Platform, string> = {
  justmobile: "JustMobile",
  justcompare: "JustCompare",
}

export const PLATFORM_COOKIE = "jm_platform"

export function isPlatform(value: string | undefined | null): value is Platform {
  return !!value && (PLATFORMS as readonly string[]).includes(value)
}
