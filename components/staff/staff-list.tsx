"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { staffApi } from "@/lib/db";
import { listUsers, updateUser } from "@/lib/user-management";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

// Define the type for staff members
interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: string;
  source?: "staff" | "user"; // To track the source of the record
}

export function StaffList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "both",
    email: "",
    phone: "",
    status: "active",
  });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchStaff() {
      try {
        // Fetch from staff table
        const staffData = (await staffApi.list()) as StaffMember[];

        // Fetch users with 'staff' role
        const userData = await listUsers();
        const staffUsers = userData
          .filter((user) => user.role === "staff")
          .map((user) => ({
            id: user.id,
            name: user.name,
            role: user.role,
            department: user.department || "both",
            email: user.email,
            phone: "", // Users don't have phone in the current structure
            status: user.status || "active",
            source: "user" as const,
          }));

        // Mark existing staff records
        const markedStaffData = staffData.map((staff) => ({
          ...staff,
          source: "staff" as const,
        }));

        // Merge and deduplicate (prefer staff table entries over user entries)
        const staffMap = new Map<string, StaffMember>();

        // Add user records first
        staffUsers.forEach((user) => {
          staffMap.set(user.email, user);
        });

        // Add staff records (will override user records if same email)
        markedStaffData.forEach((staff) => {
          staffMap.set(staff.email, staff);
        });

        const mergedStaff = Array.from(staffMap.values());
        setStaffMembers(mergedStaff);
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStaff();
  }, []);

  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditClick = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      role: staff.role,
      department: staff.department,
      email: staff.email,
      phone: staff.phone,
      status: staff.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = async () => {
    if (!editingStaff) return;

    try {
      if (editingStaff.source === "user") {
        // Update user record
        await updateUser({
          id: editingStaff.id,
          name: formData.name,
          role: formData.role as "admin" | "manager" | "staff",
          department: formData.department,
          phone: formData.phone,
        });

        // Also update or create corresponding staff record for better sync
        try {
          const existingStaff = await staffApi.list();
          const staffRecord = existingStaff.find((staff: any) => staff.email === formData.email);

          if (staffRecord) {
            await staffApi.update(staffRecord.id, {
              name: formData.name,
              role: formData.role,
              department: formData.department,
              email: formData.email,
              phone: formData.phone,
              status: formData.status,
            });
          } else {
            await staffApi.create({
              name: formData.name,
              role: formData.role,
              department: formData.department,
              email: formData.email,
              phone: formData.phone,
              status: formData.status,
            });
          }
        } catch (error) {
          console.error("Error syncing to staff table:", error);
        }

        toast({
          title: "Success",
          description: "Staff member updated successfully.",
        });
      } else {
        // Handle staff record update (existing functionality)
        await staffApi.update(editingStaff.id, formData);

        // Sync back to user if exists
        try {
          const users = await listUsers();
          const correspondingUser = users.find(user => user.email === formData.email);

          if (correspondingUser) {
            await updateUser({
              id: correspondingUser.id,
              name: formData.name,
              role: formData.role as "admin" | "manager" | "staff",
              department: formData.department,
              phone: formData.phone,
            });
          }
        } catch (error) {
          console.error("Error syncing to user account:", error);
        }

        toast({
          title: "Success",
          description: "Staff member updated successfully.",
        });
      }

      setIsEditDialogOpen(false);
      setEditingStaff(null);

      // Refresh the staff list
      const refreshStaff = async () => {
        try {
          const staffData = (await staffApi.list()) as StaffMember[];
          const userData = await listUsers();
          const staffUsers = userData
            .filter((user) => user.role === "staff")
            .map((user) => ({
              id: user.id,
              name: user.name,
              role: user.role,
              department: user.department || "both",
              email: user.email,
              phone: "",
              status: user.status || "active",
              source: "user" as const,
            }));

          const markedStaffData = staffData.map((staff) => ({
            ...staff,
            source: "staff" as const,
          }));

          const staffMap = new Map<string, StaffMember>();
          staffUsers.forEach((user) => {
            staffMap.set(user.email, user);
          });
          markedStaffData.forEach((staff) => {
            staffMap.set(staff.email, staff);
          });

          const mergedStaff = Array.from(staffMap.values());
          setStaffMembers(mergedStaff);
        } catch (error) {
          console.error("Error fetching staff:", error);
        }
      };

      await refreshStaff();
    } catch (error) {
      console.error("Error updating staff:", error);
      toast({
        title: "Error",
        description: "Failed to update staff member. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading staff...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={`/placeholder.svg?height=32&width=32`}
                            alt={staff.name}
                          />
                          <AvatarFallback>
                            {staff.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{staff.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{staff.role}</TableCell>
                    <TableCell>
                      {staff.department === "both" ? (
                        <Badge>Spa & Restaurant</Badge>
                      ) : (
                        <Badge
                          variant={
                            staff.department === "spa" ? "secondary" : "outline"
                          }
                        >
                          {staff.department === "spa" ? "Spa" : "Restaurant"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{staff.email}</p>
                        {staff.phone && (
                          <p className="text-sm text-muted-foreground">
                            {staff.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          staff.status === "active" ? "success" : "secondary"
                        }
                      >
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.source === "staff" ? "default" : "outline"}>
                        {staff.source === "staff" ? "Staff Record" : "User Account"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditClick(staff)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member details. {editingStaff?.source === "user" 
                ? "This will update both the user account and staff record." 
                : "This will update the staff record and sync to user account if linked."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Input
                id="edit-role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                placeholder="Enter role"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleSelectChange("department", value)}
              >
                <SelectTrigger id="edit-department">
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
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email"
                disabled // Email shouldn't be changed to maintain consistency
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleSelectChange("status", value)}
              >
                <SelectTrigger id="edit-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
