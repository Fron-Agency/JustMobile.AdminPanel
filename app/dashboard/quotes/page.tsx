"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { DataTable, type Column } from "@/components/ui/data-table"
import type { Quote } from "@/app/api/modules/quotes/quotes.type"

type QuoteJson = Omit<Quote, "id" | "createdAt" | "updatedAt"> & {
  id: number
  createdAt: string
  updatedAt: string
}

type QuoteRow = Omit<QuoteJson, "id"> & { id: string }

export default function QuotesPage() {
  const t = useTranslations("Quotes")

  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const columns: Column<QuoteRow>[] = [
    { key: "name", label: t("columns.name"), render: (value) => <span className="font-medium text-foreground">{value}</span> },
    { key: "email", label: t("columns.email"), render: (value) => <span className="text-muted-foreground text-sm">{value}</span> },
    { key: "phone", label: t("columns.phone"), render: (value) => <span className="text-muted-foreground text-sm">{value}</span> },
    { key: "town", label: t("columns.town") },
    { key: "currentInsurer", label: t("columns.currentInsurer") },
    { key: "selectedTariff", label: t("columns.selectedTariff") },
    {
      key: "createdAt",
      label: t("columns.submitted"),
      render: (value: string) => <span className="text-muted-foreground text-sm">{new Date(value).toLocaleString()}</span>,
    },
  ]

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/quotes")
      .then((res) => res.json())
      .then((data: QuoteJson[]) => setQuotes(data.map((q) => ({ ...q, id: String(q.id) }))))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <DataTable
      data={quotes}
      columns={columns}
      title={t("title")}
      searchPlaceholder={t("searchPlaceholder")}
      searchFields={["name", "email", "town", "currentInsurer"]}
      isLoading={isLoading}
    />
  )
}
