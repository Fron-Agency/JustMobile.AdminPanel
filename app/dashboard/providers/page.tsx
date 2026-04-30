"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/ui/data-table"
import { mockProviders as initialProviders, mockCategories } from "@/lib/mock-data"
import type { Provider } from "@/lib/types"
import { Field, FieldLabel } from "@/components/ui/field"

const emptyProvider: Omit<Provider, "id" | "created_at"> = {
  category_id: "",
  name: "",
  is_active: true,
}

const columns: Column<Provider>[] = [
  {
    key: "name",
    label: "Name",
    render: (value) => <span className="font-medium text-foreground">{value}</span>,
  },
  {
    key: "category_id",
    label: "Category",
    render: (value) => {
      const category = mockCategories.find((c) => c.id === value)
      return <span className="text-muted-foreground text-sm">{category?.name ?? "—"}</span>
    },
  },
  {
    key: "created_at",
    label: "Created",
    render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    hidden: true,
  },
    {
    key: "is_active",
    label: "Active",
    render: (value) => (
      <Field orientation="horizontal">
        <Switch checked={value} />
        <FieldLabel>{value ? "On" : "Off"}</FieldLabel>
      </Field>
    ),
  },
]

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>(initialProviders)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [form, setForm] = useState<Omit<Provider, "id" | "created_at">>(emptyProvider)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyProvider)
    setDialogOpen(true)
  }

  const openEdit = (provider: Provider) => {
    setEditing(provider)
    setForm({ category_id: provider.category_id, name: provider.name, is_active: provider.is_active })
    setDialogOpen(true)
  }

  const handleDelete = (provider: Provider) => {
    setDeleteId(provider.id)
  }

  const confirmDelete = () => {
    if (deleteId) {
      setProviders((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleSave = () => {
    if (editing) {
      setProviders((prev) => prev.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)))
    } else {
      setProviders((prev) => [{ id: `prov-${Date.now()}`, created_at: new Date().toISOString().split("T")[0], ...form }, ...prev])
    }
    setDialogOpen(false)
  }

  return (
    <>
      <DataTable
        data={providers}
        columns={columns}
        title="Providers"
        searchPlaceholder="Search providers..."
        searchFields={["name"]}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addButtonText="Add Provider"
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Edit Provider" : "Add New Provider"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing ? "Update provider details." : "Add a new telecom provider."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Provider Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger className="bg-background border-input w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {mockCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">{editing ? "Save Changes" : "Create Provider"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Provider</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The provider will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
