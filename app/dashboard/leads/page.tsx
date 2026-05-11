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
import type { Lead, LeadWithRelations, Document } from "@/app/api/modules/leads/leads.type"
import type { User } from "@/app/api/modules/users/users.type"
import { Mail, Loader2, FileText, ChevronDown } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function providerLogoUrl(fileUrl: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/provider-logo/${fileUrl}`
}

function photoUrl(fileUrl: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-photos/${fileUrl}`
}

const statusConfig: Record<LeadWithRelations["status"], { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary border-primary/20" },
  sent: { label: "Sent", className: "bg-primary/80 text-white border-primary/90" },
  contacted: { label: "Contacted", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  converted: { label: "Converted", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  lost: { label: "Lost", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithRelations[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const [docsLead, setDocsLead] = useState<LeadWithRelations | null>(null)
  const [isDocsDialogOpen, setIsDocsDialogOpen] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])

  const [emailLeads, setEmailLeads] = useState<LeadWithRelations[]>([])
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [emailMessage, setEmailMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleBulkStatus = async (status: Lead["status"]) => {
    if (selectedLeadIds.length === 0) return
    setIsUpdatingStatus(true)
    try {
      const updated: LeadWithRelations[] = await fetch("/api/leads/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedLeadIds, status }),
      }).then((r) => r.json())
      setLeads((prev) => prev.map((l) => {
        const u = updated.find((u) => u.id === l.id)
        return u ? { ...l, status: u.status } : l
      }))
      setSelectedLeadIds([])
      setFeedback({ tone: "success", title: `${selectedLeadIds.length} lead${selectedLeadIds.length > 1 ? "s" : ""} marked as ${status}` })
    } catch {
      setFeedback({ tone: "destructive", title: "Failed to update status" })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleOpenEmailForSelected = () => {
    if (selectedLeadIds.length === 0) return
    const selected = leads.filter((l) => selectedLeadIds.includes(l.id))
    setEmailLeads(selected)
    setSelectedUserIds([])
    setEmailMessage("")
    setIsEmailDialogOpen(true)
  }

  const columns: Column<LeadWithRelations>[] = [
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
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const status = String(value ?? "").toLowerCase() as LeadWithRelations["status"]
        const config = statusConfig[status] ?? statusConfig.new
        return <Badge className={config.className}>{config.label}</Badge>
      },
    },
    {
      key: "plan_info",
      label: "Plan",
      render: (_value, item) => {
        const plan = (item as any).plans
        if (!plan) return <span className="text-muted-foreground text-sm">—</span>
        const provider = plan.providers
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{plan.name}</span>
              <span className="text-xs text-muted-foreground">
                {provider?.name} · {provider?.categories?.name}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: "plan_price",
      label: "Price",
      render: (_value, item) => {
        const plan = (item as any).plans
        if (!plan) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <div className="flex flex-col">
            <span className="text-sm text-foreground">
              CHF {plan.discount > 0
                ? (plan.price * (1 - plan.discount / 100)).toFixed(2)
                : plan.price}
              /mo
            </span>
            {plan.discount > 0 && (
              <span className="text-[0.6rem] text-green-600">{plan.discount}% off</span>
            )}
          </div>
        )
      },
    },
    {
      key: "plan_network",
      label: "Network",
      render: (_value, item) => {
        const plan = (item as any).plans
        if (!plan) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">{plan.network_technology}</span>
            <span className="text-xs text-muted-foreground">
              {plan.data_gb === null ? "Unlimited" : `${plan.data_gb}GB`}
            </span>
          </div>
        )
      },
    },
    {
      key: "product_color_id",
      label: "Product",
      render: (_value, item) => {
        const plan = (item as any).plans
        const colorId = item.product_color_id
        if (!plan?.products?.length || !colorId) return <span className="text-muted-foreground text-sm">—</span>

        let matchedProduct: any = null
        let matchedColor: any = null

        for (const product of plan.products) {
          const color = product.products_colors?.find((c: any) => c.id === colorId)
          if (color) {
            matchedProduct = product
            matchedColor = color
            break
          }
        }

        if (!matchedProduct) return <span className="text-muted-foreground text-sm">—</span>

        const primaryPhoto = matchedColor?.products_photos?.find((p: any) => p.is_primary)
          ?? matchedColor?.products_photos?.[0]

        return (
          <div className="flex items-center gap-2">
            {primaryPhoto?.file_url && (
              <img
                src={photoUrl(primaryPhoto.file_url)}
                alt={matchedColor.name}
                className="w-7 h-9 object-cover rounded border"
              />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">{matchedProduct.name}</span>
              <div className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full border border-border inline-block"
                  style={{ backgroundColor: matchedColor.hex_code }}
                />
                <span className="text-xs text-muted-foreground">{matchedColor.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">CHF {matchedProduct.base_price}</span>
            </div>
          </div>
        )
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
      key: "is_child_order",
      label: "Child Order",
      render: (value) => <span className="text-muted-foreground text-sm">{value ? "Yes" : "No"}</span>,
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
  ]

  const handleViewDocs = async (lead: LeadWithRelations) => {
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

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSendEmail = async () => {
    if (emailLeads.length === 0 || selectedUserIds.length === 0) return

    const recipients = users
      .filter((u) => selectedUserIds.includes(u.id))
      .map((u) => u.email)

    setIsSending(true)
    try {
      await Promise.all(
        emailLeads.map((lead) => {
          const plan = (lead as any).plans
          return fetch("/api/leads/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipients,
              leadId: lead.id,
              leadName: lead.fullname,
              leadEmail: lead.email,
              leadPhone: lead.phone,
              leadPlan: plan?.name,
              leadAddress: Array.isArray(lead.address) ? lead.address[0] : lead.address,
              leadDateOfBirth: lead.date_of_birth,
              leadSwissNumber: lead.swiss_number,
              leadRoaming: lead.roaming_control,
              leadDescription: lead.description,
              message: emailMessage.trim() || undefined,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json()
              throw new Error(err.message || `Failed to send email for ${lead.fullname}`)
            }
            const { lead: updatedLead } = await res.json()
            setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l)))
          })
        })
      )

      setIsEmailDialogOpen(false)
      setSelectedLeadIds([])
      setFeedback({
        tone: "success",
        title: "Emails sent",
        description: `${emailLeads.length} lead${emailLeads.length > 1 ? "s" : ""} sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}.`,
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
    const supabase = createClient()

    setIsLoading(true)
    Promise.all([fetch("/api/leads"), fetch("/api/users")])
      .then(([leadsRes, usersRes]) => Promise.all([leadsRes.json(), usersRes.json()]))
      .then(([leadsData, usersData]) => {
        setLeads(leadsData)
        setUsers(usersData)
      })
      .finally(() => setIsLoading(false))

    const channel = supabase
      .channel("admin-leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          setLeads((prev) => [payload.new as LeadWithRelations, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          {selectedLeadIds.length > 0 ? `${selectedLeadIds.length} selected` : ""}
        </span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={selectedLeadIds.length === 0 || isUpdatingStatus}
                className="gap-2"
              >
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                Change Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkStatus("contacted")}>Contacted</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("converted")}>Converted</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("lost")}>Lost</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("sent")}>Sent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("new")}>New</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="outline"
            disabled={selectedLeadIds.length === 0}
            onClick={handleOpenEmailForSelected}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </Button>
        </div>
      </div>

      <DataTable
        data={leads}
        columns={columns}
        title="Leads"
        searchPlaceholder="Search leads..."
        searchFields={["fullname", "email", "phone"]}
        isLoading={isLoading}
        selectable
        selectedIds={selectedLeadIds}
        onSelectionChange={setSelectedLeadIds}
      />

      {/* Documents Dialog */}
      <Dialog open={isDocsDialogOpen} onOpenChange={setIsDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documents</DialogTitle>
            <DialogDescription>{docsLead?.fullname}'s uploaded documents</DialogDescription>
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
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
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
              {emailLeads.length === 1
                ? <>Send <span className="font-medium text-foreground">{emailLeads[0].fullname}</span>'s lead info to selected users.</>
                : <>Send <span className="font-medium text-foreground">{emailLeads.length} leads</span> info to selected users.</>
              }
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
