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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DataTable, type Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import type { Lead } from "@/app/api/modules/leads/leads.type"
import type { Plan } from "@/app/api/modules/plans/plans.type"
import { Mail } from "lucide-react"

const statusConfig: Record<Lead["status"], { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary border-primary/20" },
  sent: { label: "Sent", className: "bg-primary/80 text-white border-primary/90" },
  contacted: { label: "Contacted", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  converted: { label: "Converted", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  lost: { label: "Lost", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

const emptyLead: Omit<Lead, "id" | "created_at"> = {
  fullname: "",
  email: "",
  phone: "",
  plan_id: "",
  file_url: null,
  status: "new",

  date_of_birth: null,
  swiss_number: false,
  keep_swiss_number: false,
  roaming_control: false,
  child_date_of_birth: null,

  address: {
    zip_code: "",
    city: "",
    street: "",
    number: "",
  },
}

const BUCKET = "leads-file"

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [editing, setEditing] = useState<Lead | null>(null)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState(emptyLead)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullname.trim()) newErrors.fullname = "Full name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address"
    // if (!formData.phone.trim()) newErrors.phone = "Phone is required"
    if (!formData.plan_id) newErrors.plan_id = "Plan is required"
    if (!formData.address?.zip_code?.trim()) newErrors.zip_code = "Zip code is required"
    if (!formData.address?.city?.trim()) newErrors.city = "City is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyLead)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  
  const handleEdit = (lead: Lead) => {
    setFeedback(null)
    setEditing(lead)
    
    const address = Array.isArray(lead.address) ? lead.address[0] : lead.address

    setFormData({
      fullname: lead.fullname,
      email: lead.email,
      phone: lead.phone ?? "",
      plan_id: lead.plan_id,
      file_url: lead.file_url,
      status: lead.status,
    
      date_of_birth: lead.date_of_birth ?? null,
      swiss_number: lead.swiss_number ?? false,
      keep_swiss_number: lead.keep_swiss_number ?? false,
      roaming_control: lead.roaming_control ?? false,
      child_date_of_birth: lead.child_date_of_birth ?? null,
    
      address: {
        zip_code: address?.zip_code ?? "",
        city: address?.city ?? "",
        street: address?.street ?? "",
        number: address?.number ?? "",
      },
    })
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const handleDelete = (lead: Lead) => {
    setLeadToDelete(lead)
    setIsDeleteDialogOpen(true)
  }

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
        <span className="text-muted-foreground text-sm">{value ?? "No Swiss number"}</span>
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
  
        if (!address) {
          return <span className="text-muted-foreground text-sm">—</span>
        }
  
        return (
          <span className="text-muted-foreground text-sm">
            {[address.street, address.number, address.zip_code, address.city]
              .filter(Boolean)
              .join(" ")}
          </span>
        )
      },
    },
    {
      key: "date_of_birth",
      label: "Date of Birth",
      render: (value) => (
        <span className="text-muted-foreground text-sm">{value ?? "—"}</span>
      ),
    },
    {
      key: "swiss_number",
      label: "Swiss No.",
      render: (value) => (
        <span className="text-muted-foreground text-sm">{value ? "Yes" : "No"}</span>
      ),
    },
    {
      key: "roaming_control",
      label: "Roaming",
      render: (value) => (
        <span className="text-muted-foreground text-sm">{value ? "Yes" : "No"}</span>
      ),
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
      render: (value) => (
        <span className="text-muted-foreground text-sm">{value}</span>
      ),
    },
    {
      key: "file_url",
      label: "File",
      render: (value, item) => {
        if (!value) return <span className="text-muted-foreground text-sm">—</span>
    
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleView(item)}
          >
            View
          </Button>
        )
      },
    },
    {
      key: "email_action",
      label: "Email",
      render: (_value, item) => (
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
      ),
    }
  ]

  const confirmEdit = async () => {
    if (!editing) return
    if (!validateForm()) return
    setIsLoading(true)

    try{
      const res = await fetch(`/api/leads/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not update lead",
          description: errorText || "Request failed",
        })
        return
      }
  
      const updated = await res.json()
      setLeads((prev) => prev.map((l) => (l.id === editing.id ? updated : l)))
      setIsEditDialogOpen(false)
      setEditing(null)
      setFeedback({
        tone: "success",
        title: "Lead updated",
        description: `${updated.fullname} has been updated.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!leadToDelete) return
    setIsLoading(true)

    try {
      const res = await fetch(`/api/leads/${leadToDelete.id}`, { method: "DELETE" })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not delete lead",
          description: errorText || "Request failed",
        })
        return
      }
  
      const name = leadToDelete.fullname
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id))
      setIsDeleteDialogOpen(false)
      setLeadToDelete(null)
      setFeedback({
        tone: "success",
        title: "Lead deleted",
        description: `${name} has been removed.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = async (lead: Lead) => {
    setViewingLead(lead)
    setIsViewDialogOpen(true)
    setFilePreviewUrl(null)
  
    if (!lead.file_url) return
  
    const res = await fetch("/api/leads/file-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_url: lead.file_url }),
    })
  
    const data = await res.json()
    setFilePreviewUrl(data.signedUrl)
  }

  const handleEmail = (lead: Lead) => {
    // this will open a popup....
  }

  useEffect(() => {
    setIsLoading(true)
    Promise.all([fetch("/api/leads"), fetch("/api/plans")])
      .then(([leadsRes, plansRes]) => Promise.all([leadsRes.json(), plansRes.json()]))
      .then(([leadsData, plansData]) => {
        setLeads(leadsData)
        setPlans(plansData)
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
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* View File */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View File</DialogTitle>
            <DialogDescription>
              {viewingLead?.fullname}'s uploaded file
            </DialogDescription>
          </DialogHeader>

          {filePreviewUrl ? (
            viewingLead?.file_url?.toLowerCase().endsWith(".pdf") ? (
              <iframe src={filePreviewUrl} className="w-full h-[500px] rounded-lg border" />
            ) : (
              <img src={filePreviewUrl} className="max-h-[500px] rounded-lg border" alt="Lead file" />
            )
          ) : (
            <p className="text-muted-foreground text-sm">No file preview available</p>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {/* <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              { isLoading ? "Saving Changes..." : "Save Changes" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {leadToDelete?.fullname}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              { isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
