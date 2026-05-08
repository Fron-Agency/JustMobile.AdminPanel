"use client"

import { useState } from "react"
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
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
  selectable = false,
  selectedIds = [],
  onSelectionChange,
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

  const filteredIds = filtered.map((i) => i.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id))
  const someSelected = filteredIds.some((id) => selectedIds.includes(id))

  const toggleAll = () => {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !filteredIds.includes(id)))
    } else {
      onSelectionChange([...new Set([...selectedIds, ...filteredIds])])
    }
  }

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
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
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => { if (el) (el as any).indeterminate = someSelected && !allSelected }}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
              )}
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
                    <TableCell colSpan={columns.length + (selectable ? 2 : 1)}>
                      <div className="flex w-full max-w-xs flex-col gap-2">
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedIds.includes(item.id)
                return (
                  <TableRow
                    key={item.id}
                    className={isSelected ? "bg-muted/40 hover:bg-muted/50" : "hover:bg-muted/20"}
                    onClick={selectable ? () => toggleOne(item.id) : undefined}
                    style={selectable ? { cursor: "pointer" } : undefined}
                  >
                    {selectable && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleOne(item.id)}
                        />
                      </TableCell>
                    )}
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}