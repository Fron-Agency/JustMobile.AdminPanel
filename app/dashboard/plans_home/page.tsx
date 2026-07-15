"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
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
import type {
  PlanHomeWithProvider,
  PlanHomeJsonBlock,
  PlanHomeLocalizedBlock,
  PlanHomeContentBlock,
  PlanHomeLanguage,
} from "@/app/api/modules/plans_home/plans_home.type"
import { Plus, Trash2 } from "lucide-react"

const LANGUAGES: { code: PlanHomeLanguage; flag: string }[] = [
  { code: "en", flag: "🇬🇧" },
  { code: "de", flag: "🇩🇪" },
  { code: "fr", flag: "🇫🇷" },
  { code: "it", flag: "🇮🇹" },
]

const emptyBlock = (): PlanHomeJsonBlock => ({ title: "", features: [] })

type LocalizedBlockForm = Record<PlanHomeLanguage, PlanHomeJsonBlock>

const emptyLocalizedBlock = (): LocalizedBlockForm => ({
  en: emptyBlock(),
  de: emptyBlock(),
  fr: emptyBlock(),
  it: emptyBlock(),
})

const emptyForm = {
  name: "",
  provider_id: "",
  price: 0,
  discount_price: null as number | null,
  without_mobile_price: null as number | null,
  contract_duration: "",
  internet_content: emptyLocalizedBlock(),
  tv: emptyLocalizedBlock(),
  telephony: emptyLocalizedBlock(),
  other: emptyLocalizedBlock(),
}

type FormState = typeof emptyForm

function isLegacyBlock(block: PlanHomeContentBlock): block is PlanHomeJsonBlock {
  return "title" in block && "features" in block
}

function parseLocalizedBlock(block: PlanHomeContentBlock | null | undefined): LocalizedBlockForm {
  const empty = emptyLocalizedBlock()
  if (!block) return empty
  if (isLegacyBlock(block)) return { ...empty, en: block }
  return {
    en: block.en ?? emptyBlock(),
    de: block.de ?? emptyBlock(),
    fr: block.fr ?? emptyBlock(),
    it: block.it ?? emptyBlock(),
  }
}

function blockIsEmpty(block: PlanHomeJsonBlock) {
  return !block.title.trim() && block.features.every((f) => !f.label.trim() && !f.value.trim())
}

function serializeLocalizedBlock(block: LocalizedBlockForm): PlanHomeLocalizedBlock | null {
  const result: PlanHomeLocalizedBlock = {}
  for (const { code } of LANGUAGES) {
    if (!blockIsEmpty(block[code])) result[code] = block[code]
  }
  return Object.keys(result).length === 0 ? null : result
}

function getContentFeatureCount(block: PlanHomeContentBlock | null) {
  if (!block) return 0
  if (isLegacyBlock(block)) return block.features.length
  return Math.max(...LANGUAGES.map(({ code }) => block[code]?.features.length ?? 0), 0)
}

type PlansHomeT = ReturnType<typeof useTranslations<"PlansHome">>

