"use client"

import { useEffect, useState } from "react"
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
import type { Candidates, CandidateStatus, CandidateLanguage, CefrLevel } from "@/app/api/modules/candidates/candidates.types"

const STATUS_OPTIONS: CandidateStatus[] = ["new", "reviewed", "accepted", "rejected"]

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
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

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
    setIsViewDialogOpen(true)
  }

  const handleDelete = (candidate: Candidates) => {
    setCandidateToDelete(candidate)
    setIsDeleteDialogOpen(true)
  }

  const handleStatusChange = async (status: CandidateStatus) => {
    if (!viewing) return
    setIsSavingStatus(true)

    try {
      const res = await fetch(`/api/candidates/${viewing.id}`, {
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
      setViewing(updated)
      setFeedback({ tone: "success", title: "Status updated" })
    } finally {
      setIsSavingStatus(false)
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

  const columns: Column<Candidates>[] = [
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
    { key: "phone_number", label: "Phone" },
    { key: "city", label: "City" },
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
      render: (value) => <span className="text-muted-foreground text-sm">{value || "—"}</span>,
      hidden: true,
    },
    {
      key: "why_us",
      label: "Why us",
      render: (value: string) => (
        <span className="text-muted-foreground text-sm block max-w-xs truncate" title={value}>
          {value || "—"}
        </span>
      ),
      hidden: true,
    },
    {
      key: "status",
      label: "Status",
      render: (value: CandidateStatus) => (
        <Badge variant={STATUS_BADGE_VARIANT[value]}>{value}</Badge>
      ),
    },
    {
      key: "created_at",
      label: "Applied",
      render: (value) => (
        <span className="text-muted-foreground text-sm">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
      hidden: true,
    },
  ]

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
        data={candidates}
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
                    onValueChange={(value) => handleStatusChange(value as CandidateStatus)}
                    disabled={isSavingStatus}
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
    </>
  )
}
