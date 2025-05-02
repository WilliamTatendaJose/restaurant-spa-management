"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, Plus, Trash2, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
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

interface UserData {
  id: string
  name: string
  email: string
  role: string
  status: string
  department?: string
}

export function UserSettings() {
  const { toast } = useToast()
  const { userDetails, hasPermission } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [userList, setUserList] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff",
    department: "both",
    password: "",
    confirmPassword: "",
  })

  // Fetch users from Supabase
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("user_profiles").select("*").order("name")

      if (error) {
        throw error
      }

      setUserList(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "staff",
      department: "both",
      password: "",
      confirmPassword: "",
    })
    setIsEditMode(false)
    setSelectedUserId(null)
  }

  const handleEditUser = (user: UserData) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "both",
      password: "",
      confirmPassword: "",
    })
    setIsEditMode(true)
    setSelectedUserId(user.id)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (userId: string) => {
    setSelectedUserId(userId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!selectedUserId) return

    try {
      // First delete the auth user
      const { error: authError } = await supabase.functions.invoke("delete-user", {
        body: { userId: selectedUserId },
      })

      if (authError) {
        throw authError
      }

      // Then delete the user profile
      const { error: profileError } = await supabase.from("user_profiles").delete().eq("id", selectedUserId)

      if (profileError) {
        throw profileError
      }

      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      })

      // Refresh the user list
      fetchUsers()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedUserId(null)
    }
  }

  const handleSubmit = async () => {
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    try {
      if (isEditMode && selectedUserId) {
        // Update existing user
        const updateData = {
          name: formData.name,
          role: formData.role,
          department: formData.department,
        }

        const { error } = await supabase.from("user_profiles").update(updateData).eq("id", selectedUserId)

        if (error) throw error

        // Update password if provided
        if (formData.password) {
          const { error: passwordError } = await supabase.functions.invoke("update-user-password", {
            body: { userId: selectedUserId, password: formData.password },
          })

          if (passwordError) throw passwordError
        }

        toast({
          title: "User updated",
          description: "The user has been updated successfully.",
        })
      } else {
        // Create new user
        // First create auth user
        const { data: authData, error: authError } = await supabase.functions.invoke("create-user", {
          body: { email: formData.email, password: formData.password },
        })

        if (authError || !authData?.id) {
          throw authError || new Error("Failed to create user")
        }

        // Then create user profile
        const { error: profileError } = await supabase.from("user_profiles").insert({
          id: authData.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          status: "active",
        })

        if (profileError) throw profileError

        toast({
          title: "User added",
          description: "The new user has been added successfully.",
        })
      }

      // Reset form and close dialog
      resetForm()
      setIsDialogOpen(false)

      // Refresh the user list
      fetchUsers()
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save user. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Check if current user has admin permissions
  const canManageUsers = hasPermission("admin")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </div>
        {canManageUsers && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit User" : "Add New User"}</DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Update user details and permissions."
                    : "Create a new user account with specific permissions."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    disabled={isEditMode} // Can't change email for existing users
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spa">Spa</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    {isEditMode ? "New Password (leave blank to keep current)" : "Password"}
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isEditMode ? "Enter new password" : "Enter password"}
                    required={!isEditMode}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm password"
                    required={!isEditMode || !!formData.password}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>{isEditMode ? "Update User" : "Add User"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p>Loading users...</p>
          </div>
        ) : userList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No users found</h3>
            <p className="text-muted-foreground">Add users to manage access to the system.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {canManageUsers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "default" : user.role === "manager" ? "secondary" : "outline"}
                    >
                      {user.role === "admin" ? "Administrator" : user.role === "manager" ? "Manager" : "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.department ? (
                      <Badge variant="outline">
                        {user.department === "both"
                          ? "Spa & Restaurant"
                          : user.department === "spa"
                            ? "Spa"
                            : "Restaurant"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === "active" ? "success" : "secondary"}>{user.status}</Badge>
                  </TableCell>
                  {canManageUsers && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user.id)}
                          disabled={user.id === userDetails?.id} // Can't delete yourself
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and remove their access to the
              system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
