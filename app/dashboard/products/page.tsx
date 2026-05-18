"use client"

import { useEffect, useRef, useState } from "react"
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
import type { Product, ProductColor } from "@/app/api/modules/products/products.type"
import { Button } from "@/components/ui/button"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"
import { Trash2, Plus, ImagePlus, Star } from "lucide-react"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const BUCKET = "product-photos"

function photoUrl(fileName: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`
}

type MobilePlan = { id: string; name: string; provider_name: string; category_name: string }
type HomePlan = { id: string; name: string }

type PhotoForm = {
  id?: string
  file?: File
  preview?: string
  file_url: string
  is_primary: boolean
  sort_order: number
}

type ColorForm = {
  id?: string
  name: string
  hex_code: string
  is_active: boolean
  photos: PhotoForm[]
}

const emptyProduct = {
  plan_mobile_id: null as string | null,
  plan_home_id: null as string | null,
  name: "",
  brand: "",
  model: "",
  description: "",
  base_price: 0,
  is_active: true,
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [mobilePlans, setMobilePlans] = useState<MobilePlan[]>([])
  const [homePlans, setHomePlans] = useState<HomePlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isColorsDialogOpen, setIsColorsDialogOpen] = useState(false)

  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [managingColorsFor, setManagingColorsFor] = useState<Product | null>(null)

  const [formData, setFormData] = useState(emptyProduct)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Colors used in Add dialog
  const [addColors, setAddColors] = useState<ColorForm[]>([])
  const [addColorErrors, setAddColorErrors] = useState<Record<number, Record<string, string>>>({})

  // Colors used in the manage-colors dialog (for existing products)
  const [colors, setColors] = useState<ColorForm[]>([])
  const [colorErrors, setColorErrors] = useState<Record<number, Record<string, string>>>({})

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const validateProductForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.brand.trim()) newErrors.brand = "Brand is required"
    if (!formData.model.trim()) newErrors.model = "Model is required"
    if (formData.base_price < 0) newErrors.base_price = "Base price must be >= 0"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateColors = (cols: ColorForm[], setErr: (e: Record<number, Record<string, string>>) => void) => {
    const newErrors: Record<number, Record<string, string>> = {}
    cols.forEach((c, i) => {
      const errs: Record<string, string> = {}
      if (!c.name.trim()) errs.name = "Color name is required"
      if (!c.hex_code.trim()) errs.hex_code = "Hex code is required"
      if (Object.keys(errs).length) newErrors[i] = errs
    })
    setErr(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Name",
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
      key: "brand",
      label: "Brand",
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "model",
      label: "Model",
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "plan_mobile_name",
      label: "Mobile Plan",
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "plan_home_name",
      label: "Home Plan",
      render: (value) => <span className="text-muted-foreground text-sm">{value ?? "—"}</span>,
    },
    {
      key: "base_price",
      label: "Base Price",
      render: (value) => <span className="text-muted-foreground text-sm">CHF {value}</span>,
    },
    {
      key: "colors",
      label: "Colors",
      render: (value: ProductColor[]) => (
        <span className="text-muted-foreground text-sm">{value?.length ?? 0} color(s)</span>
      ),
    },
    {
      key: "is_active",
      label: "Active",
      render: (value) => (
        <span className={`text-sm ${value ? "text-green-600" : "text-muted-foreground"}`}>
          {value ? "Yes" : "No"}
        </span>
      ),
    },
  ]

  const loadPlans = async () => {
    if (mobilePlans.length > 0 && homePlans.length > 0) return
    const [mobileRes, homeRes] = await Promise.all([
      fetch("/api/plans_mobile"),
      fetch("/api/plans_home"),
    ])
    const mobileData = await mobileRes.json()
    const homeData = await homeRes.json()
    setMobilePlans(mobileData.map((p: any) => ({ id: p.id, name: p.name, provider_name: p.provider_name, category_name: p.category_name })))
    setHomePlans(homeData.map((p: any) => ({ id: p.id, name: p.name })))
  }

  const handleAdd = async () => {
    setFormData(emptyProduct)
    setErrors({})
    setAddColors([])
    setAddColorErrors({})
    await loadPlans()
    setIsAddDialogOpen(true)
  }

  const handleEdit = async (product: Product) => {
    setFeedback(null)
    setEditingProduct(product)
    setFormData({
      plan_mobile_id: product.plan_mobile_id,
      plan_home_id: product.plan_home_id,
      name: product.name,
      brand: product.brand,
      model: product.model,
      description: product.description ?? "",
      base_price: product.base_price,
      is_active: product.is_active,
    })
    setErrors({})
    await loadPlans()
    setIsEditDialogOpen(true)
  }

  const handleDelete = (product: Product) => {
    setProductToDelete(product)
    setIsDeleteDialogOpen(true)
  }

  const handleView = (product: Product) => {
    setManagingColorsFor(product)
    setColors(
      product.colors.map((c) => ({
        id: c.id,
        name: c.name,
        hex_code: c.hex_code,
        is_active: c.is_active,
        photos: c.photos.map((ph) => ({
          id: ph.id,
          file_url: ph.file_url,
          preview: photoUrl(ph.file_url),
          is_primary: ph.is_primary,
          sort_order: ph.sort_order,
        })),
      }))
    )
    setColorErrors({})
    setIsColorsDialogOpen(true)
  }

  const uploadPhoto = async (productId: string, file: File): Promise<string> => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch(`/api/products/${productId}/photos/upload`, { method: "POST", body: fd })
    if (!res.ok) throw new Error("Photo upload failed")
    const { file_url } = await res.json()
    return file_url
  }

  const saveColorsToServer = async (productId: string, colorList: ColorForm[]) => {
    for (const color of colorList) {
      let colorId = color.id
      if (colorId) {
        await fetch(`/api/products/${productId}/colors/${colorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: color.name, hex_code: color.hex_code, is_active: color.is_active }),
        })
      } else {
        const res = await fetch(`/api/products/${productId}/colors`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: color.name, hex_code: color.hex_code, is_active: color.is_active }),
        })
        const created = await res.json()
        colorId = created.id
      }

      for (let pi = 0; pi < color.photos.length; pi++) {
        const photo = color.photos[pi]
        if (photo.id) continue // already persisted; skip (manage via separate edit if needed)
        const file_url = photo.file
          ? await uploadPhoto(productId, photo.file)
          : photo.file_url
        await fetch(`/api/products/${productId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            color_id: colorId,
            file_url,
            is_primary: photo.is_primary,
            sort_order: photo.sort_order,
          }),
        })
      }
    }
  }

  const confirmAdd = async () => {
    if (!validateProductForm()) return
    if (!validateColors(addColors, setAddColorErrors)) return
    setIsLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          plan_mobile_id: formData.plan_mobile_id || null,
          plan_home_id: formData.plan_home_id || null,
          description: formData.description || null,
        }),
      })
      const created = await res.json()
      if (!res.ok) {
        setFeedback({ tone: "destructive", title: "Could not add product", description: created.message || "Request failed" })
        return
      }

      if (addColors.length > 0) {
        await saveColorsToServer(created.id, addColors)
      }

      // Build full product client-side — avoids an authenticated re-fetch
      const full: Product = {
        ...created,
        colors: addColors.map((c, ci) => ({
          id: c.id ?? `temp-${ci}`,
          name: c.name,
          hex_code: c.hex_code,
          is_active: c.is_active,
          photos: c.photos.map((ph, pi) => ({
            id: ph.id ?? `temp-photo-${pi}`,
            file_url: ph.file_url,
            is_primary: ph.is_primary,
            sort_order: ph.sort_order,
          })),
        })),
      }
      setProducts((prev) => [...prev, full])
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: "Product added", description: `${full.name} has been created.` })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Could not add product", description: e instanceof Error ? e.message : "Request failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmEdit = async () => {
    if (!editingProduct) return
    if (!validateProductForm()) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          plan_mobile_id: formData.plan_mobile_id || null,
          plan_home_id: formData.plan_home_id || null,
          description: formData.description || null,
        }),
      })
      const updated = await res.json()
      if (!res.ok) {
        setFeedback({ tone: "destructive", title: "Could not update product", description: updated.message || "Request failed" })
        return
      }
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      setFeedback({ tone: "success", title: "Product updated", description: `${updated.name}'s details were saved.` })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Could not update product", description: e instanceof Error ? e.message : "Request failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!productToDelete) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setFeedback({ tone: "destructive", title: "Could not delete product", description: err.message || "Request failed" })
        return
      }
      const name = productToDelete.name
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
      setFeedback({ tone: "success", title: "Product deleted", description: `${name} has been removed.` })
    } catch (e) {
      setFeedback({ tone: "destructive", title: "Could not delete product", description: e instanceof Error ? e.message : "Request failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const saveColors = async () => {
    if (!managingColorsFor) return
    if (!validateColors(colors, setColorErrors)) return
    setIsLoading(true)
    try {
      const productId = managingColorsFor.id
      const existing = managingColorsFor.colors.map((c) => c.id)
      const kept = colors.filter((c) => c.id).map((c) => c.id!)
      const toDelete = existing.filter((id) => !kept.includes(id))

      for (const id of toDelete) {
        await fetch(`/api/products/${productId}/colors/${id}`, { method: "DELETE" })
      }

      await saveColorsToServer(productId, colors)

      const refreshed = await fetch(`/api/products/${productId}`)
      const updated: Product = await refreshed.json()
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setIsColorsDialogOpen(false)
      setManagingColorsFor(null)
      setFeedback({ tone: "success", title: "Colors saved", description: `Colors for ${updated.name} have been updated.` })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/products")
        setProducts(await res.json())
      } catch (error) {
        console.error("Failed to fetch products", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const productFormFields = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Mobile Plan</Label>
        <div className="col-span-3">
          <Select
            value={formData.plan_mobile_id ?? "none"}
            onValueChange={(v) => setFormData({ ...formData, plan_mobile_id: v === "none" ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {mobilePlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name} - {p.provider_name} - {p.category_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Home Plan</Label>
        <div className="col-span-3">
          <Select
            value={formData.plan_home_id ?? "none"}
            onValueChange={(v) => setFormData({ ...formData, plan_home_id: v === "none" ? null : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {homePlans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Name</Label>
        <div className="col-span-3">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Brand</Label>
        <div className="col-span-3">
          <Input
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            className={errors.brand ? "border-red-500" : ""}
          />
          {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Model</Label>
        <div className="col-span-3">
          <Input
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className={errors.model ? "border-red-500" : ""}
          />
          {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Description</Label>
        <div className="col-span-3">
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Base Price</Label>
        <div className="col-span-3">
          <Input
            type="number"
            value={formData.base_price}
            onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
            className={errors.base_price ? "border-red-500" : ""}
          />
          {errors.base_price && <p className="text-red-500 text-sm mt-1">{errors.base_price}</p>}
        </div>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Active</Label>
        <div className="col-span-3">
          <Switch
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
        </div>
      </div>
    </div>
  )

  const renderColorEditor = (
    colorList: ColorForm[],
    setColorList: (c: ColorForm[]) => void,
    errs: Record<number, Record<string, string>>,
    refPrefix: string,
  ) => (
    <div className="space-y-3">
      {colorList.map((color, ci) => (
        <div key={ci} className="border rounded-md p-3 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{color.name || `Color ${ci + 1}`}</span>
            <button
              type="button"
              onClick={() => setColorList(colorList.filter((_, idx) => idx !== ci))}
              className="text-destructive hover:opacity-70"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Color Name</Label>
              <Input
                value={color.name}
                onChange={(e) => {
                  const next = [...colorList]
                  next[ci] = { ...next[ci], name: e.target.value }
                  setColorList(next)
                }}
                className={errs[ci]?.name ? "border-red-500" : ""}
              />
              {errs[ci]?.name && <p className="text-red-500 text-xs mt-0.5">{errs[ci].name}</p>}
            </div>
            <div>
              <Label className="text-xs">Hex Code</Label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="color"
                  value={color.hex_code || "#000000"}
                  onChange={(e) => {
                    const next = [...colorList]
                    next[ci] = { ...next[ci], hex_code: e.target.value }
                    setColorList(next)
                  }}
                  className="w-9 h-9 rounded cursor-pointer border"
                />
                <Input
                  value={color.hex_code}
                  onChange={(e) => {
                    const next = [...colorList]
                    next[ci] = { ...next[ci], hex_code: e.target.value }
                    setColorList(next)
                  }}
                  className={errs[ci]?.hex_code ? "border-red-500" : ""}
                />
              </div>
              {errs[ci]?.hex_code && <p className="text-red-500 text-xs mt-0.5">{errs[ci].hex_code}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={color.is_active}
              onCheckedChange={(checked) => {
                const next = [...colorList]
                next[ci] = { ...next[ci], is_active: checked }
                setColorList(next)
              }}
            />
            <Label className="text-xs">Active</Label>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Photos</Label>
            <div className="flex flex-wrap gap-2">
              {color.photos.map((photo, pi) => (
                <div key={pi} className="relative group w-16 h-16">
                  <img
                    src={photo.preview ?? photoUrl(photo.file_url)}
                    alt=""
                    className="w-16 h-16 object-cover rounded border"
                  />
                  {photo.is_primary && (
                    <Star className="absolute top-0.5 left-0.5 w-3 h-3 text-yellow-400 fill-current" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded flex items-center justify-center gap-1 transition-opacity">
                    <button
                      type="button"
                      title="Set primary"
                      onClick={() => {
                        const next = [...colorList]
                        next[ci] = {
                          ...next[ci],
                          photos: next[ci].photos.map((p, idx) => ({ ...p, is_primary: idx === pi })),
                        }
                        setColorList(next)
                      }}
                      className="text-yellow-300 hover:text-yellow-400"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => {
                        const next = [...colorList]
                        next[ci] = {
                          ...next[ci],
                          photos: next[ci].photos.filter((_, idx) => idx !== pi),
                        }
                        setColorList(next)
                      }}
                      className="text-red-300 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRefs.current[`${refPrefix}-${ci}`]?.click()}
                className="w-16 h-16 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { fileInputRefs.current[`${refPrefix}-${ci}`] = el }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const preview = URL.createObjectURL(file)
                  const next = [...colorList]
                  const isFirst = next[ci].photos.length === 0
                  next[ci] = {
                    ...next[ci],
                    photos: [
                      ...next[ci].photos,
                      { file, preview, file_url: "", is_primary: isFirst, sort_order: next[ci].photos.length },
                    ],
                  }
                  setColorList(next)
                  e.target.value = ""
                }}
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={() => setColorList([...colorList, { name: "", hex_code: "#000000", is_active: true, photos: [] }])}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" /> Add Color
      </Button>
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
        data={products}
        columns={columns}
        title="Products"
        searchPlaceholder="Search products..."
        searchFields={["name", "brand", "model"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        isLoading={isLoading}
        addButtonText="Add Product"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a new product with colors and photos.</DialogDescription>
          </DialogHeader>

          {productFormFields}

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Colors & Photos</p>
            {renderColorEditor(addColors, setAddColors, addColorErrors, "add")}
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={confirmAdd} disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information. To edit colors, use the View action.</DialogDescription>
          </DialogHeader>
          {productFormFields}
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Colors Dialog (via View) */}
      <Dialog open={isColorsDialogOpen} onOpenChange={setIsColorsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Colors — {managingColorsFor?.name}</DialogTitle>
            <DialogDescription>Add, edit, or remove colors and photos for this product.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {renderColorEditor(colors, setColors, colorErrors, "manage")}
          </div>
          <DialogFooter>
            <Button onClick={saveColors} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Colors"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {productToDelete?.name}? This will also remove all
              its colors and photos. This action cannot be undone.
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
