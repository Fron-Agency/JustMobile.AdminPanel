export const PLATFORMS = ["justmobile", "justcompare", "optimusmarketing"] as const

export type Platform = (typeof PLATFORMS)[number]

export const PLATFORM_LABELS: Record<Platform, string> = {
  justmobile: "JustMobile",
  justcompare: "JustCompare",
  optimusmarketing: "OptimusMarketing",
}

export const PLATFORM_COOKIE = "jm_platform"

export function isPlatform(value: string | undefined | null): value is Platform {
  return !!value && (PLATFORMS as readonly string[]).includes(value)
}
