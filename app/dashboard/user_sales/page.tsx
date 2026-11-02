"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/ui/data-table"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import type { UserSales } from "@/app/api/modules/user_sales/user_sales.types"

const emptyForm = { first_name: "", last_name: "", sales: "0" }
type FormState = typeof emptyForm

const bySalesDesc = (a: UserSales, b: UserSales) =>
  b.sales - a.sales || a.last_name.localeCompare(b.last_name)

export default function UserSalesPage() {
  const t = useTranslations("UserSales")

  const [agents, setAgents] = useState<UserSales[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ tone: FeedbackAlertTone; title: string; description?: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [agentToDelete, setAgentToDelete] = useState<UserSales | null>(null)

  useEffect(() => {
    fetch("/api/user_sales")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setAgents)
      .catch((e) => setFeedback({ tone: "destructive", title: t("failedToLoad"), description: e.message }))
      .finally(() => setIsLoading(false))
  }, [])

  const fullName = (a: { first_name: string; last_name: string }) => `${a.first_name} ${a.last_name}`

  const validate = (withSales: boolean) => {
    const e: Record<string, string> = {}
    if (!formData.first_name.trim()) e.first_name = t("firstNameRequired")
    if (!formData.last_name.trim()) e.last_name = t("lastNameRequired")
    if (withSales) {
      const sales = Number(formData.sales)
      if (formData.sales.trim() === "" || !Number.isFinite(sales) || sales < 0) e.sales = t("salesInvalid")
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyForm)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const confirmAdd = async () => {
    if (!validate(false)) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/user_sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: formData.first_name, last_name: formData.last_name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("failedToCreate"))
      setAgents((prev) => [...prev, data].sort(bySalesDesc))
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: t("agentCreated"), description: fullName(data) })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToCreate"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (agent: UserSales) => {
    setFormData({ first_name: agent.first_name, last_name: agent.last_name, sales: String(agent.sales) })
    setEditingId(agent.id)
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const confirmEdit = async () => {
    if (!editingId || !validate(true)) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/user_sales/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          sales: Number(formData.sales),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("failedToUpdate"))
      setAgents((prev) => prev.map((a) => (a.id === data.id ? data : a)).sort(bySalesDesc))
      setIsEditDialogOpen(false)
      setFeedback({ tone: "success", title: t("agentUpdated"), description: fullName(data) })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToUpdate"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (agent: UserSales) => {
    setAgentToDelete(agent)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!agentToDelete) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/user_sales/${agentToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setAgents((prev) => prev.filter((a) => a.id !== agentToDelete.id))
      setIsDeleteDialogOpen(false)
      setFeedback({ tone: "success", title: t("agentDeleted"), description: fullName(agentToDelete) })
    } catch {
      setFeedback({ tone: "destructive", title: t("failedToDelete") })
    } finally {
      setIsLoading(false)
    }
  }

  const columns: Column<UserSales>[] = [
    {
      key: "first_name",
      label: t("columns.name"),
      render: (_, item) => <span className="font-medium text-foreground">{fullName(item)}</span>,
    },
    {
      key: "sales",
      label: t("columns.sales"),
      render: (v: number) => <span className="tabular-nums">{Number(v).toLocaleString("de-CH")}</span>,
    },
    {
      key: "created_at",
      label: t("columns.createdAt"),
      render: (v: string) => (
        <span className="text-muted-foreground text-sm">{new Date(v).toLocaleDateString("de-CH")}</span>
      ),
    },
  ]

  const nameFields = (
    <>
      <div className="flex flex-col gap-1">
        <Label>{t("form.firstName")}</Label>
        <Input
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          className={errors.first_name ? "border-red-500" : ""}
        />
        {errors.first_name && <p className="text-red-500 text-xs">{errors.first_name}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <Label>{t("form.lastName")}</Label>
        <Input
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          className={errors.last_name ? "border-red-500" : ""}
        />
        {errors.last_name && <p className="text-red-500 text-xs">{errors.last_name}</p>}
      </div>
    </>
  )

  return (
    <>
      {feedback && (
        <div className="mb-4">
          <FeedbackAlert
            tone={feedback.tone}
            title={feedback.title}
            description={feedback.description}
            onAutoDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      <DataTable
        data={agents}
        columns={columns}
        title={t("table.title")}
        searchPlaceholder={t("table.searchPlaceholder")}
        searchFields={["first_name", "last_name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        addButtonText={t("table.addButton")}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addDialog.title")}</DialogTitle>
            <DialogDescription>{t("addDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">{nameFields}</div>
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              {isLoading ? t("addDialog.adding") : t("addDialog.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
            <DialogDescription>{t("editDialog.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            {nameFields}
            <div className="flex flex-col gap-1">
              <Label>{t("form.sales")}</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={formData.sales}
                onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
                className={errors.sales ? "border-red-500" : ""}
              />
              {errors.sales && <p className="text-red-500 text-xs">{errors.sales}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              {isLoading ? t("editDialog.saving") : t("editDialog.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich("deleteDialog.description", {
                name: agentToDelete ? fullName(agentToDelete) : "",
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              {isLoading ? t("deleteDialog.deleting") : t("deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
