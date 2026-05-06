"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Lead, Document } from "@/app/api/modules/leads/leads.type"
import type { Plan } from "@/app/api/modules/plans/plans.type"
import type { User } from "@/app/api/modules/users/users.type"
import { Mail, Loader2, FileText } from "lucide-react"

const statusConfig: Record<Lead["status"], { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary border-primary/20" },
  sent: { label: "Sent", className: "bg-primary/80 text-white border-primary/90" },
  contacted: { label: "Contacted", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  converted: { label: "Converted", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  lost: { label: "Lost", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const [docsLead, setDocsLead] = useState<Lead | null>(null)
  const [isDocsDialogOpen, setIsDocsDialogOpen] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)

  const [emailLead, setEmailLead] = useState<Lead | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [emailMessage, setEmailMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const columns: Column<Lead>[] = [
    {
      key: "fullname",
      label: "Name",
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
      key: "email",
      label: "Email",
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "phone",
      label: "Phone",
      render: (value) => (
        <span className="text-muted-foreground text-sm">{value ?? "—"}</span>
      ),
    },
    {
      key: "plan_id",
      label: "Plan",
      render: (value) => {
        const plan = plans.find((p) => p.id === value)
        return <span className="text-muted-foreground text-sm">{plan?.name ?? "—"}</span>
      },
    },
    {
      key: "address",
      label: "Address",
      render: (_value, item) => {
        const address = Array.isArray(item.address) ? item.address[0] : item.address
        if (!address) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <span className="text-muted-foreground text-sm">
            {[address.street, address.number, address.zip_code, address.city].filter(Boolean).join(" ")}
          </span>
        )
      },
    },
    {
      key: "date_of_birth",
      label: "Date of Birth",
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "swiss_number",
      label: "Swiss No.",
      render: (value) => <span className="text-muted-foreground text-sm">{value ? "Yes" : "No"}</span>,
    },
    {
      key: "roaming_control",
      label: "Roaming",
      render: (value) => <span className="text-muted-foreground text-sm">{value ? "Yes" : "No"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge className={statusConfig[value as Lead["status"]].className}>
          {statusConfig[value as Lead["status"]].label}
        </Badge>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "documents",
      label: "Documents",
      render: (_value, item) => {
        const count = item.documents?.length ?? 0
        if (count === 0) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <Button size="sm" variant="outline" onClick={() => handleViewDocs(item)} className="gap-1">
            <FileText className="w-4 h-4" />
            {count} {count === 1 ? "file" : "files"}
          </Button>
        )
      },
    },
    {
      key: "email_action",
      label: "Email",
      render: (_value, item) => {
        if (item.status === "sent") return null
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleEmail(item)}
            disabled={!item.email}
            className="gap-1"
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>
        )
      },
    },
  ]

  const handleViewDocs = async (lead: Lead) => {
    setDocsLead(lead)
    setSignedUrls({})
    setIsDocsDialogOpen(true)

    const docs = lead.documents ?? []
    if (docs.length === 0) return

    setIsLoadingDocs(true)
    try {
      const results = await Promise.all(
        docs.map((doc) =>
          fetch("/api/leads/file-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_url: doc.file_url }),
          }).then((r) => r.json().then((d) => ({ id: doc.id, signedUrl: d.signedUrl })))
        )
      )
      const map: Record<string, string> = {}
      results.forEach(({ id, signedUrl }) => { map[id] = signedUrl })
      setSignedUrls(map)
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const handleEmail = (lead: Lead) => {
    setEmailLead(lead)
    setSelectedUserIds([])
    setEmailMessage("")
    setIsEmailDialogOpen(true)
  }

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSendEmail = async () => {
    if (!emailLead || selectedUserIds.length === 0) return

    const recipients = users
      .filter((u) => selectedUserIds.includes(u.id))
      .map((u) => u.email)

    const plan = plans.find((p) => p.id === emailLead.plan_id)

    setIsSending(true)
    try {
      const res = await fetch("/api/leads/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients,
          leadId: emailLead.id,
          leadName: emailLead.fullname,
          leadEmail: emailLead.email,
          leadPhone: emailLead.phone,
          leadPlan: plan?.name,
          leadAddress: Array.isArray(emailLead.address) ? emailLead.address[0] : emailLead.address,
          leadDateOfBirth: emailLead.date_of_birth,
          leadSwissNumber: emailLead.swiss_number,
          leadRoaming: emailLead.roaming_control,
          leadDescription: emailLead.description,
          message: emailMessage.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to send email")
      }

      const { lead: updatedLead } = await res.json()
      setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)))

      setIsEmailDialogOpen(false)
      setFeedback({
        tone: "success",
        title: "Email sent",
        description: `Lead info for ${emailLead.fullname} sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}.`,
      })
    } catch (error) {
      setFeedback({
        tone: "destructive",
        title: "Failed to send email",
        description: error instanceof Error ? error.message : "Something went wrong",
      })
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetch("/api/leads"), fetch("/api/plans"), fetch("/api/users")])
      .then(([leadsRes, plansRes, usersRes]) =>
        Promise.all([leadsRes.json(), plansRes.json(), usersRes.json()])
      )
      .then(([leadsData, plansData, usersData]) => {
        setLeads(leadsData)
        setPlans(plansData)
        setUsers(usersData)
      })
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
        data={leads}
        columns={columns}
        title="Leads"
        searchPlaceholder="Search leads..."
        searchFields={["fullname", "email", "phone"]}
        isLoading={isLoading}
      />

      {/* Documents Dialog */}
      <Dialog open={isDocsDialogOpen} onOpenChange={setIsDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents</DialogTitle>
            <DialogDescription>
              {docsLead?.fullname}'s uploaded documents
            </DialogDescription>
          </DialogHeader>

          {isLoadingDocs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {(docsLead?.documents ?? []).map((doc: Document, index: number) => {
                const url = signedUrls[doc.id]
                const isPdf = doc.file_url.toLowerCase().endsWith(".pdf")
                return (
                  <div key={doc.id} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border-b">
                      <span className="text-sm font-medium text-muted-foreground">
                        Document {index + 1}
                      </span>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Open in new tab
                        </a>
                      )}
                    </div>
                    {url ? (
                      isPdf ? (
                        <iframe src={url} className="w-full h-64" />
                      ) : (
                        <img src={url} alt={`Document ${index + 1}`} className="w-full object-contain max-h-64" />
                      )
                    ) : (
                      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                        Preview unavailable
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDocsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Lead by Email</DialogTitle>
            <DialogDescription>
              Send <span className="font-medium text-foreground">{emailLead?.fullname}</span>'s lead info to selected users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Recipients</Label>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleUser(user.id)}
                    >
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{user.fullname}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="email-message" className="text-sm font-medium mb-2 block">
                Message <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="email-message"
                placeholder="Add a note to include with the lead info..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={selectedUserIds.length === 0 || isSending}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send to {selectedUserIds.length > 0 ? `${selectedUserIds.length} ` : ""}
                  {selectedUserIds.length === 1 ? "recipient" : "recipients"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
