"use client"

import { useEffect, useState } from "react"
import { Star, Plus, Trash2 } from "lucide-react"
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
import type { PlanMobile } from "@/app/api/modules/plans_mobile/plans_mobile.type"
import type { Country } from "@/app/api/modules/countries/countries.type"
import { Button } from "@/components/ui/button"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"

const emptyForm = {
  name: "",
  provider_id: "",
  price: 0,
  data_gb: 0 as number | null,
  network_technology: "",
  contract_length: 0,
  discount: 0,
  is_favorite: false,
  data_gb_europe: 0 as number | null
}

type FormState = typeof emptyForm

type ZoneEntry = {
  country_id: string
  rawData: string
}

const emptyZone = (): ZoneEntry => ({ country_id: "", rawData: "" })

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanMobile[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [countryZones, setCountryZones] = useState<Country[]>([])
  const [editingPlan, setEditingPlan] = useState<PlanMobile | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<PlanMobile | null>(null)
  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{ tone: FeedbackAlertTone; title: string; description?: string } | null>(null)
  const [isUnlimited, setIsUnlimited] = useState(false)
  const [isUnlimitedEurope, setIsUnlimitedEurope] = useState(false)
  const [zones, setZones] = useState<ZoneEntry[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/plans_mobile").then((r) => r.json()),
      fetch("/api/countries").then((r) => r.json()),
    ])
      .then(([plansData, zonesData]) => {
        setPlans(plansData)
        setCountryZones(zonesData)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const fetchProviders = async () => {
    if (providers.length > 0) return
    const res = await fetch("/api/providers/category")
    setProviders(await res.json())
  }

  const validateForm = () => {
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
    data_gb: isUnlimited ? null : formData.data_gb,
    network_technology: formData.network_technology,
    contract_length: formData.contract_length,
    discount: formData.discount,
    is_favorite: formData.is_favorite,
    data_gb_europe: isUnlimitedEurope ? null : formData.data_gb_europe,
    country_zones: zones
      .filter((z) => z.country_id !== "")
      .map((z) => ({ country_id: z.country_id, data: z.rawData.trim() || null })),
  })

  const handleAdd = async () => {
    setFormData(emptyForm)
    setIsUnlimited(false)
    setIsUnlimitedEurope(false)
    setZones([])
    setErrors({})
    await fetchProviders()
    setIsAddDialogOpen(true)
  }

  const confirmAdd = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/plans_mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to add plan")
      setPlans((prev) => [...prev, data])
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: "Plan added", description: `${data.name} has been created.` })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Could not add plan", description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (plan: PlanMobile) => {
    setFeedback(null)
    setEditingPlan(plan)
    setIsUnlimited(plan.data_gb === null)
    setIsUnlimitedEurope(plan.data_gb_europe === null)
    setFormData({
      name: plan.name,
      provider_id: plan.provider_id,
      price: plan.price,
      data_gb: plan.data_gb,
      network_technology: plan.network_technology,
      contract_length: plan.contract_length,
      discount: plan.discount,
      is_favorite: plan.is_favorite,
      data_gb_europe: plan.data_gb_europe
    })
    setZones(
      (plan.country_zones ?? []).map((z) => ({
        country_id: z.country_id,
        rawData: z.data ?? "",
      }))
    )
    setErrors({})
    await fetchProviders()
    setIsEditDialogOpen(true)
  }

  const confirmEdit = async () => {
    if (!editingPlan || !validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/plans_mobile/${editingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to update plan")
      setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)))
      setIsEditDialogOpen(false)
      setEditingPlan(null)
      setFeedback({ tone: "success", title: "Plan updated", description: `${data.name}'s details were saved.` })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Could not update plan", description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (plan: PlanMobile) => {
    setPlanToDelete(plan)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!planToDelete) return
    setIsLoading(true)
    try {
      await fetch(`/api/plans_mobile/${planToDelete.id}`, { method: "DELETE" })
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id))
      setIsDeleteDialogOpen(false)
      setPlanToDelete(null)
      setFeedback({ tone: "success", title: "Plan deleted", description: `${planToDelete.name} has been removed.` })
    } catch {
      setFeedback({ tone: "destructive", title: "Could not delete plan" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async (plan: PlanMobile) => {
    try {
      const res = await fetch(`/api/plans_mobile/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !plan.is_favorite }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.message)
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setFeedback({
        tone: "success",
        title: updated.is_favorite ? "Plan favorited" : "Plan unfavorited",
        description: `${plan.name} has been ${updated.is_favorite ? "added to" : "removed from"} favorites.`,
      })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Could not update favorite", description: e instanceof Error ? e.message : undefined })
    }
  }

  const addZone = () => setZones((prev) => [...prev, emptyZone()])
  const removeZone = (i: number) => setZones((prev) => prev.filter((_, idx) => idx !== i))
  const updateZoneCountry = (i: number, country_id: string) =>
    setZones((prev) => prev.map((z, idx) => (idx === i ? { ...z, country_id } : z)))
  const updateZoneData = (i: number, rawData: string) =>
    setZones((prev) => prev.map((z, idx) => (idx === i ? { ...z, rawData } : z)))

  const columns: Column<PlanMobile>[] = [
    {
      key: "name",
      label: "Name",
      render: (value, item) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleToggleFavorite(item)} className="text-yellow-400 hover:text-yellow-500">
            <Star className={`w-4 h-4 ${item.is_favorite ? "fill-current" : ""}`} />
          </button>
          <span className="font-medium text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "provider_name",
      label: "Provider",
      render: (v) => <span className="text-muted-foreground text-sm">{v ?? "—"}</span>,
    },
    {
      key: "category_name",
      label: "Category",
      render: (v) => <span className="text-muted-foreground text-sm">{v ?? "—"}</span>,
    },
    {
      key: "price",
      label: "Price",
      render: (v) => <span className="text-muted-foreground text-sm">CHF {v}/mo</span>,
    },
    {
      key: "data_gb",
      label: "Data",
      render: (v) => <span className="text-muted-foreground text-sm">{v === null ? "Unlimited" : `${v}GB`}</span>,
    },
    {
      key: "data_gb_europe",
      label: "Data Europe",
      render: (v) => <span className="text-muted-foreground text-sm">{v === null ? "Unlimited" : `${v}GB`}</span>,
    },
    {
      key: "network_technology",
      label: "Network",
      render: (v) => <span className="text-muted-foreground text-sm">{v}</span>,
    },
    {
      key: "contract_length",
      label: "Contract",
      render: (v) => <span className="text-muted-foreground text-sm">{v > 0 ? `${v}mo` : "—"}</span>,
    },
    {
      key: "discount",
      label: "Discount",
      render: (v) => v > 0
        ? <span className="text-green-600 text-sm">{v}% off</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "country_zones",
      label: "Zones",
      render: (v) => {
        const count = Array.isArray(v) ? v.length : 0
        return <span className="text-muted-foreground text-sm">{count > 0 ? `${count} zone${count !== 1 ? "s" : ""}` : "—"}</span>
      },
    },
  ]

  const formFields = (
    <div className="flex flex-col gap-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
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
                <SelectItem key={p.id} value={p.id}>{p.name} — {p.category_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.provider_id && <p className="text-red-500 text-xs">{errors.provider_id}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
          <Label>Discount (%)</Label>
          <Input
            type="number"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Data (GB)</Label>
          <Input
            type="number"
            disabled={isUnlimited}
            value={isUnlimited ? "" : (formData.data_gb ?? "")}
            onChange={(e) => setFormData({ ...formData, data_gb: Number(e.target.value) })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Unlimited Data</Label>
          <div className="flex items-center h-10">
            <Switch
              checked={isUnlimited}
              onCheckedChange={(checked) => {
                setIsUnlimited(checked)
                if (checked) setFormData({ ...formData, data_gb: null })
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Data (GB) Europe</Label>
          <Input
            type="number"
            disabled={isUnlimitedEurope}
            value={isUnlimitedEurope ? "" : (formData.data_gb_europe ?? "")}
            onChange={(e) => setFormData({ ...formData, data_gb_europe: Number(e.target.value) })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Unlimited Data Europe</Label>
          <div className="flex items-center h-10">
            <Switch
              checked={isUnlimitedEurope}
              onCheckedChange={(checked) => {
                setIsUnlimitedEurope(checked)
                if (checked) setFormData({ ...formData, data_gb_europe: null })
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>Network Technology</Label>
          <Input
            placeholder="e.g. 4G, 5G"
            value={formData.network_technology}
            onChange={(e) => setFormData({ ...formData, network_technology: e.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>Contract (months)</Label>
          <Input
            type="number"
            value={formData.contract_length}
            onChange={(e) => setFormData({ ...formData, contract_length: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>Favorite</Label>
        <div className="flex items-center h-10">
          <Switch
            checked={formData.is_favorite}
            onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
          />
        </div>
      </div>

      {/* Country zones section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Country Zone Details</Label>
          <Button type="button" variant="outline" size="sm" onClick={addZone} className="h-7 gap-1 text-xs">
            <Plus className="w-3 h-3" /> Add Zone
          </Button>
        </div>

        {zones.length === 0 && (
          <p className="text-muted-foreground text-xs">No zone details added.</p>
        )}

        {zones.map((zone, i) => (
          <div key={i} className="border rounded-md p-3 flex flex-col gap-2 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Zone {i + 1}</span>
              <button type="button" onClick={() => removeZone(i)} className="text-red-400 hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Country</Label>
              <Select value={zone.country_id || "none"} onValueChange={(v) => updateZoneCountry(i, v === "none" ? "" : v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select country</SelectItem>
                  {countryZones.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Description</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono min-h-[72px] resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="e.g. Unlimited internet incl. 40GB at highspeed in/to 30 countries."
                value={zone.rawData}
                onChange={(e) => updateZoneData(i, e.target.value)}
              />
            </div>
          </div>
        ))}
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
        title="Mobile Plans"
        searchPlaceholder="Search plans..."
        searchFields={["name", "provider_name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        addButtonText="Add Plan"
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Mobile Plan</DialogTitle>
            <DialogDescription>Add a new mobile plan to the system.</DialogDescription>
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
            <DialogTitle>Edit Mobile Plan</DialogTitle>
            <DialogDescription>Update plan information.</DialogDescription>
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
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{planToDelete?.name}</strong>? This action cannot be undone.
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
