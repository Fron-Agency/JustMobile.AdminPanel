"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { DataTable, type Column } from "@/components/ui/data-table"

type ReferralLead = {
  id: string
  fullname: string
  email: string
  phone: string | null
  referred_by_lead_id: string
  referrer: {
    id: string
    fullname: string
    email: string
    phone: string | null
  }
}

export default function ReferralsPage() {
  const t = useTranslations("Referrals")
  const [referrals, setReferrals] = useState<ReferralLead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const columns: Column<ReferralLead>[] = [
    {
      key: "fullname",
      label: t("leadName"),
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
      key: "email",
      label: t("leadEmail"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "phone",
      label: t("leadPhone"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "referrer",
      label: t("referredBy"),
      render: (_value, item) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{item.referrer?.fullname ?? "—"}</span>
          <span className="text-xs text-muted-foreground">{item.referrer?.email ?? ""}</span>
          {item.referrer?.phone && (
            <span className="text-xs text-muted-foreground">{item.referrer.phone}</span>
          )}
        </div>
      ),
    },
  ]

  useEffect(() => {
    fetch("/api/leads/referrals")
      .then((r) => r.json())
      .then(setReferrals)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <DataTable
      data={referrals}
      columns={columns}
      title={t("title")}
      searchPlaceholder={t("searchPlaceholder")}
      searchFields={["fullname", "email"]}
      isLoading={isLoading}
    />
  )
}
