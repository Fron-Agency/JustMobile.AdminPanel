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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { createClient } from "@/utils/supabase/client"
import type { UserTarget } from "@/app/api/modules/user_targets/user_targets.types"
import type { Agent } from "@/app/api/modules/agents/agents.types"
import { distinctTeams } from "@/lib/sales-format"
import { CalendarIcon, X } from "lucide-react"

const emptyForm = { target_name: "", team: "", target: "", start_date: "", end_date: "" }
type FormState = typeof emptyForm

const byStartDateDesc = (a: UserTarget, b: UserTarget) => b.start_date.localeCompare(a.start_date)

// Realtime payloads may carry `numeric` columns as strings; keep `target` a number.
const normalize = (row: UserTarget): UserTarget => ({ ...row, target: Number(row.target) })

// Replace by id, or append. Our own save and its realtime echo both land here,
// so whichever arrives second is a no-op instead of a duplicate row.
const upsertById = (list: UserTarget[], row: UserTarget) =>
  (list.some((x) => x.id === row.id) ? list.map((x) => (x.id === row.id ? row : x)) : [...list, row]).sort(
    byStartDateDesc
  )

const pad2 = (n: number) => String(n).padStart(2, "0")

// "YYYY-MM-DD" -> "DD/MM/YYYY" without going through Date (no time-zone shift).
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

const isoToLocalDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const localDateToIso = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

