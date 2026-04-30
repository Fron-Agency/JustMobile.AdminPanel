"use client"

import { useState } from "react"
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "./skeleton"

export interface Column<T> {
  key: keyof T | string
  label: string
  render?: (value: any, item: T) => React.ReactNode
  className?: string
  hidden?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title: string
  searchPlaceholder: string
  onAdd?: () => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onView?: (item: T) => void
  searchFields?: (keyof T)[]
  emptyMessage?: string
  addButtonText?: string
  isLoading?: boolean
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  title,
  searchPlaceholder,
  onAdd,
  onEdit,
  onDelete,
  onView,
  searchFields = [],
  isLoading = false,
  addButtonText = "Add Item",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")

  const filtered = data.filter((item) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return searchFields.some((field) => {
      const value = item[field]
      return String(value).toLowerCase().includes(searchLower)
    })
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        {/* <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{data.length} total {title.toLowerCase()}</p>
        </div> */}
        {onAdd && (
          <Button onClick={onAdd} className="bg-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            {addButtonText}
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-input"
        />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  className={`font-semibold text-foreground ${column.className || ""} ${column.hidden ? "hidden sm:table-cell" : ""}`}
                >
                  {column.label}
                </TableHead>
              ))}
              {(onEdit || onDelete || onView) && (
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <>
                {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                    <TableCell colSpan={columns.length + 1}>
                    <div className="flex w-full max-w-xs flex-col gap-2">
                        <Skeleton className="h-4 w-full" />
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  {columns.map((column) => {
                    const value = item[column.key as keyof T]
                    const content = column.render ? column.render(value, item) : String(value || "—")
                    return (
                      <TableCell
                        key={String(column.key)}
                        className={`${column.className || ""} ${column.hidden ? "hidden sm:table-cell" : ""}`}
                      >
                        {content}
                      </TableCell>
                    )
                  })}
                  {(onEdit || onDelete || onView) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onView(item)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-destructive"
                            onClick={() => onDelete(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-muted-foreground hover:text-foreground"
                            onClick={() => onEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}