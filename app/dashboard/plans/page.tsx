"use client"

import { useEffect, useState } from "react"
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
import { Select , SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { DataTable, type Column } from "@/components/ui/data-table"
import type { Plan } from "@/app/api/modules/plans/plans.type"
import { Button } from "@/components/ui/button"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import ReactSelect from "react-select"
import { useCountries } from "@/hooks/useCountries"

const emptyPlan: Omit<Plan, "id" | "provider_name"> = {
  provider_id: "",
  price: 0,
  data_gb: 0,
  network_technology: "",
  contract_length: 0,
  name: "",
  discount: 0,
  is_favorite: false,
  countries: [],
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [providers, setProviders] = useState<any[]>([])
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)
  const [formData, setFormData] = useState(emptyPlan)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const { countries, loading } = useCountries()
  const [isUnlimited, setIsUnlimited] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.provider_id) newErrors.provider_id = "Provider is required"
    if (formData.price <= 0) newErrors.price = "Price must be greater than 0"
    // if (!isUnlimited && formData.data_gb !== null && formData.data_gb <= 0) newErrors.data_gb = "Data must be greater than 0"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = async () => {
    setFormData(emptyPlan)
    setErrors({})
    if (providers.length === 0) {
      const res = await fetch("/api/providers/category")
      setProviders(await res.json())
    }
    setIsAddDialogOpen(true)
  }

  const handleEdit = (plan: Plan) => {
    setFeedback(null)
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      provider_id: plan.provider_id,
      price: plan.price,
      data_gb: plan.data_gb,
      network_technology: plan.network_technology,
      contract_length: plan.contract_length,
      discount: plan.discount,
      is_favorite: plan.is_favorite,
      countries: plan.countries,
    })
    setSelectedCountries(plan.countries)
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const handleDelete = (plan: Plan) => {
    setPlanToDelete(plan)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleFavorite = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: !plan.is_favorite }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to update plan")
      }

      const updated = await res.json()
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setFeedback({
        tone: "success",
        title: updated.is_favorite ? "Plan favorited" : "Plan unfavorited",
        description: `${plan.name} has been ${updated.is_favorite ? "added to" : "removed from"} favorites.`,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setFeedback({
        tone: "destructive",
        title: "Could not update favorite",
        description: message,
      })
    }
  }

  const columns: Column<Plan>[] = [
  {
    key: "name",
    label: "Name",
    render: (value, item) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleToggleFavorite(item)}
          className="text-yellow-400 hover:text-yellow-500"
        >
          <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
        </button>
        <span className="font-medium text-foreground">{value}</span>
      </div>
    ),
  },
  {
    key: "provider_name",
    label: "Provider",
    render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
  },
  {
    key: "price",
    label: "Price",
    render: (value) => <span className="text-muted-foreground text-sm">CHF {value}/mo</span>,
  },
  {
    key: "data_gb",
    label: "Data",
    render: (value) => (
      <span className="text-muted-foreground text-sm">
        {value === null ? "Unlimited" : `${value}GB`}
      </span>
    ),
  },
  {
    key: "network_technology",
    label: "Network Technology",
    render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
  },
  {
    key: "contract_length",
    label: "Contract",
    render: (value) => value > 0 ? <span className="text-muted-foreground text-sm">{value}month</span> : <span className="text-muted-foreground text-sm">0 month</span>,
  },
  {
    key: "discount",
    label: "Discount",
    render: (value) => value > 0 ? <span className="text-green-600 text-sm">{value}% off</span> : <span className="text-muted-foreground text-sm">—</span>,
  },
  {
    key: "countries",
    label: "Countries",
    render: (value) => (
      <span className="text-sm text-muted-foreground">
        {value?.join(", ") ?? "—"}
      </span>
    ),
  }
]

  const handleView = (plan: Plan) => {
    // Handle view logic here
  }

  const confirmAdd = async () => {
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          {
            ...formData,
            data_gb: isUnlimited ? null : formData.data_gb,
            countries: selectedCountries,
          }
        ),
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not add plan",
          description: errorText || "Request failed",
        })
        return
      }
  
      const created = await res.json()
  
      setPlans((prev) => [...prev, created])
      setIsAddDialogOpen(false)
      setFeedback({
        tone: "success",
        title: "Plan added",
        description: `${created.name} has been created.`,
      })

    } finally{
      setIsLoading(false);
    }
  }

  const confirmEdit = async () => {
    if (!editingPlan) return
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        provider_id: formData.provider_id,
        price: formData.price,
        data_gb: isUnlimited ? null : formData.data_gb,
        network_technology: formData.network_technology,
        contract_length: formData.contract_length,
        discount: formData.discount,
        is_favorite: formData.is_favorite,
        countries: selectedCountries,
      }
  
      const res = await fetch(`/api/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not update plan",
          description: errorText || "Request failed",
        })
        return
      }
  
      const updated = await res.json()
  
      setPlans((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      )
  
      setIsEditDialogOpen(false)
      setEditingPlan(null)
      setFeedback({
        tone: "success",
        title: "Plan updated",
        description: `${updated.name}'s details were saved.`,
      })
    } finally {
      setIsLoading(false);
    }
  }

  const confirmDelete = async () => {
    if (!planToDelete) return
    setIsLoading(true);
    try{
      const res = await fetch(`/api/plans/${planToDelete.id}`, {
        method: "DELETE",
      })
  
      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not delete plan",
          description: errorText || "Request failed",
        })
        return
      }
  
      const name = planToDelete.name
      setPlans((prev) =>
        prev.filter((plan) => plan.id !== planToDelete.id)
      )
  
      setIsDeleteDialogOpen(false)
      setPlanToDelete(null)
      setFeedback({
        tone: "success",
        title: "Plan deleted",
        description: `${name} has been removed.`,
      })
    } finally{
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const plansRes = await fetch("/api/plans")
        setPlans(await plansRes.json())
      } catch (error) {
        console.error("Failed to fetch data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
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
        data={plans}
        columns={columns}
        title="Plans"
        searchPlaceholder="Search plans..."
        searchFields={["name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
        addButtonText="Add Plan"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Plan</DialogTitle>
            <DialogDescription>
              Add a new plan to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.provider_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, provider_id: value })
                  }
                >
                  <SelectTrigger className={errors.provider_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} - {p.category_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.provider_id && <p className="text-red-500 text-sm mt-1">{errors.provider_id}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <div className="col-span-3">
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">
                Discount
              </Label>
              <div className="col-span-3">
                <Input
                  id="discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="data_gb" className="text-right">
                Data (GB)
              </Label>
              <div className="col-span-3">
                <Input
                  id="data_gb"
                  type="number"
                  disabled={isUnlimited}
                  value={isUnlimited ? "" : formData.data_gb}
                  onChange={(e) =>
                    setFormData({ ...formData, data_gb: Number(e.target.value) })
                  }
                  className={errors.data_gb ? "border-red-500" : ""}
                />
                {errors.data_gb && <p className="text-red-500 text-sm mt-1">{errors.data_gb}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Unlimited</Label>
              <div className="col-span-3">
                <Switch
                  checked={isUnlimited}
                  onCheckedChange={(checked) => {
                    setIsUnlimited(checked)
                    if (checked) {
                      setFormData({ ...formData, data_gb: 0 }) // UI value
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="network_technology" className="text-right">
                Network Technology (e.g. 4G, 5G)
              </Label>
              <div className="col-span-3">
                <Input
                  id="network_technology"
                  type="text"
                  value={formData.network_technology}
                  onChange={(e) =>
                    setFormData({ ...formData, network_technology: e.target.value })
                  }
                  className={errors.network_technology ? "border-red-500" : ""}
                />
                {errors.network_technology && <p className="text-red-500 text-sm mt-1">{errors.network_technology}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contract_length" className="text-right">
                Contract (months)
              </Label>
              <div className="col-span-3">
                <Input
                  id="contract_length"
                  type="number"
                  value={formData.contract_length}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_length: Number(e.target.value) })
                  }
                  className={errors.contract_length ? "border-red-500" : ""}
                />
                {errors.contract_length && <p className="text-red-500 text-sm mt-1">{errors.contract_length}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Countries</Label>

              <div className="col-span-3">
                <ReactSelect
                  isMulti
                  isLoading={loading}
                  options={countries}
                  value={countries.filter((c) =>
                    selectedCountries.includes(c.value)
                  )}
                  onChange={(values) =>
                    setSelectedCountries(values.map((v: any) => v.value))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_favorite" className="text-right">
                Favorite
              </Label>
              <div className="col-span-3">
                <Switch
                  id="is_favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_favorite: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>
              Update plan information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
            </div>
            {/* <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-provider" className="text-right">
                Provider
              </Label>
              <div className="col-span-3">
                <ReactSelect
                  isMulti
                  options={countries}
                  value={countries.filter((c) =>
                    selectedCountries.includes(c.value)
                  )}
                  onChange={(values) =>
                    setSelectedCountries(values.map((v: any) => v.value))
                  }
                />
                {errors.provider_id && <p className="text-red-500 text-sm mt-1">{errors.provider_id}</p>}
              </div>
            </div> */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">
                Price
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) })
                  }
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-discount" className="text-right">
                Discount
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-discount"
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-data_gb" className="text-right">
                Data (GB)
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-data_gb"
                  type="number"
                  disabled={isUnlimited}
                  value={isUnlimited ? "" : formData.data_gb}
                  onChange={(e) =>
                    setFormData({ ...formData, data_gb: Number(e.target.value) })
                  }
                  className={errors.data_gb ? "border-red-500" : ""}
                />
                {errors.data_gb && <p className="text-red-500 text-sm mt-1">{errors.data_gb}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Unlimited</Label>
              <div className="col-span-3">
                <Switch
                  checked={isUnlimited}
                  onCheckedChange={(checked) => {
                    setIsUnlimited(checked)
                    if (checked) {
                      setFormData({ ...formData, data_gb: 0 }) // UI value
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-network_technology" className="text-right">
                Network Technology (e.g. 4G, 5G)
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-network_technology"
                  type="text"
                  value={formData.network_technology}
                  onChange={(e) =>
                    setFormData({ ...formData, network_technology: e.target.value })
                  }
                  className={errors.network_technology ? "border-red-500" : ""}
                />
                {errors.network_technology && <p className="text-red-500 text-sm mt-1">{errors.network_technology}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contract_length" className="text-right">
                Contract (months)
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-contract_length"
                  type="number"
                  value={formData.contract_length}
                  onChange={(e) =>
                    setFormData({ ...formData, contract_length: Number(e.target.value) })
                  }
                  className={errors.contract_length ? "border-red-500" : ""}
                />
                {errors.contract_length && <p className="text-red-500 text-sm mt-1">{errors.contract_length}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Countries</Label>
              <div className="col-span-3">
                <ReactSelect
                  isMulti
                  isLoading={loading}
                  options={countries}
                  value={countries.filter((c) => selectedCountries.includes(c.value))}
                  onChange={(values) =>
                    setSelectedCountries(values.map((v: any) => v.value))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_favorite" className="text-right">
                Favorite
              </Label>
              <div className="col-span-3">
                <Switch
                  id="edit-is_favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_favorite: checked })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              { isLoading ? "Editing..." : "Edit Plan" }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {planToDelete?.name}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              { isLoading ? "Deleting..." : "Delete" }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