function LanguageBlockEditor({
  label,
  value,
  onChange,
  t,
}: {
  label: string
  value: PlanHomeJsonBlock
  onChange: (v: PlanHomeJsonBlock) => void
  t: PlansHomeT
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
    <div className="flex flex-col gap-2">
      <div>
        <Label className="text-xs">{t("form.sectionTitle")}</Label>
        <Input
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
          placeholder={t("form.sectionTitlePlaceholder", { label })}
          className="mt-1 h-8 text-xs"
        />
      </div>
      <div className="space-y-2">
        {value.features.map((f, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Input
              value={f.label}
              onChange={(e) => updateFeature(i, "label", e.target.value)}
              placeholder={t("form.label")}
              className="h-8 text-xs"
            />
            <div className="flex gap-1 items-center">
              <Input
                value={f.value}
                onChange={(e) => updateFeature(i, "value", e.target.value)}
                placeholder={t("form.value")}
                className="h-8 text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => removeFeature(i)}
                className="text-destructive hover:opacity-70 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="gap-1 h-7 text-xs w-full">
          <Plus className="w-3 h-3" />
          {t("form.addFeature")}
        </Button>
      </div>
    </div>
  )
}

function LocalizedJsonBlockEditor({
  label,
  value,
  onChange,
  t,
}: {
  label: string
  value: LocalizedBlockForm
  onChange: (v: LocalizedBlockForm) => void
  t: PlansHomeT
}) {
  const updateLanguage = (code: PlanHomeLanguage, block: PlanHomeJsonBlock) =>
    onChange({ ...value, [code]: block })

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="grid grid-cols-4 gap-3">
        {LANGUAGES.map(({ code, flag }) => (
          <div key={code} className="border rounded-md p-2 bg-background">
            <p className="text-xs font-medium mb-2">{flag} {t(`form.languages.${code}`)}</p>
            <LanguageBlockEditor
              label={label}
              value={value[code]}
              onChange={(block) => updateLanguage(code, block)}
              t={t}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PlansHomePage() {
  const t = useTranslations("PlansHome")

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
      .catch((e) => setFeedback({ tone: "destructive", title: t("failedToLoadPlans"), description: e.message }))
      .finally(() => setIsLoading(false))
  }, [])

  const fetchProviders = async () => {
    if (providers.length > 0) return
    const res = await fetch("/api/providers/category")
    setProviders(await res.json())
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name.trim()) e.name = t("nameRequired")
    if (!formData.provider_id) e.provider_id = t("providerRequired")
    if (formData.price <= 0) e.price = t("priceGreaterThanZero")
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
    internet_content: serializeLocalizedBlock(formData.internet_content),
    tv: serializeLocalizedBlock(formData.tv),
    telephony: serializeLocalizedBlock(formData.telephony),
    other: serializeLocalizedBlock(formData.other),
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
      if (!res.ok) throw new Error(data.message ?? t("failedToCreatePlan"))
      setPlans((prev) => [data, ...prev])
      setIsAddDialogOpen(false)
      setFeedback({ tone: "success", title: t("planCreated"), description: data.name })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToCreatePlan"), description: e instanceof Error ? e.message : undefined })
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
      internet_content: parseLocalizedBlock(plan.internet_content),
      tv: parseLocalizedBlock(plan.tv),
      telephony: parseLocalizedBlock(plan.telephony),
      other: parseLocalizedBlock(plan.other),
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
      if (!res.ok) throw new Error(data.message ?? t("failedToUpdatePlan"))
      setPlans((prev) => prev.map((p) => (p.id === data.id ? data : p)))
      setIsEditDialogOpen(false)
      setFeedback({ tone: "success", title: t("planUpdated"), description: data.name })
    } catch (e) {
      setFeedback({ tone: "destructive", title: t("failedToUpdatePlan"), description: e instanceof Error ? e.message : undefined })
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
      setFeedback({ tone: "success", title: t("planDeleted"), description: planToDelete.name })
    } catch {
      setFeedback({ tone: "destructive", title: t("failedToDeletePlan") })
    } finally {
      setIsLoading(false)
    }
  }

  const columns: Column<PlanHomeWithProvider>[] = [
    {
      key: "name",
      label: t("columns.name"),
      render: (v) => <span className="font-medium text-foreground">{v}</span>,
    },
    {
      key: "provider_name",
      label: t("columns.provider"),
      render: (v) => <span className="text-muted-foreground text-sm">{v ?? "—"}</span>,
    },
    {
      key: "price",
      label: t("columns.price"),
      render: (v) => <span className="text-muted-foreground text-sm">CHF {v}/mo</span>,
    },
    {
      key: "discount_price",
      label: t("columns.discounted"),
      render: (v) => v != null
        ? <span className="text-green-600 text-sm">CHF {v}/mo</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "without_mobile_price",
      label: t("columns.withoutMobile"),
      render: (v) => v != null
        ? <span className="text-muted-foreground text-sm">CHF {v}/mo</span>
        : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: "contract_duration",
      label: t("columns.contract"),
      render: (v) => <span className="text-muted-foreground text-sm">{v ?? "—"}/mo</span>,
    },
    {
      key: "internet_content",
      label: t("columns.internet"),
      render: (v: PlanHomeWithProvider["internet_content"]) => {
        const count = getContentFeatureCount(v)
        return count > 0
          ? <span className="text-muted-foreground text-sm">{t("featuresCount", { count })}</span>
          : <span className="text-muted-foreground text-sm">—</span>
      },
    },
    {
      key: "tv",
      label: t("columns.tv"),
      render: (v: PlanHomeWithProvider["tv"]) => {
        const count = getContentFeatureCount(v)
        return count > 0
          ? <span className="text-muted-foreground text-sm">{t("featuresCount", { count })}</span>
          : <span className="text-muted-foreground text-sm">—</span>
      },
    },
    {
      key: "telephony",
      label: t("columns.telephony"),
      render: (v: PlanHomeWithProvider["telephony"]) => {
        const count = getContentFeatureCount(v)
        return count > 0
          ? <span className="text-muted-foreground text-sm">{t("featuresCount", { count })}</span>
          : <span className="text-muted-foreground text-sm">—</span>
      },
    },
    {
      key: "other",
      label: t("columns.other"),
      render: (v: PlanHomeWithProvider["other"]) => {
        const count = getContentFeatureCount(v)
        return count > 0
          ? <span className="text-muted-foreground text-sm">{t("featuresCount", { count })}</span>
          : <span className="text-muted-foreground text-sm">—</span>
      },
    }
  ]

  const formFields = (
    <div className="flex flex-col gap-6 py-2 max-h-[65vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label>{t("form.name")}</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label>{t("form.provider")}</Label>
          <Select value={formData.provider_id} onValueChange={(v) => setFormData({ ...formData, provider_id: v })}>
            <SelectTrigger className={errors.provider_id ? "border-red-500" : ""}>
              <SelectValue placeholder={t("form.selectProvider")} />
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
          <Label>{t("form.priceChf")}</Label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && <p className="text-red-500 text-xs">{errors.price}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <Label>{t("form.discountedPrice")} <span className="text-muted-foreground font-normal">{t("form.optional")}</span></Label>
          <Input
            type="number"
            placeholder="—"
            value={formData.discount_price ?? ""}
            onChange={(e) => setFormData({ ...formData, discount_price: e.target.value ? Number(e.target.value) : null })}
          />
        </div>

        <div className="flex flex-col gap-1">
          <Label>{t("form.withoutMobilePrice")} <span className="text-muted-foreground font-normal">{t("form.optional")}</span></Label>
          <Input
            type="number"
            placeholder="—"
            value={formData.without_mobile_price ?? ""}
            onChange={(e) => setFormData({ ...formData, without_mobile_price: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Label>{t("form.contractDuration")} <span className="text-muted-foreground font-normal">{t("form.optional")}</span></Label>
        <Input
          placeholder={t("form.contractDurationPlaceholder")}
          value={formData.contract_duration ?? ""}
          onChange={(e) => setFormData({ ...formData, contract_duration: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-3 mt-1">
        <p className="text-sm font-medium text-foreground">{t("form.contentSections")}</p>
        <LocalizedJsonBlockEditor
          label={t("form.internet")}
          value={formData.internet_content}
          onChange={(v) => setFormData({ ...formData, internet_content: v })}
          t={t}
        />
        <LocalizedJsonBlockEditor
          label={t("form.tv")}
          value={formData.tv}
          onChange={(v) => setFormData({ ...formData, tv: v })}
          t={t}
        />
        <LocalizedJsonBlockEditor
          label={t("form.telephony")}
          value={formData.telephony}
          onChange={(v) => setFormData({ ...formData, telephony: v })}
          t={t}
        />
        <LocalizedJsonBlockEditor
          label={t("form.other")}
          value={formData.other}
          onChange={(v) => setFormData({ ...formData, other: v })}
          t={t}
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
        title={t("table.title")}
        searchPlaceholder={t("table.searchPlaceholder")}
        searchFields={["name", "provider_name"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        addButtonText={t("table.addButton")}
      />

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("addDialog.title")}</DialogTitle>
            <DialogDescription>{t("addDialog.description")}</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              {isLoading ? t("addDialog.adding") : t("addDialog.addPlan")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
            <DialogDescription>{t("editDialog.description")}</DialogDescription>
          </DialogHeader>
          {formFields}
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              {isLoading ? t("editDialog.saving") : t("editDialog.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich("deleteDialog.description", {
                name: planToDelete?.name ?? "",
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              {isLoading ? t("deleteDialog.deleting") : t("deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