// Always shows dd/mm/yyyy; a native <input type="date"> follows the browser locale.
function DatePicker({
  value,
  onChange,
  placeholder,
  minDate,
  clearable = false,
  invalid = false,
}: {
  value: string
  onChange: (next: string) => void
  placeholder: string
  minDate?: string
  clearable?: boolean
  invalid?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={`flex-1 justify-start font-normal text-foreground ${invalid ? "border-red-500" : ""}`}
          >
            <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            {value ? formatDate(value) : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value ? isoToLocalDate(value) : undefined}
            defaultMonth={value ? isoToLocalDate(value) : minDate ? isoToLocalDate(minDate) : undefined}
            onSelect={(date: Date | undefined) => date && onChange(localDateToIso(date))}
            disabled={minDate ? { before: isoToLocalDate(minDate) } : undefined}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
      {clearable && value && (
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

export default function UserTargetsPage() {
  const t = useTranslations("UserTargets")

  const [targets, setTargets] = useState<UserTarget[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ tone: FeedbackAlertTone; title: string; description?: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [targetToDelete, setTargetToDelete] = useState<UserTarget | null>(null)
  // Agents are loaded only to suggest their team names in the team field.
  const [agents, setAgents] = useState<Agent[]>([])

  useEffect(() => {
    const supabase = createClient()

    fetch("/api/agents")
      .then((r) => (r.ok ? r.json() : []))
      .then(setAgents)
      .catch(() => {})

    fetch("/api/user_targets")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((rows: UserTarget[]) => setTargets(rows.map(normalize)))
      .catch((e) => setFeedback({ tone: "destructive", title: t("failedToLoad"), description: e.message }))
      .finally(() => setIsLoading(false))

    // Live updates from other admins / the database (Realtime is enabled on user_targets).
    const channel = supabase
      .channel("admin-user-targets")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_targets" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as Partial<UserTarget>).id
          if (id) setTargets((prev) => prev.filter((x) => x.id !== id))
        } else {
          setTargets((prev) => upsertById(prev, normalize(payload.new as UserTarget)))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const labelOf = (target: UserTarget) => target.target_name || formatDate(target.start_date)

  const validate = () => {
    const e: Record<string, string> = {}
    const value = Number(formData.target)
    if (formData.target.trim() === "" || !Number.isFinite(value) || value < 0) e.target = t("targetInvalid")
    if (!formData.start_date) e.start_date = t("startDateRequired")
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      e.end_date = t("endBeforeStart")
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const payload = () => ({
    target_name: formData.target_name.trim() || null,
    team: formData.team.trim() || null,
    target: Number(formData.target),
    start_date: formData.start_date,
    end_date: formData.end_date || null,
  })

  const handleAdd = () => {
    setFormData(emptyForm)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const confirmAdd = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/user_targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("failedToCreate"))
      setTargets((prev) => upsertById(prev, normalize(data)))
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: t("targetCreated"), description: labelOf(data) })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToCreate"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (target: UserTarget) => {
    setFormData({
      target_name: target.target_name ?? "",
      team: target.team ?? "",
      target: String(target.target),
      start_date: target.start_date,
      end_date: target.end_date ?? "",
    })
    setEditingId(target.id)
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const confirmEdit = async () => {
    if (!editingId || !validate()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/user_targets/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("failedToUpdate"))
      setTargets((prev) => upsertById(prev, normalize(data)))
      setIsEditDialogOpen(false)
      setFeedback({ tone: "success", title: t("targetUpdated"), description: labelOf(data) })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToUpdate"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (target: UserTarget) => {
    setTargetToDelete(target)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!targetToDelete) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/user_targets/${targetToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setTargets((prev) => prev.filter((x) => x.id !== targetToDelete.id))
      setIsDeleteDialogOpen(false)
      setFeedback({ tone: "success", title: t("targetDeleted"), description: labelOf(targetToDelete) })
    } catch {
      setFeedback({ tone: "destructive", title: t("failedToDelete") })
    } finally {
      setIsLoading(false)
    }
  }

  const columns: Column<UserTarget>[] = [
    {
      key: "target_name",
      label: t("columns.name"),
      render: (v: string | null) =>
        v ? <span className="font-medium text-foreground">{v}</span> : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "team",
      label: t("columns.team"),
      render: (v: string | null) =>
        v ? (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">{v}</span>
        ) : (
          <span className="text-muted-foreground text-sm">{t("allTeams")}</span>
        ),
    },
    {
      key: "target",
      label: t("columns.target"),
      render: (v: number) => <span className="tabular-nums">{Number(v).toLocaleString("de-CH")}</span>,
    },
    {
      key: "start_date",
      label: t("columns.startDate"),
      render: (v: string) => formatDate(v),
    },
    {
      key: "end_date",
      label: t("columns.endDate"),
      render: (v: string | null) =>
        v ? formatDate(v) : <span className="text-muted-foreground text-sm">{t("openEnded")}</span>,
    },
  ]

  const formFields = (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1">
        <Label>{t("form.name")}</Label>
        <Input
          placeholder={t("form.namePlaceholder")}
          value={formData.target_name}
          onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label>{t("form.team")}</Label>
        <Input
          list="target-team-options"
          placeholder={t("form.teamPlaceholder")}
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value })}
        />
        <datalist id="target-team-options">
          {distinctTeams(targets, agents).map((team) => <option key={team} value={team} />)}
        </datalist>
        <p className="text-xs text-muted-foreground">{t("form.teamHint")}</p>
      </div>
      <div className="flex flex-col gap-1">
        <Label>{t("form.target")}</Label>
        <Input
          type="number"
          min={0}
          step="any"
          value={formData.target}
          onChange={(e) => setFormData({ ...formData, target: e.target.value })}
          className={errors.target ? "border-red-500" : ""}
        />
        {errors.target && <p className="text-red-500 text-xs">{errors.target}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <Label>{t("form.startDate")}</Label>
          <DatePicker
            value={formData.start_date}
            onChange={(start_date) => setFormData({ ...formData, start_date })}
            placeholder={t("form.pickDate")}
            invalid={!!errors.start_date}
          />
          {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <Label>{t("form.endDate")}</Label>
          <DatePicker
            value={formData.end_date}
            onChange={(end_date) => setFormData({ ...formData, end_date })}
            placeholder={t("form.pickDate")}
            minDate={formData.start_date || undefined}
            clearable
            invalid={!!errors.end_date}
          />
          {errors.end_date && <p className="text-red-500 text-xs">{errors.end_date}</p>}
        </div>
      </div>
    </div>
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
        data={targets}
        columns={columns}
        title={t("table.title")}
        searchPlaceholder={t("table.searchPlaceholder")}
        searchFields={["target_name", "team"]}
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
          {formFields}
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
          {formFields}
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
                name: targetToDelete ? labelOf(targetToDelete) : "",
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
