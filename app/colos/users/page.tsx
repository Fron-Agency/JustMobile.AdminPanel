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
import type { ColosUserDto, ColosUserRole } from "@/app/api/modules/colos/colos-users.type"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Field, FieldLabel } from "@/components/ui/field"
import { FeedbackAlert, type FeedbackAlertTone } from "@/components/ui/feedback-alert"

const roleConfig: Record<ColosUserRole, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  USER: { label: "User", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
}

type FormState = {
  name: string
  email: string
  role: ColosUserRole
  password: string
}

const emptyForm: FormState = {
  name: "",
  email: "",
  role: "USER",
  password: "",
}

export default function ColosUsersPage() {
  const [users, setUsers] = useState<ColosUserDto[]>([])
  const [editingUser, setEditingUser] = useState<ColosUserDto | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ColosUserDto | null>(null)
  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    tone: FeedbackAlertTone
    title: string
    description?: string
  } | null>(null)

  const validateForm = (requirePassword: boolean) => {
    const newErrors: Record<string, string> = {}
    if (!formData.email.trim()) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email address"
    if (!formData.role) newErrors.role = "Role is required"
    if (requirePassword && !formData.password.trim()) newErrors.password = "Password is required"
    else if (formData.password && formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAdd = () => {
    setFormData(emptyForm)
    setErrors({})
    setIsAddDialogOpen(true)
  }

  const handleEdit = (user: ColosUserDto) => {
    setFeedback(null)
    setEditingUser(user)
    setFormData({
      name: user.name ?? "",
      email: user.email,
      role: user.role,
      password: "",
    })
    setErrors({})
    setIsEditDialogOpen(true)
  }

  const handleDelete = (user: ColosUserDto) => {
    setUserToDelete(user)
    setIsDeleteDialogOpen(true)
  }

  const handleToggleActive = async (user: ColosUserDto, isActive: boolean) => {
    setToggleLoading((prev) => ({ ...prev, [user.id]: true }))

    try {
      const res = await fetch(`/api/colos/users/${user.id}/active`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: isActive }),
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(errorText || "Failed to update user status")
      }

      const updated = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setFeedback({
        tone: "success",
        title: isActive ? "User activated" : "User deactivated",
        description: `${user.name || user.email} is now ${isActive ? "active" : "inactive"}.`,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong"
      setFeedback({
        tone: "destructive",
        title: "Could not update status",
        description: message,
      })
    } finally {
      setToggleLoading((prev) => ({ ...prev, [user.id]: false }))
    }
  }

  const columns: Column<ColosUserDto>[] = [
    {
      key: "name",
      label: "Name",
      render: (value) => <span className="font-medium text-foreground">{value || "—"}</span>,
    },
    {
      key: "email",
      label: "Email",
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
    },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <Badge className={roleConfig[value as ColosUserRole].className}>
          {roleConfig[value as ColosUserRole].label}
        </Badge>
      ),
    },
    {
      key: "isActive",
      label: "Active",
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
              <FieldLabel>{value ? "On" : "Off"}</FieldLabel>
            )}
          </Field>
        )
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value: string) => <span className="text-muted-foreground text-sm">{new Date(value).toLocaleString()}</span>,
      hidden: true,
    },
  ]

  const confirmAdd = async () => {
    if (!validateForm(true)) return
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/colos/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not add user",
          description: errorText || "Request failed",
        })
        return
      }

      const created = await res.json()
      setUsers((prev) => [created, ...prev])
      setIsAddDialogOpen(false)
      setFeedback({
        tone: "success",
        title: "User added",
        description: `${created.name || created.email} has been created.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmEdit = async () => {
    if (!editingUser) return
    if (!validateForm(false)) return
    setIsSubmitting(true)

    try {
      const payload: Partial<FormState> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }
      if (formData.password) payload.password = formData.password

      const res = await fetch(`/api/colos/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not update user",
          description: errorText || "Request failed",
        })
        return
      }

      const updated = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setIsEditDialogOpen(false)
      setEditingUser(null)
      setFeedback({
        tone: "success",
        title: "User updated",
        description: `${updated.name || updated.email}'s details were saved.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!userToDelete) return
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/colos/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorText = await res.text()
        setFeedback({
          tone: "destructive",
          title: "Could not delete user",
          description: errorText || "Request failed",
        })
        return
      }

      const label = userToDelete.name || userToDelete.email
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id))
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
      setFeedback({
        tone: "success",
        title: "User deleted",
        description: `${label} has been removed.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    fetch("/api/colos/users")
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
      <DataTable
        data={users}
        columns={columns}
        title="Users"
        searchPlaceholder="Search users..."
        searchFields={["name", "email", "role"]}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        addButtonText="Add User"
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Add a new Colos user.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Full Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.role}
                  onValueChange={(value: ColosUserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <div className="col-span-3">
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Full Name
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.role}
                  onValueChange={(value: ColosUserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right">
                Password
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit} disabled={isSubmitting}>
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.name || userToDelete?.email}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
