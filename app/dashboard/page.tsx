import { PhoneCall, Package, Building2, TrendingUp, AlertCircle, CheckCircle2, Clock, Send } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LeadService } from "@/app/api/modules/leads/leads.service"
import { PlanService } from "@/app/api/modules/plans_mobile/plans_mobile.service"
import { ProviderService } from "@/app/api/modules/providers/providers.service"

const leadStatusColors = {
  new: "bg-primary/10 text-primary border-primary/20",
  sent: "bg-primary/80 text-white border-primary/90",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  converted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
}

export default async function DashboardPage() {
  const t = await getTranslations("Dashboard")

  const [leads, plans, providers] = await Promise.all([
    LeadService.getAll(),
    PlanService.getPlansCounter(),
    ProviderService.getAll(),
  ])

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const leadsByStatus = {
    new: leads.filter((l) => l.status === "new").length,
    sent: leads.filter((l) => l.status === "sent").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
    lost: leads.filter((l) => l.status === "lost").length,
  }

  const statCards = [
    {
      label: t("totalLeads"),
      value: leads.length,
      icon: PhoneCall,
      sub: t("newCount", { count: leadsByStatus.new }),
      positive: leadsByStatus.new > 0,
    },
    {
      label: t("activePlans"),
      value: plans,
      icon: Package,
      sub: t("acrossProviders", { count: providers.filter((p) => p.is_active).length }),
      positive: true,
    },
    {
      label: t("providers"),
      value: providers.filter((p) => p.is_active).length,
      icon: Building2,
      sub: t("inactiveCount", { count: providers.filter((p) => !p.is_active).length }),
      positive: providers.filter((p) => !p.is_active).length === 0,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, sub, positive }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <TrendingUp className={`w-3 h-3 ${positive ? "text-emerald-500" : "text-destructive"}`} />
                    <span className={`text-xs font-medium ${positive ? "text-emerald-500" : "text-destructive"}`}>{sub}</span>
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
            <CardTitle className="text-base font-semibold text-foreground">{t("recentLeads")}</CardTitle>
            <CardDescription className="text-muted-foreground">{t("recentLeadsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">{t("noLeadsYet")}</p>
            ) : (
              <div className="divide-y divide-border">
                {recentLeads.map((lead) => {
                  const color = leadStatusColors[lead.status]
                  return (
                    <div key={lead.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {lead.fullname?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? " "}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{lead.fullname}</p>
                          <p className="text-xs text-muted-foreground">{lead.email}</p>
                        </div>
                      </div>
                      <Badge className={color}>{t(`leadStatus.${lead.status}`)}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Lead pipeline */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground">{t("leadPipeline")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {leads.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noLeadsYet")}</p>
              ) : (
                [
                  { key: "new" as const, count: leadsByStatus.new, icon: Clock, color: "text-primary" },
                  { key: "sent" as const, count: leadsByStatus.sent, icon: Send, color: "text-primary" },
                  { key: "contacted" as const, count: leadsByStatus.contacted, icon: AlertCircle, color: "text-amber-500" },
                  { key: "converted" as const, count: leadsByStatus.converted, icon: CheckCircle2, color: "text-emerald-500" },
                  { key: "lost" as const, count: leadsByStatus.lost, icon: AlertCircle, color: "text-destructive" },
                ].map(({ key, count, icon: Icon, color }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-sm text-muted-foreground">{t(`leadStatus.${key}`)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
                          style={{ width: leads.length > 0 ? `${(count / leads.length) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-4 text-right">{count}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
