"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, RotateCw, PenLine } from "lucide-react"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import type { ColosQuote } from "@/app/api/modules/colos/colos-quotes.type"

type QuoteJson = Omit<ColosQuote, "id" | "createdAt" | "updatedAt"> & {
  id: number
  createdAt: string
  updatedAt: string
  pdfUrl: string | null
  pdfGeneratedAt: string | null
  signedAt: string | null
}

type QuoteRow = Omit<QuoteJson, "id"> & { id: string; quoteId: number }

export default function ColosQuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const loadQuotes = () => {
    setIsLoading(true)
    fetch("/api/colos/quotes")
      .then((res) => res.json())
      .then((data: QuoteJson[] | { message: string }) => {
        if (!Array.isArray(data)) {
          console.error("Failed to load Colos quotes:", data.message)
          setQuotes([])
          return
        }
        setQuotes(data.map((q) => ({ ...q, id: String(q.id), quoteId: q.id })))
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  const handleGeneratePdf = async (row: QuoteRow) => {
    setPdfLoading((prev) => ({ ...prev, [row.id]: true }))
    try {
      const res = await fetch(`/api/colos/quotes/${row.quoteId}/pdf`, { method: "POST" })
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to generate PDF")
      }
      const record = await res.json()
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === row.id ? { ...q, pdfUrl: record.pdfUrl, pdfGeneratedAt: record.pdfGeneratedAt } : q
        )
      )
      setFeedback({
        tone: "success",
        title: "PDF generated",
        description: `Mandate PDF for ${row.name} has been generated.`,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setFeedback({ tone: "destructive", title: "Could not generate PDF", description: message })
    } finally {
      setPdfLoading((prev) => ({ ...prev, [row.id]: false }))
    }
  }

  const columns: Column<QuoteRow>[] = [
    { key: "name", label: "Name", render: (value) => <span className="font-medium text-foreground">{value}</span> },
    { key: "email", label: "Email", render: (value) => <span className="text-muted-foreground text-sm">{value}</span> },
    { key: "phone", label: "Phone", render: (value) => <span className="text-muted-foreground text-sm">{value}</span> },
    { key: "town", label: "Town" },
    { key: "currentInsurer", label: "Current insurer" },
    { key: "selectedTariff", label: "Selected tariff" },
    { key: "franchise", label: "Franchise" },
    { key: "yearOfBirth", label: "Year of birth" },
    {
      key: "createdAt",
      label: "Submitted",
      render: (value: string) => <span className="text-muted-foreground text-sm">{new Date(value).toLocaleString()}</span>,
    },
    {
      key: "pdfUrl",
      label: "Mandate PDF",
      render: (_value, item) => {
        const isLoading = pdfLoading[item.id]

        if (isLoading) {
          return <Spinner className="h-4 w-4 text-muted-foreground" />
        }

        if (!item.pdfUrl) {
          return (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleGeneratePdf(item)}>
              <FileText className="w-3.5 h-3.5" />
              Generate PDF
            </Button>
          )
        }

        return (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => router.push(`/colos/quotes/${item.quoteId}/sign`)}
            >
              <PenLine className="w-3.5 h-3.5" />
              {item.signedAt ? "Re-sign" : "Sign"}
            </Button>
            {item.signedAt ? (
              <span className="text-xs text-muted-foreground">
                Signed {new Date(item.signedAt).toLocaleDateString()}
              </span>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 text-muted-foreground hover:text-foreground"
              title="Regenerate PDF"
              onClick={() => handleGeneratePdf(item)}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        )
      },
    },
  ]

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
        data={quotes}
        columns={columns}
        title="Colos Quotes"
        searchPlaceholder="Search quotes..."
        searchFields={["name", "email", "town", "currentInsurer"]}
        isLoading={isLoading}
      />
    </>
  )
}
