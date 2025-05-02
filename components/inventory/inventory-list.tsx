"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

// Mock inventory data
const inventoryItems = [
  {
    id: "1",
    name: "Massage Oil (Lavender)",
    category: "spa",
    quantity: 24,
    unit: "bottle",
    reorderLevel: 10,
    lastUpdated: "2025-04-15",
  },
  {
    id: "2",
    name: "Facial Cream",
    category: "spa",
    quantity: 8,
    unit: "jar",
    reorderLevel: 5,
    lastUpdated: "2025-04-18",
  },
  {
    id: "3",
    name: "Towels (Large)",
    category: "spa",
    quantity: 45,
    unit: "piece",
    reorderLevel: 20,
    lastUpdated: "2025-04-10",
  },
  {
    id: "4",
    name: "Salmon Fillet",
    category: "restaurant",
    quantity: 18,
    unit: "kg",
    reorderLevel: 5,
    lastUpdated: "2025-04-21",
  },
  {
    id: "5",
    name: "Olive Oil",
    category: "restaurant",
    quantity: 6,
    unit: "bottle",
    reorderLevel: 3,
    lastUpdated: "2025-04-17",
  },
  {
    id: "6",
    name: "Red Wine",
    category: "restaurant",
    quantity: 24,
    unit: "bottle",
    reorderLevel: 12,
    lastUpdated: "2025-04-12",
  },
]

export function InventoryList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
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
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.category === "spa" ? "secondary" : "outline"}>
                    {item.category === "spa" ? "Spa" : "Restaurant"}
                  </Badge>
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>
                  {item.quantity <= item.reorderLevel ? (
                    <Badge variant="destructive">Low Stock</Badge>
                  ) : (
                    <Badge variant="outline">In Stock</Badge>
                  )}
                </TableCell>
                <TableCell>{item.lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
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
