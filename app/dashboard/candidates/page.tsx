"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Upload, CalendarIcon, Star } from "lucide-react"
import type { Candidates, CandidateStatus, CandidateLanguage, CefrLevel } from "@/app/api/modules/candidates/candidates.types"
import { CANDIDATE_LANGUAGES, CANDIDATE_STATUSES, CANDIDATE_STATUS_COLORS } from "@/app/api/modules/candidates/candidates.types"
import { parseOptimusCandidatesCsv, type ImportParseResult } from "./csv-import"

const STATUS_OPTIONS: CandidateStatus[] = [...CANDIDATE_STATUSES]
const ALL_LANGUAGES_VALUE = "all"
const ALL_STATUSES_VALUE = "all"

// Short 2-letter code for compact table badges, e.g. "DE C1".
const LANGUAGE_CODES: Record<CandidateLanguage, string> = {
  german: "DE",
  french: "FR",
  italian: "IT",
  serboCroatian: "SR/HR",
  turkish: "TR",
  spanish: "ES",
  english: "EN",
}

// created_at is a plain `date` column (e.g. "2025-01-28") — format from the
// string directly rather than via `new Date(...)`, which would parse it as UTC
// midnight and can roll it back a day once .toLocaleDateString() applies the
// browser's local timezone.
function formatAppliedDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value || "—"
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}

// interview_date is a `timestamptz` — display in the browser's local time, as dd/mm/yyyy.
function formatInterviewDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  const pad = (n: number) => String(n).padStart(2, "0")
  const dateStr = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
  const timeStr = `${pad(date.getHours())}:${pad(date.getMinutes())}`
  return `${dateStr} ${timeStr}`
}

