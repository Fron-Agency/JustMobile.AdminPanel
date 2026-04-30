"use client"

import { useState } from "react"
import { Star } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { DataTable, type Column } from "@/components/ui/data-table"
import { mockPlans as initialPlans, mockProviders } from "@/lib/mock-data"
import type { Plan } from "@/lib/types"
import { Button } from "@/components/ui/button"

const emptyPlan: Omit<Plan, "id"> = {
  provider_id: "",
  price: 0,
  data_gb: 0,
  speed: 0,
  contract_length: 12,
  name: "",
  discount: 0,
  is_favorite: false,
}

const columns: Column<Plan>[] = [
  {
    key: "name",
    label: "Name",
    render: (value, item) => (
      <div className="flex items-center gap-2">
        {item.is_favorite && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
        <span className="font-medium text-foreground">{value}</span>
      </div>
    ),
  },
  {
    key: "provider_id",
    label: "Provider",
    render: (value) => {
      const provider = mockProviders.find((p) => p.id === value)
      return <span className="text-muted-foreground text-sm">{provider?.name ?? "—"}</span>
    },
  },
  {
    key: "price",
    label: "Price",
    render: (value) => <span className="text-muted-foreground text-sm">£{value}/mo</span>,
  },
  {
    key: "data_gb",
    label: "Data",
    render: (value) => <span className="text-muted-foreground text-sm">{value}GB</span>,
  },
  {
    key: "speed",
    label: "Speed",
    render: (value) => <span className="text-muted-foreground text-sm">{value}Mbps</span>,
  },
  {
    key: "contract_length",
    label: "Contract",
    render: (value) => <span className="text-muted-foreground text-sm">{value}mo</span>,
  },
  {
    key: "discount",
    label: "Discount",
    render: (value) => value > 0 ? <span className="text-green-600 text-sm">{value}% off</span> : <span className="text-muted-foreground text-sm">—</span>,
  },
]

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState<Omit<Plan, "id">>(emptyPlan)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyPlan)
    setDialogOpen(true)
  }

  const openEdit = (plan: Plan) => {
    setEditing(plan)
    setForm({ provider_id: plan.provider_id, price: plan.price, data_gb: plan.data_gb, speed: plan.speed, contract_length: plan.contract_length, name: plan.name, discount: plan.discount, is_favorite: plan.is_favorite })
    setDialogOpen(true)
  }

  const handleDelete = () => {
    console.log("Deleting plan with ID:", deleteId)
  }

  const confirmDelete = () => {
    if (deleteId) {
      setPlans((prev) => prev.filter((p) => p.id !== deleteId))
      setDeleteId(null)
    }
  }

  const handleSave = () => {
    if (editing) {
      setPlans((prev) => prev.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)))
    } else {
      setPlans((prev) => [{ id: `plan-${Date.now()}`, ...form }, ...prev])
    }
    setDialogOpen(false)
  }

  return (
    <>
      <DataTable
        data={plans}
        columns={columns}
        title="Plans"
        searchPlaceholder="Search plans..."
        searchFields={["name"]}
        onAdd={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        addButtonText="Add Plan"
      />

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editing ? "Edit Plan" : "Add New Plan"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editing ? "Update the plan details." : "Configure a new plan offering."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-foreground">Plan Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-input" />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label className="text-foreground">Provider</Label>
              <Select value={form.provider_id} onValueChange={(v) => setForm({ ...form, provider_id: v })}>
                <SelectTrigger className="bg-background border-input w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {mockProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Price (£)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Discount (%)</Label>
              <Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: +e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Data (GB)</Label>
              <Input type="number" value={form.data_gb} onChange={(e) => setForm({ ...form, data_gb: +e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Speed (Mbps)</Label>
              <Input type="number" value={form.speed} onChange={(e) => setForm({ ...form, speed: +e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Contract (months)</Label>
              <Input type="number" value={form.contract_length} onChange={(e) => setForm({ ...form, contract_length: +e.target.value })} className="bg-background border-input" />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <Switch
                id="is-favorite"
                checked={form.is_favorite}
                onCheckedChange={(v) => setForm({ ...form, is_favorite: v })}
              />
              <Label htmlFor="is-favorite" className="text-foreground">Mark as Favourite</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">{editing ? "Save Changes" : "Create Plan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Plan</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The plan will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
