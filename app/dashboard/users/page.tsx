"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { PlusCircle, Pencil, Trash2, KeyRound } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface User {
  id: string
  name: string
  email: string
  role: string
  department?: string
  status?: string
  created_at?: string
}

interface DialogState {
  isOpen: boolean
  type: "create" | "edit" | "delete" | "reset-password"
  user?: User
}

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <UsersManagement />
    </ProtectedRoute>
  )
}

function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    type: "create"
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    department: ""
  })
  const { toast } = useToast()
  const { isOnline } = useAuth()

  // Fetch users
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Load users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Handle dialog open/close
  const openDialog = (type: DialogState["type"], user?: User) => {
    if (type === "create") {
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "staff",
        department: ""
      })
    } else if (type === "edit" && user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        department: user.department || ""
      })
    } else if (type === "reset-password") {
      setFormData({
        ...formData,
        password: ""
      })
    }

    setDialogState({
      isOpen: true,
      type,
      user
    })
  }

  const closeDialog = () => {
    setDialogState({ ...dialogState, isOpen: false })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { type, user } = dialogState

    try {
      let response

      if (type === "create") {
        response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData)
        })
      } else if (type === "edit" && user) {
        const { password, ...updateData } = formData
        response = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData)
        })
      } else if (type === "delete" && user) {
        response = await fetch(`/api/users/${user.id}`, {
          method: "DELETE"
        })
      } else if (type === "reset-password" && user) {
        response = await fetch(`/api/users/${user.id}/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: formData.password })
        })
      }

      if (!response?.ok) {
        const errorData = await response?.json()
        throw new Error(errorData?.message || "Operation failed")
      }

      toast({
        title: "Success",
        description: type === "create"
          ? "User created successfully"
          : type === "edit"
            ? "User updated successfully"
            : type === "delete"
              ? "User deleted successfully"
              : "Password reset successfully"
      })

      // Refresh the user list
      fetchUsers()
      closeDialog()
    } catch (error: any) {
      console.error(`Error ${type}ing user:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${type} user`,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage system users and their permissions</CardDescription>
          </div>
          <Button 
            onClick={() => openDialog("create")}
            disabled={!isOnline}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {!isOnline && (
            <div className="mb-4 rounded-md bg-yellow-50 p-4 text-yellow-700">
              <p className="font-medium">Offline Mode</p>
              <p className="text-sm">User management is only available when online. The system will sync changes when you're back online.</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <div className="animate-spin text-primary">Loading...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          user.role === "admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : user.role === "manager" 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-green-100 text-green-800"
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog("edit", user)}
                            disabled={!isOnline}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog("reset-password", user)}
                            disabled={!isOnline}
                          >
                            <KeyRound className="h-4 w-4" />
                            <span className="sr-only">Reset Password</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => openDialog("delete", user)}
                            disabled={!isOnline}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={dialogState.isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === "create"
                ? "Add New User"
                : dialogState.type === "edit"
                  ? "Edit User"
                  : dialogState.type === "delete"
                    ? "Delete User"
                    : "Reset Password"}
            </DialogTitle>
            <DialogDescription>
              {dialogState.type === "create"
                ? "Create a new user account with appropriate permissions."
                : dialogState.type === "edit"
                  ? "Modify user details and permissions."
                  : dialogState.type === "delete"
                    ? "Are you sure you want to delete this user? This action cannot be undone."
                    : "Enter a new password for this user."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {dialogState.type !== "delete" && (
              <div className="grid gap-4 py-4">
                {/* Name and Email Fields */}
                {(dialogState.type === "create" || dialogState.type === "edit") && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="col-span-3"
                        required
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="col-span-3"
                        required
                      />
                    </div>
                  </>
                )}

                {/* Password field for create and reset password */}
                {(dialogState.type === "create" || dialogState.type === "reset-password") && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="col-span-3"
                      required
                      minLength={8}
                    />
                  </div>
                )}

                {/* Role and Department for create and edit */}
                {(dialogState.type === "create" || dialogState.type === "edit") && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role" className="text-right">
                        Role
                      </Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData({ ...formData, role: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrator</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="department" className="text-right">
                        Department
                      </Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="spa">Spa</SelectItem>
                          <SelectItem value="admin">Administration</SelectItem>
                          <SelectItem value="reception">Reception</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={dialogState.type === "delete" ? "destructive" : "default"}
              >
                {dialogState.type === "create"
                  ? "Create User"
                  : dialogState.type === "edit"
                    ? "Save Changes"
                    : dialogState.type === "delete"
                      ? "Delete User"
                      : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
