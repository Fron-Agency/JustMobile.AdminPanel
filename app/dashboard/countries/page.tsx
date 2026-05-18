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
import { DataTable, type Column } from "@/components/ui/data-table"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import type { Country } from "@/app/api/modules/countries/countries.type"
import { Plus, Trash2 } from "lucide-react"

const emptyForm = { name: "", countries: [] as string[] }
type FormState = typeof emptyForm

export default function CountriesPage() {
  const [zones, setZones] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ tone: FeedbackAlertTone; title: string; description?: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [countryInput, setCountryInput] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [zoneToDelete, setZoneToDelete] = useState<Country | null>(null)

  useEffect(() => {
    fetch("/api/countries")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(setZones)
      .catch((e) => setFeedback({ tone: "destructive", title: "Failed to load", description: e.message }))
      .finally(() => setIsLoading(false))
  }, [])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = "Zone name is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const addCountryTag = () => {
    const val = countryInput.trim()
    if (!val || formData.countries.includes(val)) return
    setFormData((f) => ({ ...f, countries: [...f.countries, val] }))
    setCountryInput("")
  }

  const removeCountryTag = (c: string) =>
    setFormData((f) => ({ ...f, countries: f.countries.filter((x) => x !== c) }))

  const handleAdd = () => {
    setFormData(emptyForm)
    setCountryInput("")
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const confirmAdd = async () => {
    if (!validate()) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, countries: formData.countries }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to create")
      setZones((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: "Zone created", description: data.name })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Failed to create zone", description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (zone: Country) => {
    setFormData({ name: zone.name, countries: zone.countries ?? [] })
    setCountryInput("")
    setEditingId(zone.id)
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const confirmEdit = async () => {
    if (!editingId || !validate()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/countries/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, countries: formData.countries }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? "Failed to update")
      setZones((prev) => prev.map((z) => (z.id === data.id ? data : z)))
      setIsEditDialogOpen(false)
      setFeedback({ tone: "success", title: "Zone updated", description: data.name })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Failed to update zone", description: e instanceof Error ? e.message : undefined })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (zone: Country) => {
    setZoneToDelete(zone)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!zoneToDelete) return
    setIsLoading(true)
    try {
      await fetch(`/api/countries/${zoneToDelete.id}`, { method: "DELETE" })
      setZones((prev) => prev.filter((z) => z.id !== zoneToDelete.id))
      setIsDeleteDialogOpen(false)
      setFeedback({ tone: "success", title: "Zone deleted", description: zoneToDelete.name })
    } catch {
      setFeedback({ tone: "destructive", title: "Failed to delete zone" })
    } finally {
      setIsLoading(false)
    }
  }

  const columns: Column<Country>[] = [
    {
      key: "name",
      label: "Zone Name",
      render: (v) => <span className="font-medium text-foreground">{v}</span>,
    },
    {
      key: "countries",
      label: "Countries",
      render: (v: Country["countries"]) => {
        const list = v ?? []
        if (list.length === 0) return <span className="text-muted-foreground text-sm">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {list.map((c) => (
              <span key={c} className="text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">
                {c}
              </span>
            ))}
          </div>
        )
      },
    },
  ]

  const formFields = (
    <div className="flex flex-col gap-4 py-2">
      <div className="flex flex-col gap-1">
        <Label>Zone Name</Label>
        <Input
          placeholder="e.g. Europe Zone A"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <Label>Countries</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Type a country and press Enter or Add"
            value={countryInput}
            onChange={(e) => setCountryInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCountryTag() } }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addCountryTag}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.countries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {formData.countries.map((c) => (
              <span
                key={c}
                className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-foreground"
              >
                {c}
                <button type="button" onClick={() => removeCountryTag(c)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
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
        data={zones}
        columns={columns}
        title="Country Zones"
        searchPlaceholder="Search zones..."
        searchFields={["name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        addButtonText="Add Zone"
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Country Zone</DialogTitle>
            <DialogDescription>Create a zone like "Europe Zone A" and list the countries in it.</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Country Zone</DialogTitle>
            <DialogDescription>Update zone name and countries.</DialogDescription>
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
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{zoneToDelete?.name}</strong>? Plans using this zone will have their country zone cleared.
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
