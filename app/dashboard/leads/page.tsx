"use client"

import { useState } from "react"
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
import { mockLeads as initialLeads, mockPlans } from "@/lib/mock-data"
import type { Lead } from "@/lib/types"
import { Button } from "@/components/ui/button"

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
  file_url: "",
  status: "new",
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
      const plan = mockPlans.find((p) => p.id === value)
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [form, setForm] = useState<Omit<Lead, "id" | "created_at">>(emptyLead)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyLead)
    setDialogOpen(true)
  }

  const openEdit = (lead: Lead) => {
    setEditing(lead)
    setForm({ fullname: lead.fullname, email: lead.email, phone: lead.phone, plan_id: lead.plan_id, file_url: lead.file_url, status: lead.status })
    setDialogOpen(true)
  }

  const handleDelete = () => {
    console.log("Deleting lead with ID:", deleteId)
  }

  const confirmDelete = () => {
    if (deleteId) {
      setLeads((prev) => prev.filter((l) => l.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleSave = () => {
    if (editing) {
      setLeads((prev) => prev.map((l) => (l.id === editing.id ? { ...editing, ...form } : l)))
    } else {
      const newLead: Lead = { id: `lead-${Date.now()}`, created_at: new Date().toISOString().split("T")[0], ...form }
      setLeads((prev) => [newLead, ...prev])
    }
    setDialogOpen(false)
  }

  return (
    <>
      <DataTable
        data={leads}
        columns={columns}
        title="Leads"
        searchPlaceholder="Search leads..."
        searchFields={["fullname", "email", "phone"]}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addButtonText="Add Lead"
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Edit Lead" : "Add New Lead"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing ? "Update the lead information below." : "Fill in the lead details to create a new entry."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="lead-fullname" className="text-foreground">Full Name</Label>
              <Input id="lead-fullname" value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lead-email" className="text-foreground">Email</Label>
              <Input id="lead-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lead-phone" className="text-foreground">Phone</Label>
              <Input id="lead-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lead-plan" className="text-foreground">Plan</Label>
              <Select value={form.plan_id} onValueChange={(v) => setForm({ ...form, plan_id: v })}>
                <SelectTrigger id="lead-plan" className="bg-background border-input w-full">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {mockPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lead-status" className="text-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Lead["status"] })}>
                <SelectTrigger id="lead-status" className="bg-background border-input w-full">
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
            {/* <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="lead-file" className="text-foreground">File URL</Label>
              <Input id="lead-file" value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} className="bg-background border-input" placeholder="https://..." />
            </div> */}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">{editing ? "Save Changes" : "Create Lead"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Lead</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The lead will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
