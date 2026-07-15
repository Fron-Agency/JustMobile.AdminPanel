"use client"

import { useEffect, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/ui/data-table"
import type { Partners } from "@/app/api/modules/partners/partners.type"
import { Button } from "@/components/ui/button"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const BUCKET = "partners-logo"

function getLogoUrl(fileUrl: string | null): string | null {
  if (!fileUrl) return null
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileUrl}`
}

const emptyPartner: Omit<Partners, "id" | "created_at"> = {
  name: "",
  file_url: null,
}

export default function PartnersPage() {
  const t = useTranslations("Partners")

  async function uploadLogo(file: File): Promise<string> {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/partners/logo", { method: "POST", body: fd })
    if (!res.ok) throw new Error(t("logoUploadFailed"))
    const { file_url } = await res.json()
    return file_url
  }

  const [partners, setPartners] = useState<Partners[]>([])
  const [editing, setEditing] = useState<Partners | null>(null)
  const [partnerToDelete, setPartnerToDelete] = useState<Partners | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyPartner)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = t("nameRequired")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyPartner)
    setLogoFile(null)
    setLogoPreview(null)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const handleEdit = (partner: Partners) => {
    setFeedback(null)
    setEditing(partner)
    setFormData({ name: partner.name, file_url: partner.file_url })
    setLogoFile(null)
    setLogoPreview(getLogoUrl(partner.file_url))
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const handleDelete = (partner: Partners) => {
    setPartnerToDelete(partner)
    setIsDeleteDialogOpen(true)
  }

  const columns: Column<Partners>[] = [
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
      key: "created_at",
      label: t("columns.created"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
      hidden: true,
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

      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, file_url }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotAddPartner"),
          description: errorText || t("requestFailed"),
        })
        return
      }

      const created = await res.json()
      setPartners((prev) => [created, ...prev])
      setIsAddDialogOpen(false)
      setFeedback({
        tone: "success",
        title: t("partnerAdded"),
        description: t("partnerCreatedDescription", { name: created.name }),
      })
    } finally {
      setIsLoading(false);
    }
  }

  const confirmEdit = async () => {
    if (!editing) return
    if (!validateForm()) return
    setIsLoading(true);

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

      const payload = {
        name: formData.name,
        ...(newFileUrl !== undefined && { file_url: newFileUrl }),
      }

      const res = await fetch(`/api/partners/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotUpdatePartner"),
          description: text || t("requestFailed"),
        })
        return
      }

      const updated = await res.json()
      setPartners((prev) => prev.map((p) => (p.id === editing.id ? updated : p)))
      setIsEditDialogOpen(false)
      setEditing(null)
      setFeedback({
        tone: "success",
        title: t("partnerUpdated"),
        description: t("partnerUpdatedDescription", { name: updated.name }),
      })
    } finally{
      setIsLoading(false);
    }
  }

  const confirmDelete = async () => {
    if (!partnerToDelete) return
    setIsLoading(true);

    try{
      const res = await fetch(`/api/partners/${partnerToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotDeletePartner"),
          description: errorText || t("requestFailed"),
        })
        return
      }

      const name = partnerToDelete.name
      setPartners((prev) => prev.filter((p) => p.id !== partnerToDelete.id))
      setIsDeleteDialogOpen(false)
      setPartnerToDelete(null)
      setFeedback({
        tone: "success",
        title: t("partnerDeleted"),
        description: t("partnerDeletedDescription", { name }),
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/partners")
      .then((res) => res.json())
      .then(setPartners)
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
        data={partners}
        columns={columns}
        title={t("table.title")}
        searchPlaceholder={t("table.searchPlaceholder")}
        searchFields={["name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        addButtonText={t("table.addButton")}
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addDialog.title")}</DialogTitle>
            <DialogDescription>{t("addDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">{t("form.name")}</Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
              { isLoading ? t("addDialog.adding") : t("addDialog.addPartner")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
            <DialogDescription>{t("editDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">{t("form.name")}</Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
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
              {t("deleteDialog.description", { name: partnerToDelete?.name ?? "" })}
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
