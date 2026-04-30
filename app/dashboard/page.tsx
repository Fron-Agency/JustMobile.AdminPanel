import { PhoneCall, Package, Building2, Users, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockLeads, mockPlans, mockProviders, mockCategories } from "@/lib/mock-data"

const statCards = [
  {
    label: "Total Leads",
    value: mockLeads.length,
    icon: PhoneCall,
    change: "+12%",
    positive: true,
    description: "vs last month",
  },
  {
    label: "Active Plans",
    value: mockPlans.length,
    icon: Package,
    change: "+3",
    positive: true,
    description: "new this month",
  },
  {
    label: "Providers",
    value: mockProviders.filter((p) => p.is_active).length,
    icon: Building2,
    change: "2 inactive",
    positive: false,
    description: "need attention",
  },
  // {
  //   label: "Admin Users",
  //   value: mockUsers.length,
  //   icon: Users,
  //   change: "+1",
  //   positive: true,
  //   description: "added recently",
  // },
]

const leadStatusConfig = {
  new: { label: "New", color: "bg-primary/10 text-primary border-primary/20" },
  contacted: { label: "Contacted", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  converted: { label: "Converted", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  lost: { label: "Lost", color: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function DashboardPage() {
  const recentLeads = [...mockLeads].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  const leadsByStatus = {
    new: mockLeads.filter((l) => l.status === "new").length,
    contacted: mockLeads.filter((l) => l.status === "contacted").length,
    converted: mockLeads.filter((l) => l.status === "converted").length,
    lost: mockLeads.filter((l) => l.status === "lost").length,
  }

  const planByProvider = mockPlans.reduce<Record<string, number>>((acc, plan) => {
    const provider = mockProviders.find((p) => p.id === plan.provider_id)
    const name = provider?.name ?? "Unknown"
    acc[name] = (acc[name] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, change, positive, description }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <TrendingUp className={`w-3 h-3 ${positive ? "text-emerald-500" : "text-destructive"}`} />
                    <span className={`text-xs font-medium ${positive ? "text-emerald-500" : "text-destructive"}`}>{change}</span>
                    <span className="text-xs text-muted-foreground">{description}</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent leads */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Recent Leads</CardTitle>
            <CardDescription className="text-muted-foreground">Latest 5 leads submitted</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentLeads.map((lead) => {
                const plan = mockPlans.find((p) => p.id === lead.plan_id)
                const status = leadStatusConfig[lead.status]
                return (
                  <div key={lead.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {lead.fullname.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{lead.fullname}</p>
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:block text-xs text-muted-foreground">{plan?.name ?? "—"}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="hidden md:block text-xs text-muted-foreground">{lead.created_at}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Lead status summary */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Lead Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {[
                { label: "New", count: leadsByStatus.new, icon: Clock, color: "text-primary" },
                { label: "Contacted", count: leadsByStatus.contacted, icon: AlertCircle, color: "text-amber-500" },
                { label: "Converted", count: leadsByStatus.converted, icon: CheckCircle2, color: "text-emerald-500" },
                { label: "Lost", count: leadsByStatus.lost, icon: AlertCircle, color: "text-destructive" },
              ].map(({ label, count, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
                        style={{ width: `${(count / mockLeads.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-4 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Plans by provider */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">Plans by Provider</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {Object.entries(planByProvider).map(([provider, count]) => (
                <div key={provider} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{provider}</span>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">
                    {count} plan{count !== 1 ? "s" : ""}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categories overview */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Categories</CardTitle>
          <CardDescription className="text-muted-foreground">All service categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {mockCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className={`w-2 h-2 rounded-full ${cat.is_active ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.is_active ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
