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
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { DataTable, type Column } from "@/components/ui/data-table"
import type { Category } from "@/app/api/modules/categories/categories.type"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"

const emptyCategory: Omit<Category, "id"> = {
  name: "",
  badge: "",
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyCategory)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const handleEdit = (cat: Category) => {
    setFeedback(null)
    setEditing(cat)
    setFormData({ name: cat.name, badge: cat.badge, is_active: cat.is_active })
    setErrors({})
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
      setFeedback({
        tone: "success",
        title: "Category updated",
        description: `${cat.name} is now ${isActive ? "active" : "inactive"}.`,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setFeedback({
        tone: "destructive",
        title: "Could not update category status",
        description: message,
      })
    }
    finally {
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
      key: "badge",
      label: "Badge",
      render: (value) => value ? <span className="px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground">{value}</span> : <span className="text-muted-foreground">No badge</span>,
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
    if (!validateForm()) return
    setIsLoading(true)

    try{
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not add category",
          description: errorText || "Request failed",
        })
        return
      }
  
      const created = await res.json()
      setCategories((prev) => [created, ...prev])
      setIsAddDialogOpen(false)
      setFeedback({
        tone: "success",
        title: "Category added",
        description: `${formData.name} has been created.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmEdit = async () => {
    if (!editing) return
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const payload: Partial<Category> = {
        name: formData.name,
        badge: formData.badge,
        is_active: formData.is_active,
      }
  
      const res = await fetch(`/api/categories/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not add category",
          description: errorText || "Request failed",
        })
        return
      }
  
      const updated = await res.json()
  
      setCategories((prev) => prev.map((c) => (c.id === editing.id ? updated : c)))
  
      setIsEditDialogOpen(false)
      setEditing(null)
      setFeedback({
        tone: "success",
        title: "Category updated",
        description: `${updated.name} has been updated.`,
      })
    } finally {
      setIsLoading(false);
    }
  }

  // const confirmDelete = async () => {
  //   if (!categoryToDelete) return

  //   await fetch(`/api/categories/${categoryToDelete.id}`, {
  //       method: "DELETE",
  //   })

  //   setCategories((prev) =>
  //       prev.filter((category) => category.id !== categoryToDelete.id)
  //   )

  //   setIsDeleteDialogOpen(false)
  //   setCategoryToDelete(null)
  // }

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
        data={categories}
        columns={columns}
        title="Categories"
        searchPlaceholder="Search categories..."
        searchFields={["name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        // onDelete={handleDelete}
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
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="badge" className="text-right">
                Badge
              </Label>
              <div className="col-span-3">
                <Input
                  id="badge"
                  value={formData.badge}
                  onChange={(e) =>
                    setFormData({ ...formData, badge: e.target.value })
                  }
                  className={errors.badge ? "border-red-500" : ""}
                />
                {errors.badge && <p className="text-red-500 text-sm mt-1">{errors.badge}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              { isLoading ? "Adding..." : "Add Category" }
            </Button>
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
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-badge" className="text-right">
                Badge
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-badge"
                  value={formData.badge}
                  onChange={(e) =>
                    setFormData({ ...formData, badge: e.target.value })
                  }
                  className={errors.badge ? "border-red-500" : ""}
                />
                {errors.badge && <p className="text-red-500 text-sm mt-1">{errors.badge}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              { isLoading ? "Saving Changes..." : "Save Changes" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  ) 
}
