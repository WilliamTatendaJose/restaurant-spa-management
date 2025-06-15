"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Plus, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import * as offlineAuth from "@/lib/offline-auth";
import { staffApi } from "@/lib/db";
import {
  createUser,
  listUsers,
  updateUser,
  deleteUser,
} from "@/lib/user-management";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  phone?: string; // Add phone field
}

export function UserSettings() {
  const { toast } = useToast();
  const { userDetails, hasPermission } = useAuth();

  const [userList, setUserList] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff",
    department: "both",
    phone: "", // Add phone field
    password: "",
    confirmPassword: "",
  });

  // Fetch users from offline database
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const users = await listUsers();
      
      // Fetch staff data to merge phone numbers and other details
      const staffData = await staffApi.list();
      
      // Merge user data with staff data for enhanced information
      const enhancedUsers = users.map(user => {
        const staffRecord = staffData.find((staff: any) => staff.email === user.email);
        return {
          ...user,
          phone: staffRecord?.phone || user.phone || '',
          // Add any other staff-specific data that should be displayed
        };
      });
      
      setUserList(enhancedUsers || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "staff",
      department: "both",
      phone: "", // Add phone field
      password: "",
      confirmPassword: "",
    });
    setIsEditMode(false);
    setSelectedUserId(null);
  };

  const handleEditUser = async (user: UserData) => {
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "both",
      phone: user.phone || "", // Add phone field
      password: "",
      confirmPassword: "",
    });
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;

    try {
      await deleteUser(selectedUserId);

      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      });

      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUserId(null);
    }
  };

  const handleSubmit = async () => {
    // Form validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditMode && !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }

    if (!isEditMode && !formData.password) {
      toast({
        title: "Error",
        description: "Password is required for new users.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditMode && selectedUserId) {
        // Update existing user
        const updateData = {
          id: selectedUserId,
          name: formData.name,
          role: formData.role as "admin" | "manager" | "staff",
          department: formData.department,
          phone: formData.phone, // Add phone field
        };

        await updateUser(updateData);

        // Update password if provided
        if (formData.password) {
          await offlineAuth.resetPassword(selectedUserId, formData.password);
        }

        // If role is staff, ensure they appear in staff table
        if (formData.role === 'staff') {
          try {
            const existingStaff = await staffApi.list();
            const staffExists = existingStaff.some((staff: any) => staff.email === formData.email);
            
            if (!staffExists) {
              await staffApi.create({
                name: formData.name,
                role: formData.role,
                department: formData.department,
                email: formData.email,
                phone: formData.phone, // Add phone field
                status: 'active'
              });
            } else {
              // Update existing staff record
              const existingStaffRecord = existingStaff.find((staff: any) => staff.email === formData.email);
              if (existingStaffRecord) {
                await staffApi.update(existingStaffRecord.id, {
                  name: formData.name,
                  role: formData.role,
                  department: formData.department,
                  email: formData.email,
                  phone: formData.phone || existingStaffRecord.phone, // Add phone field
                  status: 'active'
                });
              }
            }
          } catch (error) {
            console.error("Error syncing to staff table:", error);
          }
        }

        toast({
          title: "Success",
          description: "User updated successfully.",
        });
      } else {
        // Create new user
        await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role as "admin" | "manager" | "staff",
          department: formData.department,
          phone: formData.phone, // Add phone field
        });

        // If role is staff, add to staff table
        if (formData.role === 'staff') {
          try {
            await staffApi.create({
              name: formData.name,
              role: formData.role,
              department: formData.department,
              email: formData.email,
              phone: formData.phone, // Add phone field
              status: 'active'
            });
          } catch (error) {
            console.error("Error adding to staff table:", error);
          }
        }

        toast({
          title: "Success",
          description: "New user created successfully.",
        });
      }

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);

      // Refresh the user list
      await fetchUsers();
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Check if current user has admin permissions
  const canManageUsers = hasPermission("admin");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </div>
        {canManageUsers && (
          <Button
            onClick={() => {
              resetForm();
              setIsEditMode(false);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
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
            <p className="text-muted-foreground">
              Add users to manage access to the system.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {canManageUsers && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={`/placeholder.svg?height=32&width=32`}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "admin"
                          ? "default"
                          : user.role === "manager"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {user.role === "admin"
                        ? "Administrator"
                        : user.role === "manager"
                        ? "Manager"
                        : "Staff"}
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
                    <Badge
                      variant={
                        user.status === "active" ? "success" : "secondary"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  {canManageUsers && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
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

      {/* Add/Edit User Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit User" : "Add New User"}
            </DialogTitle>
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
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
              >
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
                onValueChange={(value) =>
                  handleSelectChange("department", value)
                }
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
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {isEditMode
                  ? "New Password (leave blank to keep current)"
                  : "Password"}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={
                  isEditMode ? "Enter new password" : "Enter password"
                }
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
            <Button onClick={handleSubmit}>
              {isEditMode ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
