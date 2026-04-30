"use client"

import { useState, useEffect } from "react"
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
import type { Provider } from "@/app/api/modules/providers/providers.type"
import type { Category } from "@/app/api/modules/categories/categories.type"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

const emptyProvider: Omit<Provider, "id" | "created_at"> = {
  category_id: "",
  name: "",
  is_active: true,
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [formData, setFormData] = useState(emptyProvider)
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.category_id) newErrors.category_id = "Category is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyProvider)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const handleEdit = (prov: Provider) => {
    setEditing(prov)
    setFormData({ category_id: prov.category_id, name: prov.name, is_active: prov.is_active })
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const handleDelete = (provider: Provider) => {
    setProviderToDelete(provider)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleActive = async (prov: Provider, isActive: boolean) => {
    setToggleLoading((prev) => ({ ...prev, [prov.id]: true }))

    try {
      const res = await fetch(`/api/providers/${prov.id}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to update provider status")
      }

      const updated = await res.json()
      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } finally {
      setToggleLoading((prev) => ({ ...prev, [prov.id]: false }))
    }
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
        const category = categories.find((c) => c.id === value)
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

    const res = await fetch("/api/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        category_id: formData.category_id,
      }),
    })

    const created = await res.json()
    setProviders((prev) => [created, ...prev])
    setIsAddDialogOpen(false)
  }

  const confirmEdit = async () => {
    if (!editing) return

    if (!validateForm()) return

    const payload: Partial<Provider> = {
      name: formData.name,
      category_id: formData.category_id,
      is_active: formData.is_active,
    }

    const res = await fetch(`/api/providers/${editing.id}`, {
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

    setProviders((prev) => prev.map((p) => (p.id === editing.id ? data : p)))

    setIsEditDialogOpen(false)
    setEditing(null)
  }

  const confirmDelete = async () => {
    if(!providerToDelete) return

    await fetch(`/api/providers/${providerToDelete.id}`, {
      method: "DELETE",
    })

    setProviders((prev) => prev.filter((p) => p.id !== providerToDelete.id))
    setIsDeleteDialogOpen(false)
    setProviderToDelete(null)
  }

  const handleView = (provider: Provider) => {
    // For future expansion - maybe show provider details or associated plans?
    alert(`Viewing provider: ${provider.name}`)
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [providersRes, categoriesRes] = await Promise.all([
          fetch("/api/providers"),
          fetch("/api/categories")
        ])
        const providersData = await providersRes.json()
        const categoriesData = await categoriesRes.json()
        setProviders(providersData)
        setCategories(categoriesData)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <>
      <DataTable
        data={providers}
        columns={columns}
        title="Providers"
        searchPlaceholder="Search providers..."
        searchFields={["name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
        addButtonText="Add Provider"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Provider</DialogTitle>
            <DialogDescription>
              Add a new provider to the system.
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
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd}>Add Provider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
            <DialogDescription>
              Update provider information.
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
              <Label htmlFor="edit-category" className="text-right">
                Category
              </Label>
              <div className="col-span-3">
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
              </div>
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
            <AlertDialogTitle>Delete Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {providerToDelete?.name}? This action
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
