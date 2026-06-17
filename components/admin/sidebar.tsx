"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  Package,
  Smartphone,
  Building2,
  Tag,
  Wifi,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  GitBranch,
  Headphones,
  Home,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

type NavChild = { href: string; label: string; icon: React.ElementType }
type NavItem = {
  href: string
  label: string
  icon: React.ElementType
  children?: NavChild[]
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/dashboard/leads",
    label: "Leads",
    icon: PhoneCall,
    children: [
      { href: "/dashboard/leads/referrals", label: "Referrals", icon: GitBranch },
    ],
  },
  {
    href: "/dashboard/plans_mobile",
    label: "Plans",
    icon: Package,
    children: [
      { href: "/dashboard/plans_mobile", label: "Mobile Plans", icon: Smartphone },
      { href: "/dashboard/plans_home", label: "Home Plans", icon: Home },
    ],
  },
  { href: "/dashboard/limited_offers", label: "Limited offers", icon: Users },
  { href: "/dashboard/products", label: "Products", icon: Smartphone },
  { href: "/dashboard/providers", label: "Providers", icon: Building2 },
  { href: "/dashboard/categories", label: "Categories", icon: Tag },
  { href: "/dashboard/countries", label: "Country Zones", icon: Globe },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/partners", label: "Partners", icon: Users },
  { href: "/dashboard/support", label: "Support", icon: Headphones },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>(["/dashboard/leads"])

  const toggleGroup = (href: string) => {
    setOpenGroups((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out h-screen sticky top-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border min-h-[64px]">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Wifi className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-sidebar-foreground font-semibold text-base whitespace-nowrap">JustMobile</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground transition-colors z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Navigation
          </p>
        )}
        {navItems.map(({ href, label, icon: Icon, children }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          const isOpen = openGroups.includes(href)

          return (
            <div key={href}>
              <div className="flex items-center">
                <Link
                  href={href}
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
                {children && !collapsed && (
                  <button
                    onClick={() => toggleGroup(href)}
                    className={cn(
                      "p-1.5 rounded-md transition-colors",
                      isActive
                        ? "text-primary-foreground/70 hover:text-primary-foreground"
                        : "text-sidebar-foreground/40 hover:text-sidebar-foreground"
                    )}
                  >
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
                  </button>
                )}
              </div>

              {children && !collapsed && isOpen && (
                <div className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                  {children.map(({ href: childHref, label: childLabel, icon: ChildIcon }) => {
                    const childActive = pathname === childHref || pathname.startsWith(childHref)
                    return (
                      <Link
                        key={childHref}
                        href={childHref}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                          childActive
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {childLabel}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      {/* <div className="flex flex-col gap-1 px-2 py-4 border-t border-sidebar-border">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div> */}
    </aside>
  )
}
