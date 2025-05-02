"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

// Mock customer data
const customers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "555-123-4567",
    visits: 8,
    lastVisit: "2025-04-18",
    type: "spa",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.c@example.com",
    phone: "555-987-6543",
    visits: 12,
    lastVisit: "2025-04-20",
    type: "restaurant",
  },
  {
    id: "3",
    name: "Emma Wilson",
    email: "emma.w@example.com",
    phone: "555-456-7890",
    visits: 5,
    lastVisit: "2025-04-15",
    type: "both",
  },
  {
    id: "4",
    name: "James Rodriguez",
    email: "james.r@example.com",
    phone: "555-789-0123",
    visits: 3,
    lastVisit: "2025-04-10",
    type: "restaurant",
  },
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa.t@example.com",
    phone: "555-234-5678",
    visits: 15,
    lastVisit: "2025-04-21",
    type: "spa",
  },
]

export function CustomerList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery),
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
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
              <TableHead>Contact</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead>Customer Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{customer.email}</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </TableCell>
                <TableCell>{customer.visits}</TableCell>
                <TableCell>{customer.lastVisit}</TableCell>
                <TableCell>
                  {customer.type === "both" ? (
                    <Badge>Spa & Restaurant</Badge>
                  ) : (
                    <Badge variant={customer.type === "spa" ? "secondary" : "outline"}>
                      {customer.type === "spa" ? "Spa" : "Restaurant"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
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
