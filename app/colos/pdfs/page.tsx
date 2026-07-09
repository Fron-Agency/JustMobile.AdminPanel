"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import type { ColosQuote } from "@/app/api/modules/colos/colos-quotes.type"

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

  const handleViewPdf = (row: PdfRow) => {
    window.open(`/api/colos/quotes/${row.quoteId}/pdf-url`, "_blank", "noopener,noreferrer")
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
      render: (_value, item) => (
        <Button size="sm" variant="outline" className="gap-1" onClick={() => handleViewPdf(item)}>
          <Eye className="w-3.5 h-3.5" />
          View
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      data={pdfs}
      columns={columns}
      title="PDFs"
      searchPlaceholder="Search PDFs..."
      searchFields={["name", "town", "currentInsurer"]}
      emptyMessage="No PDFs yet"
      isLoading={isLoading}
    />
  )
}
