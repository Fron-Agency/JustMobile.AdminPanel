import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"
import { PLATFORM_COOKIE, type Platform } from "@/lib/platform"

// ---------------------------------------------------------------------------
// Hostname -> tenant landing page routing
//
// One Next.js app is deployed once on Vercel and served from several custom
// domains. Each domain has its own "/login" landing page. To onboard a new
// tenant domain later, just add one entry here.
// ---------------------------------------------------------------------------
const TENANT_LOGIN_PATH_BY_HOSTNAME: Record<string, string> = {
  "admin.colos.ch": "/login/colos",
  "admin.justmobile.ch": "/login",
  "admin.justcompare.ch": "/login",
  "admin.optimusmarketing.ch": "/login",
}

const DEFAULT_LOGIN_PATH = "/login"

// ---------------------------------------------------------------------------
// Hostname -> default sidebar platform
//
// The dashboard's sidebar/nav items are scoped by a "platform" cookie
// (see lib/platform.ts). Domains that map to a dedicated platform get that
// cookie set automatically so the correct sidebar shows up without the user
// having to switch manually. Domains not listed here (localhost, preview
// URLs, admin.justmobile.ch) keep today's behavior of defaulting to/staying
// on whatever platform is already selected.
// ---------------------------------------------------------------------------
const PLATFORM_BY_HOSTNAME: Record<string, Platform> = {
  "admin.justcompare.ch": "justcompare",
  "admin.optimusmarketing.ch": "optimusmarketing",
}

function resolveTenantLoginPath(hostname: string): string {
  return TENANT_LOGIN_PATH_BY_HOSTNAME[hostname] ?? DEFAULT_LOGIN_PATH
}

function isKnownTenantHostname(hostname: string): boolean {
  return hostname in TENANT_LOGIN_PATH_BY_HOSTNAME
}

export async function middleware(request: NextRequest) {
  // Strip the port (e.g. "localhost:3000" -> "localhost") so hostname checks
  // work the same in local dev regardless of which port is used.
  const hostname = request.nextUrl.hostname

  // Only known production tenant domains get hostname-based redirects.
  // localhost, *.vercel.app preview URLs, custom dev hosts, etc. fall through
  // untouched and keep today's behavior.
  if (isKnownTenantHostname(hostname) && request.nextUrl.pathname === "/login") {
    const tenantLoginPath = resolveTenantLoginPath(hostname)

    // Avoid a redirect loop / no-op redirect when the tenant's landing page
    // actually is "/login" (justmobile, justcompare).
    if (tenantLoginPath !== "/login") {
      const redirectUrl = new URL(tenantLoginPath, request.url)
      redirectUrl.search = request.nextUrl.search // preserve query params
      return NextResponse.redirect(redirectUrl)
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard")
  const isLogin = request.nextUrl.pathname === "/login"

  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Domains with a dedicated platform (see PLATFORM_BY_HOSTNAME) always show
  // that platform's sidebar, regardless of any previously stored cookie —
  // e.g. admin.optimusmarketing.ch must always show Candidates, even if the
  // browser previously visited admin.justmobile.ch and picked up that cookie.
  const platformForHostname = PLATFORM_BY_HOSTNAME[hostname]
  if (platformForHostname && request.cookies.get(PLATFORM_COOKIE)?.value !== platformForHostname) {
    supabaseResponse.cookies.set(PLATFORM_COOKIE, platformForHostname, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/login/colos"],
}
