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
import type { User } from "@/app/api/modules/users/users.type"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Field, FieldLabel } from "@/components/ui/field"

const roleConfig: Record<User["role"], { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  agent: { label: "Agent", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  viewer: { label: "Viewer", className: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
}

const emptyUser: Omit<User, "id" | "created_at"> = {
  fullname: "",
  email: "",
  role: "viewer",
  is_active: true,
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)
    const [formData, setFormData] = useState(emptyUser)
    const [isLoading, setIsLoading] = useState(true)
    const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({})

  const handleAdd = () => {
    setFormData(emptyUser)
    setIsAddDialogOpen(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    })
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
        throw new Error(errorText || "Failed to update user status")
      }

      const updated = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
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
      label: "Name",
      render: (value) => <span className="font-medium text-foreground">{value}</span>,
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
        <Badge className={roleConfig[value as User["role"]].className}>
          {roleConfig[value as User["role"]].label}
        </Badge>
      ),
    },
    {
      key: "is_active",
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
      key: "created_at",
      label: "Created",
      render: (value) => <span className="text-muted-foreground text-sm">{value}</span>,
      hidden: true,
    },
  ]

  const confirmAdd = async () => {
    const res = await fetch("/api/users", {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })

    const created = await res.json()

    setUsers((prev) => [...prev, created])
    setIsAddDialogOpen(false)
  }

  const confirmEdit = async () => {
        if (!editingUser) return

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
            throw new Error(errorText || "Failed to update user")
        }


        const updated = await res.json()

        setUsers((prev) =>
            prev.map((u) => (u.id === updated.id ? updated : u))
        )

            setIsEditDialogOpen(false)
            setEditingUser(null)
    }


  const confirmDelete = async () => {
    if (!userToDelete) return

    await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
    })

    setUsers((prev) =>
        prev.filter((user) => user.id !== userToDelete.id)
    )

    setIsDeleteDialogOpen(false)
    setUserToDelete(null)
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
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-28" />
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="grid grid-cols-6 gap-4 items-center">
                  <Skeleton className="h-8 col-span-2" />
                  <Skeleton className="h-8 col-span-2" />
                  <Skeleton className="h-8 col-span-1" />
                  <Skeleton className="h-8 col-span-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          data={users}
          columns={columns}
          title="Users"
          searchPlaceholder="Search users..."
          searchFields={["fullname", "email", "role"]}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          addButtonText="Add User"
        />
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Add a new user to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullname" className="text-right">
                Full Name
              </Label>
              <Input
                id="fullname"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: User["role"]) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmAdd}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-fullname" className="text-right">
                Full Name
              </Label>
              <Input
                id="edit-fullname"
                value={formData.fullname}
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: User["role"]) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={confirmEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.fullname}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}