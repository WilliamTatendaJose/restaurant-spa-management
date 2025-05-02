"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock staff data
const staffMembers = [
  {
    id: "1",
    name: "John Smith",
    role: "Massage Therapist",
    department: "spa",
    email: "john.s@example.com",
    phone: "555-111-2222",
    status: "active",
  },
  {
    id: "2",
    name: "Maria Garcia",
    role: "Esthetician",
    department: "spa",
    email: "maria.g@example.com",
    phone: "555-222-3333",
    status: "active",
  },
  {
    id: "3",
    name: "David Kim",
    role: "Head Chef",
    department: "restaurant",
    email: "david.k@example.com",
    phone: "555-333-4444",
    status: "active",
  },
  {
    id: "4",
    name: "Sophie Chen",
    role: "Server",
    department: "restaurant",
    email: "sophie.c@example.com",
    phone: "555-444-5555",
    status: "inactive",
  },
  {
    id: "5",
    name: "Robert Johnson",
    role: "Manager",
    department: "both",
    email: "robert.j@example.com",
    phone: "555-555-6666",
    status: "active",
  },
]

export function StaffList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStaff = staffMembers.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={staff.name} />
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
                    <Badge variant={staff.department === "spa" ? "secondary" : "outline"}>
                      {staff.department === "spa" ? "Spa" : "Restaurant"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{staff.email}</p>
                    <p className="text-sm text-muted-foreground">{staff.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={staff.status === "active" ? "success" : "secondary"}>{staff.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Schedule
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
