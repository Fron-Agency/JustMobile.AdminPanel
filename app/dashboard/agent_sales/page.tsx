"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { createClient } from "@/utils/supabase/client"
import { findActiveTarget, formatNumber, formatPeriod } from "@/lib/sales-format"
import type { UserTarget } from "@/app/api/modules/user_targets/user_targets.types"
import type { TargetBoard } from "@/app/api/modules/agent_sales/agent_sales.types"

// Unsaved input per agent id, kept as the raw input string.
type Drafts = Record<string, string>

const parseSales = (raw: string): number | null => {
  if (raw.trim() === "") return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// e.g. "November 2026 · Team A"; targets without a team show just the name.
const targetLabel = (target: UserTarget) => {
  const name = target.target_name ?? formatPeriod(target.start_date, target.end_date)
  return target.team ? `${name} · ${target.team}` : name
}

export default function AgentSalesPage() {
  const t = useTranslations("AgentSales")

  const [targets, setTargets] = useState<UserTarget[]>([])
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null)
  const [board, setBoard] = useState<TargetBoard | null>(null)
  const [drafts, setDrafts] = useState<Drafts>({})
  const [isLoadingTargets, setIsLoadingTargets] = useState(true)
  const [isLoadingBoard, setIsLoadingBoard] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: FeedbackAlertTone; title: string; description?: string } | null>(null)

  // Realtime callbacks are registered once; read the current selection through a ref.
  const selectedTargetIdRef = useRef<string | null>(null)
  selectedTargetIdRef.current = selectedTargetId

  const loadTargets = useCallback(async () => {
    const res = await fetch("/api/user_targets")
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows: UserTarget[] = await res.json()
    setTargets(rows)
    // Keep the current selection if it still exists, otherwise prefer today's target.
    setSelectedTargetId((current) =>
      current && rows.some((r) => r.id === current) ? current : (findActiveTarget(rows) ?? rows[0])?.id ?? null
    )
  }, [])

  const loadBoard = useCallback(async (targetId: string) => {
    const res = await fetch(`/api/user_targets/${targetId}/sales`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? `HTTP ${res.status}`)
    // Ignore a response for a target the user has already switched away from.
    if (selectedTargetIdRef.current === targetId) setBoard(data)
  }, [])

  useEffect(() => {
    loadTargets()
      .catch((e) => setFeedback({ tone: "destructive", title: t("failedToLoadTargets"), description: e.message }))
      .finally(() => setIsLoadingTargets(false))
  }, [loadTargets])

  useEffect(() => {
    setBoard(null)
    setDrafts({})
    if (!selectedTargetId) return
    setIsLoadingBoard(true)
    loadBoard(selectedTargetId)
      .catch((e) => setFeedback({ tone: "destructive", title: t("failedToLoadBoard"), description: e.message }))
      .finally(() => setIsLoadingBoard(false))
  }, [selectedTargetId, loadBoard])

  // Live updates: any change to sales, agents or targets refreshes the board.
  // Unsaved drafts are kept, so a refresh never overwrites what is being typed.
  // Refreshes are coalesced because one bulk save emits one event per row.
  useEffect(() => {
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | undefined

    const scheduleRefresh = (includeTargets: boolean) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (includeTargets) loadTargets().catch(() => {})
        const id = selectedTargetIdRef.current
        if (id) loadBoard(id).catch(() => {})
      }, 300)
    }

    const channel = supabase
      .channel("admin-agent-sales")
      .on("postgres_changes", { event: "*", schema: "public", table: "agent_sales" }, () => scheduleRefresh(false))
      .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, () => scheduleRefresh(false))
      .on("postgres_changes", { event: "*", schema: "public", table: "user_targets" }, () => scheduleRefresh(true))
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [loadTargets, loadBoard])

  const dirtyIds = useMemo(
    () =>
      Object.keys(drafts).filter((agentId) => {
        const saved = board?.agents.find((a) => a.agent_id === agentId)?.sales
        return parseSales(drafts[agentId]) !== saved
      }),
    [drafts, board]
  )
  const invalidIds = dirtyIds.filter((id) => parseSales(drafts[id]) === null)
  const hasChanges = dirtyIds.length > 0

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!hasChanges) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [hasChanges])

  const handleTargetChange = (id: string) => {
    if (hasChanges && !window.confirm(t("discardConfirm"))) return
    setSelectedTargetId(id)
  }

  const save = async () => {
    if (!selectedTargetId || !hasChanges || invalidIds.length > 0) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/user_targets/${selectedTargetId}/sales`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: dirtyIds.map((agent_id) => ({ agent_id, sales: parseSales(drafts[agent_id]) })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? t("failedToSave"))
      setBoard(data)
      setDrafts({})
      setFeedback({ tone: "success", title: t("saved"), description: t("savedCount", { count: dirtyIds.length }) })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToSave"), description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsSaving(false)
    }
  }

  const target = board?.target
  const rows = (board?.agents ?? []).map((entry) => {
    const draft = drafts[entry.agent_id]
    const value = draft !== undefined ? parseSales(draft) ?? entry.sales : entry.sales
    return { ...entry, input: draft ?? String(entry.sales), value }
  })
  const total = rows.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="flex flex-col gap-4">
      {feedback && (
        <FeedbackAlert
          tone={feedback.tone}
          title={feedback.title}
          description={feedback.description}
          onAutoDismiss={() => setFeedback(null)}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selectedTargetId ?? undefined} onValueChange={handleTargetChange} disabled={targets.length === 0}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder={t("selectTarget")} />
            </SelectTrigger>
            <SelectContent>
              {targets.map((tg) => (
                <SelectItem key={tg.id} value={tg.id}>
                  {targetLabel(tg)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setDrafts({})} disabled={!hasChanges || isSaving}>
            {t("discard")}
          </Button>
          <Button onClick={save} disabled={!hasChanges || invalidIds.length > 0 || isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </div>
      </div>

      {target && (
        <div className="rounded-lg border bg-card p-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">{t("team")}: </span>
            <span className="font-medium">{target.team ?? t("allTeams")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("period")}: </span>
            <span className="font-medium">{formatPeriod(target.start_date, target.end_date)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("targetPerAgent")}: </span>
            <span className="font-medium tabular-nums">{formatNumber(target.target)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("reached")}: </span>
            <span className="font-medium tabular-nums">
              {rows.filter((r) => r.value >= target.target).length} / {rows.length}
            </span>
          </div>
        </div>
      )}

      {isLoadingTargets || isLoadingBoard ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : targets.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {t("noTargets")}{" "}
          <Link href="/dashboard/user_targets" className="text-primary underline">{t("createTarget")}</Link>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          {target?.team ? t("noAgentsInTeam", { team: target.team }) : t("noAgents")}{" "}
          <Link href="/dashboard/agents" className="text-primary underline">{t("createAgent")}</Link>
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>{t("columns.agent")}</TableHead>
                <TableHead>{t("columns.team")}</TableHead>
                <TableHead className="w-36">{t("columns.sales")}</TableHead>
                <TableHead className="min-w-40">{t("columns.progress")}</TableHead>
                <TableHead className="text-right">{t("columns.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const goal = target?.target ?? 0
                const reached = goal > 0 && row.value >= goal
                const percent = goal > 0 ? Math.min(100, (row.value / goal) * 100) : 0
                const isDirty = dirtyIds.includes(row.agent_id)
                const isInvalid = invalidIds.includes(row.agent_id)
                return (
                  <TableRow key={row.agent_id}>
                    <TableCell className="text-muted-foreground tabular-nums">{index + 1}</TableCell>
                    <TableCell className="font-medium">{row.first_name} {row.last_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.team ?? "—"}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={row.input}
                        onChange={(e) => setDrafts((d) => ({ ...d, [row.agent_id]: e.target.value }))}
                        className={`h-8 tabular-nums ${isInvalid ? "border-red-500" : isDirty ? "border-primary" : ""}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Progress
                        value={percent}
                        className={reached ? "[&_[data-slot=progress-indicator]]:bg-green-500" : ""}
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {reached ? (
                        <span className="font-semibold text-green-600 dark:text-green-400">{t("statusReached")}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("statusRemaining", { count: formatNumber(Math.max(0, goal - row.value)) })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell />
                <TableCell className="font-semibold">{t("total")}</TableCell>
                <TableCell />
                <TableCell className="font-semibold tabular-nums">{formatNumber(total)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  )
}
