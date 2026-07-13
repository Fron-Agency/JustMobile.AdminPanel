"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Upload } from "lucide-react"
import type { Candidates, CandidateStatus, CandidateLanguage, CefrLevel } from "@/app/api/modules/candidates/candidates.types"
import { CANDIDATE_LANGUAGES, CANDIDATE_LANGUAGE_LABELS } from "@/app/api/modules/candidates/candidates.types"
import { parseOptimusCandidatesCsv, type ImportParseResult } from "./csv-import"

const STATUS_OPTIONS: CandidateStatus[] = ["new", "reviewed", "accepted", "rejected"]
const ALL_LANGUAGES_VALUE = "all"
const ALL_STATUSES_VALUE = "all"

const STATUS_LABELS: Record<CandidateStatus, string> = {
  new: "New",
  reviewed: "Reviewing",
  accepted: "Accepted",
  rejected: "Rejected",
}

const STATUS_BADGE_VARIANT: Record<CandidateStatus, "default" | "secondary" | "destructive" | "outline"> = {
  new: "secondary",
  reviewed: "outline",
  accepted: "default",
  rejected: "destructive",
}

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
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
  const [candidates, setCandidates] = useState<Candidates[]>([])
  const [viewing, setViewing] = useState<Candidates | null>(null)
  const [candidateToDelete, setCandidateToDelete] = useState<Candidates | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notesDraft, setNotesDraft] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [interviewDateDraft, setInterviewDateDraft] = useState("")
  const [isSavingInterviewDate, setIsSavingInterviewDate] = useState(false)
  const [languageFilter, setLanguageFilter] = useState<string>(ALL_LANGUAGES_VALUE)
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES_VALUE)
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
          title: "Could not update status",
          description: text || "Request failed",
        })
        return
      }

      const updated = await res.json()
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setViewing((prev) => (prev?.id === updated.id ? updated : prev))
      setFeedback({ tone: "success", title: "Status updated" })
    } finally {
      setSavingStatusId(null)
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
          title: "Could not save notes",
          description: text || "Request failed",
        })
        return
      }

      const updated = await res.json()
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setViewing((prev) => (prev?.id === updated.id ? updated : prev))
      setFeedback({ tone: "success", title: "Notes saved" })
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
          title: "Could not save interview date",
          description: text || "Request failed",
        })
        return
      }

      const updated = await res.json()
      setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      setViewing((prev) => (prev?.id === updated.id ? updated : prev))
      setFeedback({ tone: "success", title: "Interview date saved" })
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
          title: "Could not delete candidate",
          description: text || "Request failed",
        })
        return
      }

      setCandidates((prev) => prev.filter((c) => c.id !== candidateToDelete.id))
      setIsDeleteDialogOpen(false)
      setCandidateToDelete(null)
      setFeedback({ tone: "success", title: "Candidate deleted" })
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
        setImportError("No importable rows found — every row was missing a valid email or name.")
      }
    } catch {
      setImportError("Could not read this file. Make sure it's a valid CSV export.")
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
        setImportError(body.error || "Import failed.")
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
      setImportError("Import failed. Check your connection and try again.")
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

  const filteredCandidates =
    statusFilter === ALL_STATUSES_VALUE
      ? languageFilteredCandidates
      : languageFilteredCandidates.filter((c) => c.status === statusFilter)

  const columns: Column<Candidates>[] = useMemo(() => [
    {
      key: "firstname",
      label: "Name",
      render: (_value, item) => (
        <span className="font-medium text-foreground">
          {item.firstname} {item.lastname}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    {
      key: "phone_number",
      label: "Phone",
      render: (value: string) => <TruncatedCell value={value} maxWidth="120px" />,
    },
    {
      key: "city",
      label: "City",
      render: (value: string) => <TruncatedCell value={value} />,
    },
    {
      key: "date_of_birth",
      label: "Date of birth",
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
      hidden: true,
    },
    {
      key: "languages",
      label: "Languages",
      render: (value: Candidates["languages"]) => <LanguageBadges languages={value} />,
      hidden: true,
    },
    {
      key: "previous_role",
      label: "Previous role",
      render: (value: string) => <TruncatedCell value={value} />,
      hidden: true,
    },
    {
      key: "why_us",
      label: "Why us",
      render: (value: string) => <TruncatedCell value={value} />,
      hidden: true,
    },
    {
      key: "notes",
      label: "Notes",
      render: (value: string | null) => <TruncatedCell value={value} />,
      hidden: true,
    },
    {
      key: "status",
      label: "Status",
      render: (value: CandidateStatus, item) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={value}
            onValueChange={(status) => handleStatusChange(item.id, status as CandidateStatus)}
            disabled={savingStatusId === item.id}
          >
            <SelectTrigger size="sm" className="w-fit h-7 text-xs border-none shadow-none px-1 gap-1 bg-transparent hover:bg-muted/40">
              <Badge variant={STATUS_BADGE_VARIANT[value]}>{value}</Badge>
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      key: "created_at",
      label: "Applied",
      render: (value) => (
        <span className="text-muted-foreground text-sm">{formatAppliedDate(value)}</span>
      ),
      hidden: true,
    },
    {
      key: "interview_date",
      label: "Interview",
      render: (value: string | null) => (
        <span className="text-muted-foreground text-sm">{formatInterviewDate(value)}</span>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [savingStatusId])

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
          All <span className="font-semibold">{totalCount}</span>
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
            {STATUS_LABELS[status]} <span className="font-semibold">{statusCounts[status]}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Language</span>
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger size="sm" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_LANGUAGES_VALUE}>All languages</SelectItem>
              {CANDIDATE_LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {CANDIDATE_LANGUAGE_LABELS[lang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={openImportDialog}>
          <Upload className="w-4 h-4" />
          Import CSV
        </Button>
      </div>
      <DataTable
        data={filteredCandidates}
        columns={columns}
        title="Candidates"
        searchPlaceholder="Search candidates..."
        searchFields={["firstname", "lastname", "email", "city"]}
        onView={handleView}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewing ? `${viewing.firstname} ${viewing.lastname}` : "Candidate"}
            </DialogTitle>
            <DialogDescription>Candidate application details.</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="grid gap-3 py-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Email</span>
                <span className="col-span-2">{viewing.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Phone</span>
                <span className="col-span-2">{viewing.phone_number}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">City</span>
                <span className="col-span-2">{viewing.city}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Date of birth</span>
                <span className="col-span-2">{viewing.date_of_birth}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Languages</span>
                <div className="col-span-2">
                  <LanguageBadges languages={viewing.languages} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Previous role</span>
                <span className="col-span-2">{viewing.previous_role}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground">Why us</span>
                <span className="col-span-2">{viewing.why_us}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-muted-foreground">Status</span>
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
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-center">
                <span className="text-muted-foreground">Interview</span>
                <div className="col-span-2 flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={interviewDateDraft}
                    onChange={(e) => setInterviewDateDraft(e.target.value)}
                    className="w-full"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleSaveInterviewDate}
                    disabled={
                      isSavingInterviewDate ||
                      interviewDateDraft === toDatetimeLocalValue(viewing.interview_date)
                    }
                  >
                    {isSavingInterviewDate ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <span className="text-muted-foreground">Notes</span>
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Add internal notes about this candidate…"
                  rows={4}
                />
                <Button
                  size="sm"
                  className="w-fit justify-self-end"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes || notesDraft === (viewing.notes ?? "")}
                >
                  {isSavingNotes ? "Saving…" : "Save notes"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {candidateToDelete?.firstname}{" "}
              {candidateToDelete?.lastname}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import candidates from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV export (e.g. from Google Forms). Columns are matched by name, so
              header order or wording doesn&apos;t need to match exactly.
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
                title={`Imported ${importOutcome.imported} candidate${importOutcome.imported === 1 ? "" : "s"}`}
                description={
                  importOutcome.failed.length > 0
                    ? `${importOutcome.failed.length} row(s) could not be inserted.`
                    : undefined
                }
              />
              {importOutcome.failed.length > 0 && (
                <ScrollArea className="h-40 rounded-md border border-border p-2">
                  <div className="grid gap-1">
                    {importOutcome.failed.map((f) => (
                      <div key={f.row} className="text-xs text-muted-foreground">
                        Row {f.row + 2} ({f.email}): {f.error}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="grid gap-3 py-2 text-sm">
              {importError && (
                <FeedbackAlert tone="destructive" title="Import problem" description={importError} />
              )}

              {!parseResult ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importStage === "parsing"}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-10 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span>{importStage === "parsing" ? "Reading file…" : "Click to choose a .csv file"}</span>
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground">Ready to import</span>
                    <span className="col-span-2 font-medium text-foreground">
                      {parseResult.rows.length} candidate{parseResult.rows.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {parseResult.duplicates > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Merged duplicates</span>
                      <span className="col-span-2">{parseResult.duplicates} repeat application(s) by email</span>
                    </div>
                  )}
                  {parseResult.skipped.length > 0 && (
                    <div className="grid gap-1">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Skipped rows</span>
                        <span className="col-span-2">
                          {parseResult.skipped.length} row(s) missing a valid email or name
                        </span>
                      </div>
                      <ScrollArea className="h-24 rounded-md border border-border p-2">
                        <div className="grid gap-1">
                          {parseResult.skipped.map((s) => (
                            <div key={s.line} className="text-xs text-muted-foreground">
                              Row {s.line}: {s.reason}
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
                    Choose a different file
                  </Button>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              {importStage === "done" ? "Close" : "Cancel"}
            </Button>
            {importStage !== "done" && (
              <Button
                onClick={confirmImport}
                disabled={!parseResult || parseResult.rows.length === 0 || importStage === "uploading"}
              >
                {importStage === "uploading"
                  ? "Importing…"
                  : `Import ${parseResult?.rows.length ?? 0} candidate${parseResult?.rows.length === 1 ? "" : "s"}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
