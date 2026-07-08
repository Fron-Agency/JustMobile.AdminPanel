"use client"

import { useEffect, useState } from "react"
import { DataTable, type Column } from "@/components/ui/data-table"
import type { Quote } from "@/app/api/modules/quotes/quotes.type"

type QuoteJson = Omit<Quote, "id" | "createdAt" | "updatedAt"> & {
  id: number
  createdAt: string
  updatedAt: string
}

type QuoteRow = Omit<QuoteJson, "id"> & { id: string }

const columns: Column<QuoteRow>[] = [
  { key: "name", label: "Name", render: (value) => <span className="font-medium text-foreground">{value}</span> },
  { key: "email", label: "Email", render: (value) => <span className="text-muted-foreground text-sm">{value}</span> },
  { key: "phone", label: "Phone", render: (value) => <span className="text-muted-foreground text-sm">{value}</span> },
  { key: "town", label: "Town" },
  { key: "currentInsurer", label: "Current insurer" },
  { key: "selectedTariff", label: "Selected tariff" },
  {
    key: "createdAt",
    label: "Submitted",
    render: (value: string) => <span className="text-muted-foreground text-sm">{new Date(value).toLocaleString()}</span>,
  },
]

export default function ColosQuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/colos/quotes")
      .then((res) => res.json())
      .then((data: QuoteJson[] | { message: string }) => {
        if (!Array.isArray(data)) {
          console.error("Failed to load Colos quotes:", data.message)
          setQuotes([])
          return
        }
        setQuotes(data.map((q) => ({ ...q, id: String(q.id) })))
      })
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <DataTable
      data={quotes}
      columns={columns}
      title="Colos Quotes"
      searchPlaceholder="Search quotes..."
      searchFields={["name", "email", "town", "currentInsurer"]}
      isLoading={isLoading}
    />
  )
}
