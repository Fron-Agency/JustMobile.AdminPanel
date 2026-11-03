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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTable, type Column } from "@/components/ui/data-table"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { createClient } from "@/utils/supabase/client"
import { distinctTeams, formatNumber, formatPeriod, formatTimestampDate } from "@/lib/sales-format"
import type { Agent } from "@/app/api/modules/agents/agents.types"
import {
  SALES_CATEGORIES,
  TARGET_CATEGORY,
  type AgentHistoryEntry,
} from "@/app/api/modules/agent_sales/agent_sales.types"

const emptyForm = { first_name: "", last_name: "", team: "" }
type FormState = typeof emptyForm

const byName = (a: Agent, b: Agent) =>
  a.first_name.localeCompare(b.first_name) || a.last_name.localeCompare(b.last_name)

// Replace by id, or append. Our own save and its realtime echo both land here,
// so whichever arrives second is a no-op instead of a duplicate row.
const upsertById = (list: Agent[], row: Agent) =>
  (list.some((a) => a.id === row.id) ? list.map((a) => (a.id === row.id ? row : a)) : [...list, row]).sort(byName)

const fullName = (a: { first_name: string; last_name: string }) => `${a.first_name} ${a.last_name}`

export default function AgentsPage() {
  const t = useTranslations("Agents")
  const tSales = useTranslations("AgentSales")

  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ tone: FeedbackAlertTone; title: string; description?: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)

  const [historyAgent, setHistoryAgent] = useState<Agent | null>(null)
  const [history, setHistory] = useState<AgentHistoryEntry[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    fetch("/api/agents")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setAgents)
      .catch((e) => setFeedback({ tone: "destructive", title: t("failedToLoad"), description: e.message }))
      .finally(() => setIsLoading(false))

    // Live updates from other admins / the database (Realtime is enabled on agents).
    const channel = supabase
      .channel("admin-agents")
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as Partial<Agent>).id
          if (id) setAgents((prev) => prev.filter((a) => a.id !== id))
        } else {
          setAgents((prev) => upsertById(prev, payload.new as Agent))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.first_name.trim()) e.first_name = t("firstNameRequired")
    if (!formData.last_name.trim()) e.last_name = t("lastNameRequired")
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyForm)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const confirmAdd = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("failedToCreate"))
      setAgents((prev) => upsertById(prev, data))
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: t("agentCreated"), description: fullName(data) })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToCreate"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (agent: Agent) => {
    setFormData({ first_name: agent.first_name, last_name: agent.last_name, team: agent.team ?? "" })
    setEditingId(agent.id)
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const confirmEdit = async () => {
    if (!editingId || !validate()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/agents/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("failedToUpdate"))
      setAgents((prev) => upsertById(prev, data))
      setIsEditDialogOpen(false)
      setFeedback({ tone: "success", title: t("agentUpdated"), description: fullName(data) })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToUpdate"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (agent: Agent) => {
    setAgentToDelete(agent)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!agentToDelete) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/agents/${agentToDelete.id}`, { method: "DELETE" })
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

  const handleViewHistory = async (agent: Agent) => {
    setHistoryAgent(agent)
    setHistory([])
    setIsHistoryLoading(true)
    try {
      const res = await fetch(`/api/agents/${agent.id}/sales`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("history.failedToLoad"))
      setHistory(data)
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("history.failedToLoad"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsHistoryLoading(false)
    }
  }

  const columns: Column<Agent>[] = [
    {
      key: "first_name",
      label: t("columns.name"),
      render: (_, item) => <span className="font-medium text-foreground">{fullName(item)}</span>,
    },
    {
      key: "team",
      label: t("columns.team"),
      render: (v: string | null) =>
        v ? (
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">{v}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "created_at",
      label: t("columns.createdAt"),
      render: (v: string) => <span className="text-muted-foreground text-sm">{formatTimestampDate(v)}</span>,
    },
  ]

  // Suggest existing team names so "A" isn't typed once as "A" and once as "Team A".
  const teamOptions = distinctTeams(agents)

  const formFields = (
    <div className="flex flex-col gap-4 py-2">
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
      <div className="flex flex-col gap-1">
        <Label>{t("form.team")}</Label>
        <Input
          list="agent-team-options"
          placeholder={t("form.teamPlaceholder")}
          value={formData.team}
          onChange={(e) => setFormData({ ...formData, team: e.target.value })}
        />
        <datalist id="agent-team-options">
          {teamOptions.map((team) => <option key={team} value={team} />)}
        </datalist>
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
        data={agents}
        columns={columns}
        title={t("table.title")}
        searchPlaceholder={t("table.searchPlaceholder")}
        searchFields={["first_name", "last_name", "team"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleViewHistory}
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

      <Dialog open={!!historyAgent} onOpenChange={(open) => !open && setHistoryAgent(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("history.title", { name: historyAgent ? fullName(historyAgent) : "" })}</DialogTitle>
            <DialogDescription>{t("history.description")}</DialogDescription>
          </DialogHeader>
          {isHistoryLoading ? (
            <p className="text-sm text-muted-foreground py-4">{t("history.loading")}</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("history.empty")}</p>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("history.target")}</TableHead>
                    <TableHead>{t("history.team")}</TableHead>
                    <TableHead>{t("history.period")}</TableHead>
                    {SALES_CATEGORIES.map((c) => (
                      <TableHead key={c} className="text-right">{tSales(`categories.${c}`)}</TableHead>
                    ))}
                    <TableHead className="text-right">{t("history.goal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.user_target_id}>
                      <TableCell className="font-medium">{h.target_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{h.team ?? t("history.allTeams")}</TableCell>
                      <TableCell className="text-muted-foreground">{formatPeriod(h.start_date, h.end_date)}</TableCell>
                      {SALES_CATEGORIES.map((c) => (
                        <TableCell
                          key={c}
                          className={`text-right tabular-nums ${
                            c === TARGET_CATEGORY && h.target > 0 && h[c] >= h.target
                              ? "text-green-600 dark:text-green-400 font-semibold"
                              : ""
                          }`}
                        >
                          {formatNumber(h[c])}
                        </TableCell>
                      ))}
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(h.target)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
