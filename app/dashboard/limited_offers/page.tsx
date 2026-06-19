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

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")  

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

  const filteredOffers = limitedOffers.filter((offer) => {
    const created = new Date(offer.created_at)

    if (startDate && created < new Date(startDate))
      return false

    return true
  })

  useEffect(() => {
    setIsLoading(true)

    const params = new URLSearchParams()

    if (startDate) {
      params.append("startDate", startDate)
    }

    if (endDate) {
      params.append("endDate", endDate)
    }

    fetch(`/api/limited_offers?${params.toString()}`)
      .then((res) => res.json())
      .then(setLimitedOffers)
      .finally(() => setIsLoading(false))
  }, [startDate, endDate])

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
        <div className="mb-4 flex gap-4">
          <div>
            <label className="block text-sm mb-1">
              From
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              To
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
          </div>
        </div>
        <DataTable
          data={filteredOffers}
          columns={columns}
          title="Users"
          searchPlaceholder="Search users..."
          isLoading={isLoading}
        />
    </>
  )
}