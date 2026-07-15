"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
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
import type { LeadHome } from "@/app/api/modules/leads_home/leads_home.type"
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

const statusClassNames: Record<LeadWithRelations["status"], string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  sent: "bg-primary/80 text-white border-primary/90",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  converted: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
}

export default function LeadsPage() {
  const t = useTranslations("Leads")
  const tStatus = useTranslations("Dashboard.leadStatus")

  const [leads, setLeads] = useState<LeadWithRelations[]>([])
  const [leadsHome, setLeadsHome] = useState<LeadHome[]>([])
  const [isLoadingHome, setIsLoadingHome] = useState(true)
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
  const [selectedLeadHomeIds, setSelectedLeadHomeIds] = useState<string[]>([])
  const [isUpdatingHomeStatus, setIsUpdatingHomeStatus] = useState(false)

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
      setFeedback({
        tone: "success",
        title: t("leadsMarkedAsStatus", { count: selectedLeadIds.length, status: tStatus(status) }),
      })
    } catch {
      setFeedback({ tone: "destructive", title: t("failedToUpdateStatus") })
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
      label: t("columns.name"),
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
      key: "email",
      label: t("columns.email"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "phone",
      label: t("columns.phone"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (value) => {
        const status = String(value ?? "").toLowerCase() as LeadWithRelations["status"]
        const className = statusClassNames[status] ?? statusClassNames.new
        return <Badge className={className}>{tStatus(status)}</Badge>
      },
    },
    {
      key: "plan_mobile_name",
      label: t("columns.plan"),
      render: (_value, item) => {
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{item.plan_mobile_name}</span>
              <span className="text-xs text-muted-foreground">
                {item.plan_mobile_provider_name} · {item.plan_mobile_provider_category_name}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      key: "product_color_id",
      label: t("columns.product"),
      render: (_value, item) => {

        const primaryPhoto = item.product_photo_file_url

        return (
          <div className="flex items-center gap-2">
            {primaryPhoto && (
              <img
                src={photoUrl(primaryPhoto)}
                alt={item.product_color_name}
                className="w-7 h-9 object-cover rounded border"
              />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">{item.product_name}</span>
              <div className="flex items-center gap-1">
                {/* <span
                  className="w-2 h-2 rounded-full border border-border inline-block"
                  style={{ backgroundColor: matchedColor.hex_code }}
                /> */}
                <span className="text-xs text-muted-foreground">{item.product_color_name}</span>
              </div>
              {/* <span className="text-xs text-muted-foreground">CHF {matchedProduct.base_price}</span> */}
            </div>
          </div>
        )
      },
    },
    {
      key: "address",
      label: t("columns.address"),
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
      label: t("columns.dateOfBirth"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "swiss_number",
      label: t("columns.swissNumber"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ? t("yes") : t("no")}</span>,
    },
    {
      key: "roaming_control",
      label: t("columns.roaming"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ? t("yes") : t("no")}</span>,
    },
    {
      key: "is_child_order",
      label: t("columns.childOrder"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ? t("yes") : t("no")}</span>,
    },
    {
      key: "description",
      label: t("columns.description"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "documents",
      label: t("columns.documents"),
      render: (_value, item) => {
        const count = item.documents?.length ?? 0
        if (count === 0) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <Button size="sm" variant="outline" onClick={() => handleViewDocs(item)} className="gap-1">
            <FileText className="w-4 h-4" />
            {t("filesCount", { count })}
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

          console.log(lead);

          return fetch("/api/leads/email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipients,
              leadId: lead.id,
              leadName: lead.fullname,
              leadEmail: lead.email,
              leadPhone: lead.phone,
              leadPlan: lead.plan_mobile_name,
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
        title: t("emailsSent"),
        description: t("emailsSentDescription", {
          leadCount: emailLeads.length,
          recipientCount: recipients.length,
        }),
      })
    } catch (error) {
      setFeedback({
        tone: "destructive",
        title: t("failedToSendEmail"),
        description: error instanceof Error ? error.message : t("somethingWentWrong"),
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleBulkHomeStatus = async (status: LeadHome["status"]) => {
    if (selectedLeadHomeIds.length === 0) return
    setIsUpdatingHomeStatus(true)
    try {
      const updated: LeadHome[] = await fetch("/api/leads_home/bulk-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedLeadHomeIds, status }),
      }).then((r) => r.json())
      setLeadsHome((prev) => prev.map((l) => {
        const u = updated.find((u) => u.id === l.id)
        return u ? { ...l, status: u.status } : l
      }))
      setSelectedLeadHomeIds([])
      setFeedback({
        tone: "success",
        title: t("homeLeadsMarkedAsStatus", { count: selectedLeadHomeIds.length, status: tStatus(status) }),
      })
    } catch {
      setFeedback({ tone: "destructive", title: t("failedToUpdateStatus") })
    } finally {
      setIsUpdatingHomeStatus(false)
    }
  }

  const leadsHomeColumns: Column<LeadHome>[] = [
    {
      key: "name",
      label: t("columns.name"),
      render: (_value, item) => (
        <span className="font-medium text-foreground">{item.name} {item.lastname}</span>
      ),
    },
    {
      key: "email",
      label: t("columns.email"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "mobile_number",
      label: t("columns.mobile"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "status",
      label: t("columns.status"),
      render: (value) => {
        const status = String(value ?? "").toLowerCase() as LeadHome["status"]
        const className = statusClassNames[status] ?? statusClassNames.new
        return <Badge className={className}>{tStatus(status)}</Badge>
      },
    },
    {
      key: "date_of_birth",
      label: t("columns.dateOfBirth"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "nationality",
      label: t("columns.nationality"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "document_type",
      label: t("columns.docType"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "document_number",
      label: t("columns.docNumber"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "swiss_number",
      label: t("columns.swissNumber"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ? t("yes") : t("no")}</span>,
    },
    {
      key: "arriving_date",
      label: t("columns.arriving"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "oto_provider",
      label: t("columns.otoProvider"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "oto_number",
      label: t("columns.otoNumber"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "oto_expiry_date",
      label: t("columns.otoExpiry"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "landline_number",
      label: t("columns.landlineNumber"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "address",
      label: t("columns.address"),
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
      key: "comment",
      label: t("columns.comment"),
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "created_at",
      label: t("columns.created"),
      render: (value) => <span className="text-muted-foreground text-sm">{new Date(value).toLocaleString()}</span>,
    }
  ]

  useEffect(() => {
    const supabase = createClient()

    setIsLoading(true)
    setIsLoadingHome(true)
    Promise.all([fetch("/api/leads"), fetch("/api/users"), fetch("/api/leads_home")])
      .then(([leadsRes, usersRes, leadsHomeRes]) => Promise.all([leadsRes.json(), usersRes.json(), leadsHomeRes.json()]))
      .then(([leadsData, usersData, leadsHomeData]) => {
        setLeads(leadsData)
        setUsers(usersData)
        setLeadsHome(leadsHomeData)
      })
      .finally(() => {
        setIsLoading(false)
        setIsLoadingHome(false)
      })

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
          {t("selectedCount", { count: selectedLeadIds.length })}
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
                {t("changeStatus")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleBulkStatus("contacted")}>{tStatus("contacted")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("converted")}>{tStatus("converted")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("lost")}>{tStatus("lost")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("sent")}>{tStatus("sent")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkStatus("new")}>{tStatus("new")}</DropdownMenuItem>
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
            {t("sendEmail")}
          </Button>
        </div>
      </div>

      <DataTable
        data={leads}
        columns={columns}
        title={t("leadsTable.title")}
        searchPlaceholder={t("leadsTable.searchPlaceholder")}
        searchFields={["fullname", "email", "phone"]}
        isLoading={isLoading}
        selectable
        selectedIds={selectedLeadIds}
        onSelectionChange={setSelectedLeadIds}
      />

      <div className="flex items-center justify-between mt-8 mb-2">
        <span className="text-sm text-muted-foreground">
          {t("selectedCount", { count: selectedLeadHomeIds.length })}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedLeadHomeIds.length === 0 || isUpdatingHomeStatus}
              className="gap-2"
            >
              {isUpdatingHomeStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
              {t("changeStatus")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkHomeStatus("contacted")}>{tStatus("contacted")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkHomeStatus("converted")}>{tStatus("converted")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkHomeStatus("lost")}>{tStatus("lost")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkHomeStatus("sent")}>{tStatus("sent")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkHomeStatus("new")}>{tStatus("new")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DataTable
        data={leadsHome}
        columns={leadsHomeColumns}
        title={t("leadsHomeTable.title")}
        searchPlaceholder={t("leadsHomeTable.searchPlaceholder")}
        searchFields={["name", "lastname", "email", "mobile_number"]}
        isLoading={isLoadingHome}
        selectable
        selectedIds={selectedLeadHomeIds}
        onSelectionChange={setSelectedLeadHomeIds}
      />

      {/* Documents Dialog */}
      <Dialog open={isDocsDialogOpen} onOpenChange={setIsDocsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("documentsDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("documentsDialog.description", { name: docsLead?.fullname ?? "" })}
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
                        {t("documentsDialog.documentLabel", { index: index + 1 })}
                      </span>
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          {t("documentsDialog.openInNewTab")}
                        </a>
                      )}
                    </div>
                    {url ? (
                      isPdf ? (
                        <iframe src={url} className="w-full h-64" />
                      ) : (
                        <img src={url} alt={t("documentsDialog.documentLabel", { index: index + 1 })} className="w-full object-contain max-h-64" />
                      )
                    ) : (
                      <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                        {t("documentsDialog.previewUnavailable")}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDocsDialogOpen(false)}>{t("documentsDialog.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("emailDialog.title")}</DialogTitle>
            <DialogDescription>
              {emailLeads.length === 1
                ? t("emailDialog.descriptionSingle", { name: emailLeads[0].fullname ?? "" })
                : t("emailDialog.descriptionMultiple", { count: emailLeads.length })
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">{t("emailDialog.recipients")}</Label>
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("emailDialog.noUsersFound")}</p>
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
                {t("emailDialog.message")} <span className="text-muted-foreground font-normal">{t("emailDialog.optional")}</span>
              </Label>
              <Textarea
                id="email-message"
                placeholder={t("emailDialog.messagePlaceholder")}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              {t("emailDialog.cancel")}
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={selectedUserIds.length === 0 || isSending}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("emailDialog.sending")}
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  {t("emailDialog.sendTo", { count: selectedUserIds.length })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
