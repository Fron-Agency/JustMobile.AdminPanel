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

const statusConfig: Record<Lead["status"], { label: string; className: string }> = {
  new: { label: "New", className: "bg-primary/10 text-primary border-primary/20" },
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullname.trim()) newErrors.fullname = "Full name is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address"
    if (!formData.phone.trim()) newErrors.phone = "Phone is required"
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
    setFormData({
      fullname: lead.fullname,
      email: lead.email,
      phone: lead.phone,
      plan_id: lead.plan_id,
      file_url: lead.file_url,
      status: lead.status,
    
      date_of_birth: lead.date_of_birth ?? null,
      swiss_number: lead.swiss_number ?? false,
      keep_swiss_number: lead.keep_swiss_number ?? false,
      roaming_control: lead.roaming_control ?? false,
      child_date_of_birth: lead.child_date_of_birth ?? null,
    
      address: {
        zip_code: lead.address?.zip_code ?? "",
        city: lead.address?.city ?? "",
        street: lead.address?.street ?? "",
        number: lead.address?.number ?? "",
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
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
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
      key: "status",
      label: "Status",
      render: (value) => (
        <Badge className={statusConfig[value as Lead["status"]].className}>
          {statusConfig[value as Lead["status"]].label}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
      hidden: true,
    },
  ]

  const confirmAdd = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try{
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not add lead",
          description: errorText || "Request failed",
        })
        return
      }
  
      const created = await res.json()
      setLeads((prev) => [created, ...prev])
      setIsAddDialogOpen(false)
      setFeedback({
        tone: "success",
        title: "Lead added",
        description: `${created.fullname} has been created.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

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

  const formFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Full Name</Label>
        <div className="col-span-3">
          <Input
            value={formData.fullname}
            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
            className={errors.fullname ? "border-red-500" : ""}
          />
          {errors.fullname && <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Email</Label>
        <div className="col-span-3">
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Phone</Label>
        <div className="col-span-3">
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Plan</Label>
        <div className="col-span-3">
          <Select value={formData.plan_id} onValueChange={(v) => setFormData({ ...formData, plan_id: v })}>
            <SelectTrigger className={errors.plan_id ? "border-red-500" : ""}>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.plan_id && <p className="text-red-500 text-sm mt-1">{errors.plan_id}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Date of Birth</Label>
        <div className="col-span-3">
          <Input
            type="date"
            value={formData.date_of_birth ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, date_of_birth: e.target.value || null })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Child Date of Birth</Label>
        <div className="col-span-3">
          <Input
            type="date"
            value={formData.child_date_of_birth ?? ""}
            onChange={(e) =>
              setFormData({ ...formData, child_date_of_birth: e.target.value || null })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Zip Code</Label>
        <div className="col-span-3">
          <Input
            value={formData.address?.zip_code ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, zip_code: e.target.value },
              })
            }
            className={errors.zip_code ? "border-red-500" : ""}
          />
          {errors.zip_code && <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">City</Label>
        <div className="col-span-3">
          <Input
            value={formData.address?.city ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, city: e.target.value },
              })
            }
            className={errors.city ? "border-red-500" : ""}
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Street</Label>
        <div className="col-span-3">
          <Input
            value={formData.address?.street ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, street: e.target.value },
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Number</Label>
        <div className="col-span-3">
          <Input
            value={formData.address?.number ?? ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, number: e.target.value },
              })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Status</Label>
        <div className="col-span-3">
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Lead["status"] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>Add a new lead to the system.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              { isLoading ? "Adding..." : "Add Lead" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
      </Dialog>

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
