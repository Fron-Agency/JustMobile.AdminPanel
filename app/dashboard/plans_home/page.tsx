"use client"

import { useEffect, useState } from "react"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/ui/data-table"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import type { PlanHomeWithProvider, PlanHomeJsonBlock } from "@/app/api/modules/plans_home/plans_home.type"
import { Plus, Trash2 } from "lucide-react"

const emptyBlock = (): PlanHomeJsonBlock => ({ title: "", features: [] })

const emptyForm = {
  name: "",
  provider_id: "",
  price: 0,
  discount_price: null as number | null,
  without_mobile_price: null as number | null,
  contract_duration: "",
  internet_content: emptyBlock(),
  tv: emptyBlock(),
  telephony: emptyBlock(),
  other: emptyBlock()
}

type FormState = typeof emptyForm

function JsonBlockEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: PlanHomeJsonBlock
  onChange: (v: PlanHomeJsonBlock) => void
}) {
  const addFeature = () =>
    onChange({ ...value, features: [...value.features, { label: "", value: "" }] })

  const removeFeature = (i: number) =>
    onChange({ ...value, features: value.features.filter((_, idx) => idx !== i) })

  const updateFeature = (i: number, field: "label" | "value", val: string) => {
    const next = [...value.features]
    next[i] = { ...next[i], [field]: val }
    onChange({ ...value, features: next })
  }

  return (
    <div className="border rounded-md p-3 space-y-3 bg-muted/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div>
        <Label className="text-xs">Section Title</Label>
        <Input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder={`e.g. ${label}`}
          className="mt-1"
        />
      </div>
      <div className="space-y-2">
        {value.features.map((f, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              value={f.label}
              onChange={(e) => updateFeature(i, "label", e.target.value)}
              placeholder="Label (e.g. Speed)"
              className="flex-1"
            />
            <Input
              value={f.value}
              onChange={(e) => updateFeature(i, "value", e.target.value)}
              placeholder="Value (e.g. 1 Gbit/s)"
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => removeFeature(i)}
              className="text-destructive hover:opacity-70"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="gap-1 mt-1">
          <Plus className="w-3.5 h-3.5" />
          Add feature
        </Button>
      </div>
    </div>
  )
}

function blockIsEmpty(block: PlanHomeJsonBlock) {
  return !block.title && block.features.length === 0
}

export default function PlansHomePage() {
  const [plans, setPlans] = useState<PlanHomeWithProvider[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ tone: FeedbackAlertTone; title: string; description?: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [planToDelete, setPlanToDelete] = useState<PlanHomeWithProvider | null>(null)

  useEffect(() => {
    fetch("/api/plans_home")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setPlans)
      .catch((e) => setFeedback({ tone: "destructive", title: "Failed to load plans", description: e.message }))
      .finally(() => setIsLoading(false))
  }, [])

  const fetchProviders = async () => {
    if (providers.length > 0) return
    const res = await fetch("/api/providers/category")
    setProviders(await res.json())
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = "Name is required"
    if (!formData.provider_id) e.provider_id = "Provider is required"
    if (formData.price <= 0) e.price = "Price must be greater than 0"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const buildPayload = () => ({
    name: formData.name,
    provider_id: formData.provider_id,
    price: formData.price,
    discount_price: formData.discount_price || null,
    without_mobile_price: formData.without_mobile_price || null,
    contract_duration: formData.contract_duration || null,
    internet_content: blockIsEmpty(formData.internet_content) ? null : formData.internet_content,
    tv: blockIsEmpty(formData.tv) ? null : formData.tv,
    telephony: blockIsEmpty(formData.telephony) ? null : formData.telephony,
    other: blockIsEmpty(formData.other) ? null : formData.other
  })

  const handleAdd = async () => {
    setFormData(emptyForm)
    setErrors({})
    await fetchProviders()
    setIsAddDialogOpen(true)
  }

  const confirmAdd = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/plans_home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to create plan")
      setPlans((prev) => [data, ...prev])
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: "Plan created", description: data.name })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Failed to create plan", description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (plan: PlanHomeWithProvider) => {
    setFormData({
      name: plan.name,
      provider_id: plan.provider_id,
      price: plan.price,
      discount_price: plan.discount_price,
      without_mobile_price: plan.without_mobile_price,
      contract_duration: plan.contract_duration ?? "",
      internet_content: plan.internet_content ?? emptyBlock(),
      tv: plan.tv ?? emptyBlock(),
      telephony: plan.telephony ?? emptyBlock(),
      other: plan.other ?? emptyBlock()
    })
    setEditingId(plan.id)
    setErrors({})
    await fetchProviders()
    setIsEditDialogOpen(true)
  }

  const confirmEdit = async () => {
    if (!editingId || !validate()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/plans_home/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to update plan")
      setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)))
      setIsEditDialogOpen(false)
      setFeedback({ tone: "success", title: "Plan updated", description: data.name })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Failed to update plan", description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (plan: PlanHomeWithProvider) => {
    setPlanToDelete(plan)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!planToDelete) return
    setIsLoading(true)
    try {
      await fetch(`/api/plans_home/${planToDelete.id}`, { method: "DELETE" })
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id))
      setIsDeleteDialogOpen(false)
      setFeedback({ tone: "success", title: "Plan deleted", description: planToDelete.name })
    } catch {
      setFeedback({ tone: "destructive", title: "Failed to delete plan" })
    } finally {
      setIsLoading(false)
    }
  }

  const columns: Column<PlanHomeWithProvider>[] = [
    {
      key: "name",
      label: "Name",
      render: (v) => <span className="font-medium text-foreground">{v}</span>,
    },
    {
      key: "provider_name",
      label: "Provider",
      render: (v) => <span className="text-muted-foreground text-sm">{v ?? "—"}</span>,
    },
    {
      key: "price",
      label: "Price",
      render: (v) => <span className="text-muted-foreground text-sm">CHF {v}/mo</span>,
    },
    {
      key: "discount_price",
      label: "Discounted",
      render: (v) => v != null
        ? <span className="text-green-600 text-sm">CHF {v}/mo</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "without_mobile_price",
      label: "Without Mobile",
      render: (v) => v != null
        ? <span className="text-muted-foreground text-sm">CHF {v}/mo</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "contract_duration",
      label: "Contract",
      render: (v) => <span className="text-muted-foreground text-sm">{v ?? "—"}</span>,
    },
    {
      key: "internet_content",
      label: "Internet",
      render: (v: PlanHomeWithProvider["internet_content"]) => v
        ? <span className="text-muted-foreground text-sm">{v.features.length} feature{v.features.length !== 1 ? "s" : ""}</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "tv",
      label: "TV",
      render: (v: PlanHomeWithProvider["tv"]) => v
        ? <span className="text-muted-foreground text-sm">{v.features.length} feature{v.features.length !== 1 ? "s" : ""}</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "telephony",
      label: "Telephony",
      render: (v: PlanHomeWithProvider["telephony"]) => v
        ? <span className="text-muted-foreground text-sm">{v.features.length} feature{v.features.length !== 1 ? "s" : ""}</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "other",
      label: "Other",
      render: (v: PlanHomeWithProvider["other"]) => v
        ? <span className="text-muted-foreground text-sm">{v.features.length} feature{v.features.length !== 1 ? "s" : ""}</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    }
  ]

  const formFields = (
    <div className="flex flex-col gap-6 py-2 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label>Provider</Label>
          <Select value={formData.provider_id} onValueChange={(v) => setFormData({ ...formData, provider_id: v })}>
            <SelectTrigger className={errors.provider_id ? "border-red-500" : ""}>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} - {p.category_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.provider_id && <p className="text-red-500 text-xs">{errors.provider_id}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Price (CHF)</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && <p className="text-red-500 text-xs">{errors.price}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label>Discounted Price <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            type="number"
            placeholder="—"
            value={formData.discount_price ?? ""}
            onChange={(e) => setFormData({ ...formData, discount_price: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Without Mobile Price <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Input
            type="number"
            placeholder="—"
            value={formData.without_mobile_price ?? ""}
            onChange={(e) => setFormData({ ...formData, without_mobile_price: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Contract Duration <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          placeholder="e.g. 24 months"
          value={formData.contract_duration ?? ""}
          onChange={(e) => setFormData({ ...formData, contract_duration: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-3 mt-1">
        <p className="text-sm font-medium text-foreground">Content Sections</p>
        <JsonBlockEditor
          label="Internet"
          value={formData.internet_content}
          onChange={(v) => setFormData({ ...formData, internet_content: v })}
        />
        <JsonBlockEditor
          label="TV"
          value={formData.tv}
          onChange={(v) => setFormData({ ...formData, tv: v })}
        />
        <JsonBlockEditor
          label="Telephony"
          value={formData.telephony}
          onChange={(v) => setFormData({ ...formData, telephony: v })}
        />
        <JsonBlockEditor
          label="Other"
          value={formData.other}
          onChange={(v) => setFormData({ ...formData, other: v })}
        />
      </div>
    </div>
  )

  return (
    <>
      {feedback && (
        <div className="mb-4">
          <FeedbackAlert
            tone={feedback.tone}
            title={feedback.title}
            description={feedback.description}
            onAutoDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      <DataTable
        data={plans}
        columns={columns}
        title="Home Plans"
        searchPlaceholder="Search plans..."
        searchFields={["name", "provider_name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        addButtonText="Add Home Plan"
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Home Plan</DialogTitle>
            <DialogDescription>Create a new home internet / TV / telephony plan.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Home Plan</DialogTitle>
            <DialogDescription>Update plan details and content sections.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Home Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{planToDelete?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
