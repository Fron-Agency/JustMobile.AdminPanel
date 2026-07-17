"use client"

import { useEffect, useState } from "react"
import { Eye, Mail } from "lucide-react"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ColosQuote } from "@/app/api/modules/colos/colos-quotes.type"
import { COLOS_PDF_LANGUAGES, type ColosPdfLang } from "@/app/api/modules/colos/colos-pdf.languages"

type QuoteJson = Omit<ColosQuote, "id" | "createdAt" | "updatedAt"> & {
  id: number
  createdAt: string
  updatedAt: string
  pdfUrl: string | null
  pdfGeneratedAt: string | null
}

type PdfRow = Omit<QuoteJson, "id"> & { id: string; quoteId: number; pdfUrl: string; pdfGeneratedAt: string }

export default function ColosPdfsPage() {
  const [pdfs, setPdfs] = useState<PdfRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [langByRow, setLangByRow] = useState<Record<string, ColosPdfLang>>({})
  const [emailLoading, setEmailLoading] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/colos/quotes")
      .then((res) => res.json())
      .then((data: QuoteJson[] | { message: string }) => {
        if (!Array.isArray(data)) {
          console.error("Failed to load Colos PDFs:", data.message)
          setPdfs([])
          return
        }
        const withPdf = data.filter(
          (q): q is QuoteJson & { pdfUrl: string; pdfGeneratedAt: string } => Boolean(q.pdfUrl)
        )
        setPdfs(withPdf.map((q) => ({ ...q, id: String(q.id), quoteId: q.id })))
      })
      .finally(() => setIsLoading(false))
  }, [])

  const getLang = (rowId: string) => langByRow[rowId] ?? "fr"

  const handleViewPdf = (row: PdfRow) => {
    window.open(`/api/colos/quotes/${row.quoteId}/pdf-url?lang=${getLang(row.id)}`, "_blank", "noopener,noreferrer")
  }

  const handleSendEmail = async (row: PdfRow) => {
    setEmailLoading((prev) => ({ ...prev, [row.id]: true }))
    try {
      const res = await fetch("/api/colos/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: row.quoteId, lang: getLang(row.id) }),
      })
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null)
        throw new Error(errorBody?.message || "Failed to send email")
      }
      setFeedback({
        tone: "success",
        title: "Email sent",
        description: `The mandate PDF has been emailed to ${row.email}.`,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setFeedback({ tone: "destructive", title: "Could not send email", description: message })
    } finally {
      setEmailLoading((prev) => ({ ...prev, [row.id]: false }))
    }
  }

  const columns: Column<PdfRow>[] = [
    { key: "name", label: "Name", render: (value) => <span className="font-medium text-foreground">{value}</span> },
    { key: "town", label: "Town" },
    { key: "currentInsurer", label: "Current insurer" },
    {
      key: "pdfGeneratedAt",
      label: "Generated",
      render: (value: string) => <span className="text-muted-foreground text-sm">{new Date(value).toLocaleString()}</span>,
    },
    {
      key: "id",
      label: "PDF",
      render: (_value, item) => {
        const isSendingEmail = emailLoading[item.id]

        return (
          <div className="flex items-center gap-1">
            <Select value={getLang(item.id)} onValueChange={(value) => setLangByRow((prev) => ({ ...prev, [item.id]: value as ColosPdfLang }))}>
              <SelectTrigger size="sm" className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOS_PDF_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleViewPdf(item)}>
              <Eye className="w-3.5 h-3.5" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={isSendingEmail}
              onClick={() => handleSendEmail(item)}
            >
              {isSendingEmail ? <Spinner className="h-3.5 w-3.5" /> : <Mail className="w-3.5 h-3.5" />}
              Email
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
        data={pdfs}
        columns={columns}
        title="PDFs"
        searchPlaceholder="Search PDFs..."
        searchFields={["name", "town", "currentInsurer"]}
        emptyMessage="No PDFs yet"
        isLoading={isLoading}
      />
    </>
  )
}
