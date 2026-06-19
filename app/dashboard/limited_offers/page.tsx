"use client"

import { useEffect, useState } from "react"
import { DataTable, type Column } from "@/components/ui/data-table"
import type { User } from "@/app/api/modules/users/users.type"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { LimitedOffersDto } from "@/app/api/modules/limited_offers/limited_offers.type"

export default function UsersPage() {
    const [limitedOffers, setLimitedOffers] = useState<LimitedOffersDto[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [feedback, setFeedback] = useState<{
      tone: FeedbackAlertTone
      title: string
      description?: string
    } | null>(null)

  const columns: Column<LimitedOffersDto>[] = [
    {
      key: "email",
      label: "Email",
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
    key: "created_at",
    label: "Created",
    render: (value) => (
        <span className="text-muted-foreground text-sm">
        {new Date(value).toLocaleString()}
        </span>
    ),
    },
    {
        key: "plan_mobile_name",
        label: "Plan",
        render: (value) => <span className="text-muted-foreground text-sm">{value}</span>
    }
  ]

  useEffect(() => {
    setIsLoading(true)

    fetch("/api/limited_offers")
      .then((res) => res.json())
      .then((data) => {
        const today = new Date()
        const yesterday = new Date()

        yesterday.setDate(today.getDate() - 1)

        const filtered = data.filter((offer: LimitedOffersDto) => {
          const created = new Date(offer.created_at)

          return created >= yesterday && created <= today
        })

        setLimitedOffers(filtered)
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <>
        {feedback ? (
          <div className="mb-4">
            <FeedbackAlert
              tone={feedback.tone}
              title={feedback.title}
              description={feedback.description}
              onAutoDismiss={() => setFeedback(null)}
            />
          </div>
        ) : null}
        <DataTable
          data={limitedOffers}
          columns={columns}
          title="Users"
          searchPlaceholder="Search users..."
          isLoading={isLoading}
        />
    </>
  )
}