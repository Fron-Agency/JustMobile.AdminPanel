"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
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
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET = "provider-logo"

function getLogoUrl(fileUrl: string | null): string | null {
  if (!fileUrl) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileUrl}`
}

const emptyProvider: Omit<Provider, "id" | "created_at"> = {
  category_id: "",
  name: "",
  is_active: true,
  file_url: null,
}

export default function ProvidersPage() {
  const t = useTranslations("Providers")

  async function uploadLogo(file: File): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/providers/logo", { method: "POST", body: fd })
    if (!res.ok) throw new Error(t("logoUploadFailed"))
    const { file_url } = await res.json()
    return file_url
  }

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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = t("nameRequired")
    if (!formData.category_id) newErrors.category_id = t("categoryRequired")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyProvider)
    setLogoFile(null)
    setLogoPreview(null)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const handleEdit = (prov: Provider) => {
    setFeedback(null)
    setEditing(prov)
    setFormData({ category_id: prov.category_id, name: prov.name, is_active: prov.is_active, file_url: prov.file_url })
    setLogoFile(null)
    setLogoPreview(getLogoUrl(prov.file_url))
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
        throw new Error(errorText || t("failedToUpdateStatus"))
      }

      const updated = await res.json()
      setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setFeedback({
        tone: "success",
        title: isActive ? t("providerActivated") : t("providerDeactivated"),
        description: t("statusChangedDescription", { name: prov.name, status: isActive ? t("active") : t("inactive") }),
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : t("somethingWentWrong")
      setFeedback({
        tone: "destructive",
        title: t("couldNotUpdateStatus"),
        description: message,
      })
    }
    finally {
      setToggleLoading((prev) => ({ ...prev, [prov.id]: false }))
    }
  }

  const columns: Column<Provider>[] = [
    {
      key: "file_url",
      label: t("columns.logo"),
      render: (value) => {
        const url = getLogoUrl(value)
        return url
          ? <img src={url} alt="logo" className="h-8 w-8 object-contain rounded" />
          : <span className="text-muted-foreground text-sm">—</span>
      },
    },
    {
      key: "name",
      label: t("columns.name"),
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
      key: "category_id",
      label: t("columns.category"),
      render: (value) => {
        const category = categories.find((c) => c.id === value)
        return <span className="text-muted-foreground text-sm">{category?.name ?? "—"}</span>
      },
    },
    {
      key: "created_at",
      label: t("columns.created"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
      hidden: true,
    },
    {
      key: "is_active",
      label: t("columns.active"),
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
              <FieldLabel>{value ? t("on") : t("off")}</FieldLabel>
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
      let file_url: string | null = null
      if (logoFile) {
        try {
          file_url = await uploadLogo(logoFile)
        } catch {
          setFeedback({ tone: "destructive", title: t("logoUploadFailed") })
          return
        }
      }

      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category_id: formData.category_id,
          file_url,
        }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotAddProvider"),
          description: errorText || t("requestFailed"),
        })
        return
      }

      const created = await res.json()
      setProviders((prev) => [created, ...prev])
      setIsAddDialogOpen(false)
      setFeedback({
        tone: "success",
        title: t("providerAdded"),
        description: t("providerCreatedDescription", { name: created.name }),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmEdit = async () => {
    if (!editing) return
    if (!validateForm()) return
    setIsLoading(true)

    try{
      let newFileUrl: string | undefined
      if (logoFile) {
        try {
          newFileUrl = await uploadLogo(logoFile)
        } catch {
          setFeedback({ tone: "destructive", title: t("logoUploadFailed") })
          return
        }
      }

      const payload: Partial<Provider> = {
        name: formData.name,
        category_id: formData.category_id,
        is_active: formData.is_active,
        ...(newFileUrl !== undefined && { file_url: newFileUrl }),
      }

      const res = await fetch(`/api/providers/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotUpdateProvider"),
          description: text || t("requestFailed"),
        })
        return
      }

      const updated = await res.json()
      setProviders((prev) =>
        prev.map((p) => (p.id === editing.id ? updated : p))
      )

      setIsEditDialogOpen(false)
      setEditing(null)
      setFeedback({
        tone: "success",
        title: t("providerUpdated"),
        description: t("providerUpdatedDescription", { name: updated.name }),
      })
    } finally {
      setIsLoading(false);
    }
  }

  const confirmDelete = async () => {
    if (!providerToDelete) return
    setIsLoading(true);

    try{
      const res = await fetch(`/api/providers/${providerToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotDeleteProvider"),
          description: errorText || t("requestFailed"),
        })
        return
      }

      const name = providerToDelete.name
      setProviders((prev) => prev.filter((p) => p.id !== providerToDelete.id))
      setIsDeleteDialogOpen(false)
      setProviderToDelete(null)
      setFeedback({
        tone: "success",
        title: t("providerDeleted"),
        description: t("providerDeletedDescription", { name }),
      })
    } finally {
      setIsLoading(false);
    }
  }

  const handleView = (provider: Provider) => {
    // For future expansion - maybe show provider details or associated plans?
    alert(t("viewingProvider", { name: provider.name }))
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
        data={providers}
        columns={columns}
        title={t("table.title")}
        searchPlaceholder={t("table.searchPlaceholder")}
        searchFields={["name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
        addButtonText={t("table.addButton")}
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("addDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t("form.name")}
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
                {t("form.category")}
              </Label>
              <div className="col-span-3">
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={t("form.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(v => v.is_active === true).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("form.logo")}</Label>
              <div className="col-span-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setLogoFile(file)
                    setLogoPreview(file ? URL.createObjectURL(file) : null)
                  }}
                />
                {logoPreview && (
                  <img src={logoPreview} alt={t("form.preview")} className="mt-2 h-12 w-12 object-contain rounded border" />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              { isLoading ? t("addDialog.adding") : t("addDialog.addProvider") }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("editDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                {t("form.name")}
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
                {t("form.category")}
              </Label>
              <div className="col-span-3">
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger className={errors.category_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={t("form.selectCategory")} />
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">{t("form.logo")}</Label>
              <div className="col-span-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setLogoFile(file)
                    setLogoPreview(file ? URL.createObjectURL(file) : null)
                  }}
                />
                {logoPreview && (
                  <img src={logoPreview} alt={t("form.preview")} className="mt-2 h-12 w-12 object-contain rounded border" />
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              { isLoading ? t("editDialog.saving") : t("editDialog.saveChanges") }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: providerToDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              { isLoading ? t("deleteDialog.deleting") : t("deleteDialog.delete") }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
