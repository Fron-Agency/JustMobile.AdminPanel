"use client"

import { DataTable, type Column } from "@/components/ui/data-table"

type PdfRow = { id: string; name: string }

const columns: Column<PdfRow>[] = [
  { key: "name", label: "Name" },
]

export default function ColosPdfsPage() {
  return (
    <DataTable
      data={[]}
      columns={columns}
      title="PDFs"
      searchPlaceholder="Search PDFs..."
      searchFields={["name"]}
      emptyMessage="No PDFs yet"
    />
  )
}
