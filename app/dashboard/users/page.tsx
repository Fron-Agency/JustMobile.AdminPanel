"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
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
import type { User } from "@/app/api/modules/users/users.type"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Field, FieldLabel } from "@/components/ui/field"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"

const roleClassNames: Record<User["role"], string> = {
  admin: "bg-green-500/10 text-green-600 border-green-500/20",
  agent: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  viewer: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const emptyUser: Omit<User, "id" | "created_at"> = {
  fullname: "",
  email: "",
  role: "viewer",
  is_active: true,
}

export default function UsersPage() {
    const t = useTranslations("Users")

    const [users, setUsers] = useState<User[]>([])
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [formData, setFormData] = useState(emptyUser)
    const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [feedback, setFeedback] = useState<{
      tone: FeedbackAlertTone
      title: string
      description?: string
    } | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullname.trim()) newErrors.fullname = t("fullNameRequired")
    if (!formData.email.trim()) newErrors.email = t("emailRequired")
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t("invalidEmail")
    if (!formData.role) newErrors.role = t("roleRequired")
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyUser)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setFeedback(null)
    setEditingUser(user)
    setFormData({
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      // first_login_executed: user.first_login_executed
    })
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleActive = async (user: User, isActive: boolean) => {
    setToggleLoading((prev) => ({ ...prev, [user.id]: true }))

    try {
      const res = await fetch(`/api/users/${user.id}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || t("failedToUpdateStatus"))
      }

      const updated = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setFeedback({
        tone: "success",
        title: isActive ? t("userActivated") : t("userDeactivated"),
        description: t("accountStatusDescription", { name: user.fullname, status: isActive ? t("active") : t("inactive") }),
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : t("somethingWentWrong")
      setFeedback({
        tone: "destructive",
        title: t("couldNotUpdateStatus"),
        description: message,
      })
    } finally {
      setToggleLoading((prev) => ({ ...prev, [user.id]: false }))
    }
  }

  const handleView = (user: User) => {
    // Handle view logic here
  }

  const columns: Column<User>[] = [
    {
      key: "fullname",
      label: t("columns.name"),
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
    },
    {
      key: "email",
      label: t("columns.email"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "role",
      label: t("columns.role"),
      render: (value) => (
        <Badge className={roleClassNames[value as User["role"]]}>
          {t(`roles.${value as User["role"]}`)}
        </Badge>
      ),
    },
    {
      key: "is_active",
      label: t("columns.active"),
      render: (value, item) => {
        const isToggling = toggleLoading[item.id]
        return (
          <Field orientation="horizontal">
            <Switch
              checked={value}
              disabled={isToggling}
              onCheckedChange={(checked) => handleToggleActive(item, checked === true)}
            />
            {isToggling ? (
              <Spinner className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FieldLabel>{value ? t("on") : t("off")}</FieldLabel>
            )}
          </Field>
        )
      },
    },
    {
      key: "created_at",
      label: t("columns.created"),
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
      hidden: true,
    },
  ]

  const confirmAdd = async () => {
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })

    if (!res.ok) {
      const errorText = await res.text()
      setFeedback({
        tone: "destructive",
        title: t("couldNotAddUser"),
        description: errorText || t("requestFailed"),
      })
      return
    }

    const created = await res.json()

    setUsers((prev) => [...prev, created])
    setIsAddDialogOpen(false)
    setFeedback({
      tone: "success",
      title: t("userAdded"),
      description: t("userCreatedDescription", { name: created.fullname }),
    })
    } finally {
      setIsLoading(false)
    }
  }

  const confirmEdit = async () => {
    if (!editingUser) return
    if (!validateForm()) return
    setIsLoading(true)

    try{
      const payload: Partial<typeof formData> = {
        fullname: formData.fullname,
        email: formData.email,
        role: formData.role,
        // is_active: formData.is_active,
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotUpdateUser"),
          description: errorText || t("requestFailed"),
        })
        return
      }


      const updated = await res.json()

      setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u))
      )

      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFeedback({
        tone: "success",
        title: t("userUpdated"),
        description: t("userUpdatedDescription", { name: updated.fullname }),
      })
    } finally {
      setIsLoading(false);
    }
  }


  const confirmDelete = async () => {
    if (!userToDelete) return
    setIsLoading(true);

    try{
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: t("couldNotDeleteUser"),
          description: errorText || t("requestFailed"),
        })
        return
      }

      const name = userToDelete.fullname
      setUsers((prev) =>
          prev.filter((user) => user.id !== userToDelete.id)
      )

      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      setFeedback({
        tone: "success",
        title: t("userDeleted"),
        description: t("userDeletedDescription", { name }),
      })
    } finally {
      setIsLoading(false);
    }
  }

    useEffect(() => {
        setIsLoading(true)
        fetch("/api/users")
            .then((res) => res.json())
            .then(setUsers)
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
        <p className="mb-4 text-sm text-muted-foreground">
          {t("firstPasswordNote")}
        </p>
        <DataTable
          data={users}
          columns={columns}
          title={t("table.title")}
          searchPlaceholder={t("table.searchPlaceholder")}
          searchFields={["fullname", "email", "role"]}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          isLoading={isLoading}
          addButtonText={t("table.addButton")}
        />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("addDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullname" className="text-right">
                {t("form.fullName")}
              </Label>
              <div className="col-span-3">
                <Input
                  id="fullname"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className={errors.fullname ? "border-red-500" : ""}
                />
                {errors.fullname && <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                {t("form.email")}
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                {t("form.role")}
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.role}
                  onValueChange={(value: User["role"]) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                    <SelectItem value="agent">{t("roles.agent")}</SelectItem>
                    <SelectItem value="viewer">{t("roles.viewer")}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isLoading}>
              { isLoading ? t("addDialog.adding") : t("addDialog.addUser") }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("editDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-fullname" className="text-right">
                {t("form.fullName")}
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-fullname"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                  className={errors.fullname ? "border-red-500" : ""}
                />
                {errors.fullname && <p className="text-red-500 text-sm mt-1">{errors.fullname}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                {t("form.email")}
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                {t("form.role")}
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.role}
                  onValueChange={(value: User["role"]) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                    <SelectItem value="agent">{t("roles.agent")}</SelectItem>
                    <SelectItem value="viewer">{t("roles.viewer")}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isLoading}>
              { isLoading ? t("editDialog.saving") : t("editDialog.saveChanges") }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: userToDelete?.fullname ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isLoading}>
              { isLoading ? t("deleteDialog.deleting") : t("deleteDialog.delete") }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
