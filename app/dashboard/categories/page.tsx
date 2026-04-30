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
import type { Category } from "@/app/api/modules/categories/categories.type"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

const emptyCategory: Omit<Category, "id"> = {
  name: "",
  is_active: true,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [formData, setFormData] = useState(emptyCategory) 
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})

  const handleAdd = () => {
    setFormData(emptyCategory)
    setIsAddDialogOpen(true)
  }

  const handleEdit = (cat: Category) => {
    setEditing(cat)
    setFormData({ name: cat.name, is_active: cat.is_active })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleActive = async (cat: Category, isActive: boolean) => {
    setToggleLoading((prev) => ({ ...prev, [cat.id]: true }))

    try {
      const res = await fetch(`/api/categories/${cat.id}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to update category status")
      }

      const updated = await res.json()
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } finally {
      setToggleLoading((prev) => ({ ...prev, [cat.id]: false }))
    }
  }

  const handleSave = () => {
    if (editing) {
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? { ...editing, ...formData } : c)))
    } else {
      setCategories((prev) => [{ id: `cat-${Date.now()}`, ...formData }, ...prev])
    }
    setIsEditDialogOpen(false)
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
      render: (value, item) => {
        const isToggling = toggleLoading[item.id]
        return (
          <Field orientation="horizontal">
            <Switch
              checked={value}
              disabled={isToggling}
              onCheckedChange={(checked) => handleToggleActive(item, checked === true)}
            />
            {isToggling ? (
              <Spinner className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FieldLabel>{value ? "On" : "Off"}</FieldLabel>
            )}
          </Field>
        )
      },
    },
  ]

  const confirmAdd = async () => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    })

    const created = await res.json()
    setCategories((prev) => [created, ...prev])
    setIsAddDialogOpen(false)
  }

  const confirmEdit = async () => {
    if (!editing) return

    const payload: Partial<Category> = {
      name: formData.name,
      is_active: formData.is_active,
    }

    const res = await fetch(`/api/categories/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || "Request failed")
    }

    const contentType = res.headers.get("content-type")

    const data = contentType?.includes("application/json")
      ? await res.json()
      : null

    setCategories((prev) => prev.map((c) => (c.id === editing.id ? data : c)))

    setIsEditDialogOpen(false)
    setEditing(null)
  }

  const confirmDelete = async () => {
    if(!categoryToDelete) return

    await fetch(`/api/categories/${categoryToDelete.id}`, {
      method: "DELETE",
    })

    setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
    setIsDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  const handleView = (category: Category) => {
    // For future expansion - maybe show category details or associated providers?
    alert(`Viewing category: ${category.name}`)
  }

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .finally(() => setIsLoading(false))
  }, [])


  return (
    <>
      <DataTable
        data={categories}
        columns={columns}
        title="Categories"
        searchPlaceholder="Search categories..."
        searchFields={["name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
        addButtonText="Add Category"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Add a new category to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {categoryToDelete?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  ) 
}