// <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time, with no
// timezone suffix — new Date(iso).toISOString() would shift back to UTC.
function toDatetimeLocalValue(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

type CandidatesT = ReturnType<typeof useTranslations<"Candidates">>

// Custom date + hour + minute picker over the same "YYYY-MM-DDTHH:mm" draft
// value used by the datetime-local input this replaces — kept so the save
// logic elsewhere doesn't need to change. Built from separate controls
// (rather than <input type="datetime-local">) so the date always renders as
// dd/mm/yyyy and the time is always a plain 24-hour 00–23 dropdown, since the
// native input's display format is locale-dependent and not fully overridable.
function InterviewDateTimePicker({
  value,
  onChange,
  t,
}: {
  value: string
  onChange: (next: string) => void
  t: CandidatesT
}) {
  const [year, month, day] = value ? value.split("T")[0].split("-") : ["", "", ""]
  const [hour, minute] = value ? value.split("T")[1].split(":") : ["", ""]
  const selectedDate = value ? new Date(`${value}:00`) : undefined

  const setDatePart = (date: Date) => {
    const datePart = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
    onChange(`${datePart}T${hour || "09"}:${minute || "00"}`)
  }

  const setTimePart = (nextHour: string, nextMinute: string) => {
    if (!year) return
    onChange(`${year}-${month}-${day}T${nextHour}:${nextMinute}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex-1 justify-start font-normal text-foreground"
          >
            <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
            {year ? `${day}/${month}/${year}` : t("viewDialog.pickDate")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date: Date | undefined) => date && setDatePart(date)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      <Select value={hour || undefined} onValueChange={(h) => setTimePart(h, minute || "00")} disabled={!year}>
        <SelectTrigger className="w-[72px]">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={minute || undefined} onValueChange={(m) => setTimePart(hour || "09", m)} disabled={!year}>
        <SelectTrigger className="w-[72px]">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Truncated table cell that reveals the full text in a tooltip on hover,
// so long free-text answers (previous role, why-us, notes) don't blow out
// row height or column width.
function TruncatedCell({
  value,
  maxWidth = "160px",
}: {
  value: string | null | undefined
  maxWidth?: string
}) {
  const text = value?.trim()
  if (!text) return <span className="text-muted-foreground">—</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="text-muted-foreground text-xs block truncate cursor-default"
          style={{ maxWidth }}
        >
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-pre-wrap text-left">{text}</TooltipContent>
    </Tooltip>
  )
}

function LanguageBadges({ languages }: { languages: Partial<Record<CandidateLanguage, CefrLevel>> }) {
  const entries = Object.entries(languages ?? {}) as [CandidateLanguage, CefrLevel][]
  if (entries.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([lang, level]) => (
        <Badge key={lang} variant="outline" className="text-[10px] font-normal">
          {LANGUAGE_CODES[lang]} {level}
        </Badge>
      ))}
    </div>
  )
}

export default function CandidatesPage() {
  const t = useTranslations("Candidates")

  const [candidates, setCandidates] = useState<Candidates[]>([])
  const [viewing, setViewing] = useState<Candidates | null>(null)
  const [candidateToDelete, setCandidateToDelete] = useState<Candidates | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null)
  const [savingFavoriteId, setSavingFavoriteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notesDraft, setNotesDraft] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [interviewDateDraft, setInterviewDateDraft] = useState("")
  const [isSavingInterviewDate, setIsSavingInterviewDate] = useState(false)
  const [languageFilter, setLanguageFilter] = useState<string>(ALL_LANGUAGES_VALUE)
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES_VALUE)
  const [favoriteFilter, setFavoriteFilter] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importStage, setImportStage] = useState<"idle" | "parsing" | "uploading" | "done">("idle")
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null)
  const [importOutcome, setImportOutcome] = useState<{
    imported: number
    failed: Array<{ row: number; email: string; error: string }>
  } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/candidates")
      .then((res) => res.json())
      .then(setCandidates)
      .finally(() => setIsLoading(false))
  }, [])

  const handleView = (candidate: Candidates) => {
    setFeedback(null)
    setViewing(candidate)
    setNotesDraft(candidate.notes ?? "")
    setInterviewDateDraft(toDatetimeLocalValue(candidate.interview_date))
    setIsViewDialogOpen(true)
  }

  const handleDelete = (candidate: Candidates) => {
    setCandidateToDelete(candidate)
    setIsDeleteDialogOpen(true)
  }

  const handleStatusChange = async (candidateId: string, status: CandidateStatus) => {
    setSavingStatusId(candidateId)

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotUpdateStatus"),
          description: text || t("requestFailed"),
        })
        return
      }

      const updated = await res.json()
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setViewing((prev) => (prev?.id === updated.id ? updated : prev))
      setFeedback({ tone: "success", title: t("statusUpdated") })
    } finally {
      setSavingStatusId(null)
    }
  }

  const handleToggleFavorite = async (candidateId: string, isFavorite: boolean) => {
    setSavingFavoriteId(candidateId)

    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: isFavorite }),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotUpdateFavorite"),
          description: text || t("requestFailed"),
        })
        return
      }

      const updated = await res.json()
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setViewing((prev) => (prev?.id === updated.id ? updated : prev))
    } finally {
      setSavingFavoriteId(null)
    }
  }

  const handleSaveNotes = async () => {
    if (!viewing) return
    setIsSavingNotes(true)

    try {
      const res = await fetch(`/api/candidates/${viewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesDraft.trim() || null }),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotSaveNotes"),
          description: text || t("requestFailed"),
        })
        return
      }

      const updated = await res.json()
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setViewing((prev) => (prev?.id === updated.id ? updated : prev))
      setFeedback({ tone: "success", title: t("notesSaved") })
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleSaveInterviewDate = async () => {
    if (!viewing) return
    setIsSavingInterviewDate(true)

    try {
      const res = await fetch(`/api/candidates/${viewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_date: interviewDateDraft ? new Date(interviewDateDraft).toISOString() : null,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotSaveInterviewDate"),
          description: text || t("requestFailed"),
        })
        return
      }

      const updated = await res.json()
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setViewing((prev) => (prev?.id === updated.id ? updated : prev))
      setFeedback({ tone: "success", title: t("interviewDateSaved") })
    } finally {
      setIsSavingInterviewDate(false)
    }
  }

  const confirmDelete = async () => {
    if (!candidateToDelete) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/candidates/${candidateToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const text = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotDeleteCandidate"),
          description: text || t("requestFailed"),
        })
        return
      }

      setCandidates((prev) => prev.filter((c) => c.id !== candidateToDelete.id))
      setIsDeleteDialogOpen(false)
      setCandidateToDelete(null)
      setFeedback({ tone: "success", title: t("candidateDeleted") })
    } finally {
      setIsDeleting(false)
    }
  }

  const openImportDialog = () => {
    setImportStage("idle")
    setParseResult(null)
    setImportOutcome(null)
    setImportError(null)
    setIsImportDialogOpen(true)
  }

  const handleFilePicked = async (file: File) => {
    setImportError(null)
    setImportOutcome(null)
    setImportStage("parsing")

    try {
      const text = await file.text()
      const result = parseOptimusCandidatesCsv(text)
      setParseResult(result)
      setImportStage("idle")
      if (result.rows.length === 0) {
        setImportError(t("noImportableRows"))
      }
    } catch {
      setImportError(t("couldNotReadFile"))
      setImportStage("idle")
    }
  }

  const confirmImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) return
    setImportStage("uploading")
    setImportError(null)

    try {
      const res = await fetch("/api/candidates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parseResult.rows }),
      })

      const body = await res.json()
      if (!res.ok || !body.ok) {
        setImportError(body.error || t("importFailed"))
        setImportStage("idle")
        return
      }

      setImportOutcome({ imported: body.imported, failed: body.failed ?? [] })
      setImportStage("done")

      setIsLoading(true)
      fetch("/api/candidates")
        .then((r) => r.json())
        .then(setCandidates)
        .finally(() => setIsLoading(false))
    } catch {
      setImportError(t("importFailedRetry"))
      setImportStage("idle")
    }
  }

  const languageFilteredCandidates =
    languageFilter === ALL_LANGUAGES_VALUE
      ? candidates
      : candidates.filter((c) => Boolean(c.languages?.[languageFilter as CandidateLanguage]))

  const statusCounts = STATUS_OPTIONS.reduce(
    (acc, status) => {
      acc[status] = languageFilteredCandidates.filter((c) => c.status === status).length
      return acc
    },
    {} as Record<CandidateStatus, number>
  )
  const totalCount = languageFilteredCandidates.length

  const statusFilteredCandidates =
    statusFilter === ALL_STATUSES_VALUE
      ? languageFilteredCandidates
      : languageFilteredCandidates.filter((c) => c.status === statusFilter)

  const filteredCandidates = favoriteFilter
    ? statusFilteredCandidates.filter((c) => c.is_favorite)
    : statusFilteredCandidates

  const columns: Column<Candidates>[] = useMemo(() => [
    {
      key: "is_favorite",
      label: t("columns.favorite"),
      render: (value: boolean | null, item) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleToggleFavorite(item.id, !value)
          }}
          disabled={savingFavoriteId === item.id}
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          aria-label={t(value ? "unmarkFavorite" : "markFavorite")}
        >
          <Star className={`w-4 h-4 ${value ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </button>
      ),
    },
    {
      key: "firstname",
      label: t("columns.name"),
      render: (_value, item) => (
        <span className="font-medium text-foreground">
          {item.firstname} {item.lastname}
        </span>
      ),
    },
    { key: "email", label: t("columns.email") },
    {
      key: "phone_number",
      label: t("columns.phone"),
      render: (value: string) => <TruncatedCell value={value} maxWidth="120px" />,
    },
    {
      key: "city",
      label: t("columns.city"),
      render: (value: string) => <TruncatedCell value={value} />,
    },
    {
      key: "date_of_birth",
      label: t("columns.dateOfBirth"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
      hidden: true,
    },
    {
      key: "languages",
      label: t("columns.languages"),
      render: (value: Candidates["languages"]) => <LanguageBadges languages={value} />,
      hidden: true,
    },
    {
      key: "previous_role",
      label: t("columns.previousRole"),
      render: (value: string) => <TruncatedCell value={value} />,
      hidden: true,
    },
    {
      key: "why_us",
      label: t("columns.whyUs"),
      render: (value: string) => <TruncatedCell value={value} />,
      hidden: true,
    },
    {
      key: "notes",
      label: t("columns.notes"),
      render: (value: string | null) => <TruncatedCell value={value} />,
      hidden: true,
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (value: CandidateStatus, item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={value}
            onValueChange={(status) => handleStatusChange(item.id, status as CandidateStatus)}
            disabled={savingStatusId === item.id}
          >
            <SelectTrigger size="sm" className="w-fit h-7 text-xs border-none shadow-none px-1 gap-1 bg-transparent hover:bg-muted/40">
              <Badge variant="outline" className={CANDIDATE_STATUS_COLORS[value]}>{t(`status.${value}`)}</Badge>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <Badge variant="outline" className={CANDIDATE_STATUS_COLORS[status]}>{t(`status.${status}`)}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "created_at",
      label: t("columns.applied"),
      render: (value) => (
        <span className="text-muted-foreground text-sm">{formatAppliedDate(value)}</span>
      ),
      hidden: true,
    },
    {
      key: "interview_date",
      label: t("columns.interview"),
      render: (value: string | null) => (
        <span className="text-muted-foreground text-sm">{formatInterviewDate(value)}</span>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [savingStatusId, savingFavoriteId])

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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter(ALL_STATUSES_VALUE)}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            statusFilter === ALL_STATUSES_VALUE
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
          }`}
        >
          {t("all")} <span className="font-semibold">{totalCount}</span>
        </button>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            }`}
          >
            {t(`status.${status}`)} <span className="font-semibold">{statusCounts[status]}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("language")}</span>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger size="sm" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LANGUAGES_VALUE}>{t("allLanguages")}</SelectItem>
              {CANDIDATE_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {t(`languages.${lang}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={favoriteFilter ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setFavoriteFilter((prev) => !prev)}
          >
            <Star className={`w-4 h-4 ${favoriteFilter ? "fill-current" : ""}`} />
            {t("favoritesOnly")}
          </Button>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={openImportDialog}>
          <Upload className="w-4 h-4" />
          {t("importCsv")}
        </Button>
      </div>
      <DataTable
        data={filteredCandidates}
        columns={columns}
        title={t("table.title")}
        searchPlaceholder={t("table.searchPlaceholder")}
        searchFields={["firstname", "lastname", "email", "city"]}
        onView={handleView}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewing ? `${viewing.firstname} ${viewing.lastname}` : t("viewDialog.defaultTitle")}
              {viewing && (
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(viewing.id, !viewing.is_favorite)}
                  disabled={savingFavoriteId === viewing.id}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label={t(viewing.is_favorite ? "unmarkFavorite" : "markFavorite")}
                >
                  <Star className={`w-4 h-4 ${viewing.is_favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </button>
              )}
            </DialogTitle>
            <DialogDescription>{t("viewDialog.description")}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("viewDialog.email")}</span>
                <span className="col-span-2">{viewing.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("viewDialog.phone")}</span>
                <span className="col-span-2">{viewing.phone_number}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("viewDialog.city")}</span>
                <span className="col-span-2">{viewing.city}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("viewDialog.dateOfBirth")}</span>
                <span className="col-span-2">{viewing.date_of_birth}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("viewDialog.languages")}</span>
                <div className="col-span-2">
                  <LanguageBadges languages={viewing.languages} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("viewDialog.previousRole")}</span>
                <span className="col-span-2">{viewing.previous_role}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">{t("viewDialog.whyUs")}</span>
                <span className="col-span-2">{viewing.why_us}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-muted-foreground">{t("viewDialog.status")}</span>
                <div className="col-span-2">
                  <Select
                    value={viewing.status}
                    onValueChange={(value) => handleStatusChange(viewing.id, value as CandidateStatus)}
                    disabled={savingStatusId === viewing.id}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          <Badge variant="outline" className={CANDIDATE_STATUS_COLORS[status]}>{t(`status.${status}`)}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <span className="text-muted-foreground">{t("viewDialog.interview")}</span>
                <InterviewDateTimePicker value={interviewDateDraft} onChange={setInterviewDateDraft} t={t} />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-fit justify-self-end"
                  onClick={handleSaveInterviewDate}
                  disabled={
                    isSavingInterviewDate ||
                    interviewDateDraft === toDatetimeLocalValue(viewing.interview_date)
                  }
                >
                  {isSavingInterviewDate ? t("viewDialog.saving") : t("viewDialog.save")}
                </Button>
              </div>
              <div className="grid gap-2">
                <span className="text-muted-foreground">{t("viewDialog.notes")}</span>
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder={t("viewDialog.notesPlaceholder")}
                  rows={4}
                />
                <Button
                  size="sm"
                  className="w-fit justify-self-end"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || notesDraft === (viewing.notes ?? "")}
                >
                  {isSavingNotes ? t("viewDialog.saving") : t("viewDialog.saveNotes")}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t("viewDialog.close")}
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
              {t("deleteDialog.description", {
                name: `${candidateToDelete?.firstname ?? ""} ${candidateToDelete?.lastname ?? ""}`.trim(),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("importDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("importDialog.description")}
            </DialogDescription>
          </DialogHeader>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFilePicked(file)
              e.target.value = ""
            }}
          />

          {importStage === "done" && importOutcome ? (
            <div className="grid gap-3 py-2 text-sm">
              <FeedbackAlert
                tone={importOutcome.failed.length > 0 ? "default" : "success"}
                title={t("importDialog.importedCount", { count: importOutcome.imported })}
                description={
                  importOutcome.failed.length > 0
                    ? t("importDialog.rowsCouldNotBeInserted", { count: importOutcome.failed.length })
                    : undefined
                }
              />
              {importOutcome.failed.length > 0 && (
                <ScrollArea className="h-40 rounded-md border border-border p-2">
                  <div className="grid gap-1">
                    {importOutcome.failed.map((f) => (
                      <div key={f.row} className="text-xs text-muted-foreground">
                        {t("importDialog.rowLine", { line: f.row + 2, reason: `(${f.email}): ${f.error}` })}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="grid gap-3 py-2 text-sm">
              {importError && (
                <FeedbackAlert tone="destructive" title={t("importDialog.importProblem")} description={importError} />
              )}

              {!parseResult ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importStage === "parsing"}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span>{importStage === "parsing" ? t("importDialog.readingFile") : t("importDialog.clickToChoose")}</span>
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">{t("importDialog.readyToImport")}</span>
                    <span className="col-span-2 font-medium text-foreground">
                      {t("importDialog.candidatesCount", { count: parseResult.rows.length })}
                    </span>
                  </div>
                  {parseResult.duplicates > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">{t("importDialog.mergedDuplicates")}</span>
                      <span className="col-span-2">{t("importDialog.duplicatesDescription", { count: parseResult.duplicates })}</span>
                    </div>
                  )}
                  {parseResult.skipped.length > 0 && (
                    <div className="grid gap-1">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">{t("importDialog.skippedRows")}</span>
                        <span className="col-span-2">
                          {t("importDialog.skippedRowsDescription", { count: parseResult.skipped.length })}
                        </span>
                      </div>
                      <ScrollArea className="h-24 rounded-md border border-border p-2">
                        <div className="grid gap-1">
                          {parseResult.skipped.map((s) => (
                            <div key={s.line} className="text-xs text-muted-foreground">
                              {t("importDialog.rowLine", { line: s.line, reason: s.reason })}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("importDialog.chooseDifferentFile")}
                  </Button>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              {importStage === "done" ? t("importDialog.close") : t("importDialog.cancel")}
            </Button>
            {importStage !== "done" && (
              <Button
                onClick={confirmImport}
                disabled={!parseResult || parseResult.rows.length === 0 || importStage === "uploading"}
              >
                {importStage === "uploading"
                  ? t("importDialog.importing")
                  : t("importDialog.importButton", { count: parseResult?.rows.length ?? 0 })}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
