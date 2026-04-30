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
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { DataTable, type Column } from "@/components/ui/data-table"
import { mockCategories as initialCategories } from "@/lib/mock-data"
import type { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"

const emptyCategory: Omit<Category, "id"> = {
  name: "",
  is_active: true,
}

const columns: Column<Category>[] = [
  {
    key: "name",
    label: "Name",
    render: (value) => <span className="font-medium text-foreground">{value}</span>,
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<Omit<Category, "id">>(emptyCategory)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyCategory)
    setDialogOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, is_active: cat.is_active })
    setDialogOpen(true)
  }

  const handleDelete = () => {
    console.log("Deleting category with ID:", deleteId)
  }

  const confirmDelete = () => {
    if (deleteId) {
      setCategories((prev) => prev.filter((c) => c.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleSave = () => {
    if (editing) {
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...editing, ...form } : c)))
    } else {
      setCategories((prev) => [{ id: `cat-${Date.now()}`, ...form }, ...prev])
    }
    setDialogOpen(false)
  }

  return (
    <>
      <DataTable
        data={categories}
        columns={columns}
        title="Categories"
        searchPlaceholder="Search categories..."
        searchFields={["name"]}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addButtonText="Add Category"
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing ? "Update category details." : "Create a new service category."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Category Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">{editing ? "Save Changes" : "Create Category"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The category will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  ) 
}
