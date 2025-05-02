"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Edit } from "lucide-react"
import Link from "next/link"

// Mock menu items data
const menuItems = [
  {
    id: "1",
    name: "Grilled Salmon",
    description: "Fresh salmon fillet grilled with herbs and lemon",
    price: 24,
    category: "food",
    dietary: ["gluten-free"],
    isAvailable: true,
  },
  {
    id: "2",
    name: "Pasta Primavera",
    description: "Seasonal vegetables with pasta in a light cream sauce",
    price: 18,
    category: "food",
    dietary: ["vegetarian"],
    isAvailable: true,
  },
  {
    id: "3",
    name: "Steak & Fries",
    description: "Grilled ribeye steak with truffle fries",
    price: 32,
    category: "food",
    dietary: [],
    isAvailable: true,
  },
  {
    id: "4",
    name: "Caesar Salad",
    description: "Romaine lettuce with Caesar dressing, croutons and parmesan",
    price: 12,
    category: "food",
    dietary: [],
    isAvailable: true,
  },
  {
    id: "5",
    name: "Vegetable Curry",
    description: "Mixed vegetables in a spicy curry sauce with rice",
    price: 16,
    category: "food",
    dietary: ["vegan", "gluten-free"],
    isAvailable: true,
  },
  {
    id: "6",
    name: "Chocolate Cake",
    description: "Rich chocolate cake with ganache",
    price: 8,
    category: "desserts",
    dietary: ["vegetarian"],
    isAvailable: true,
  },
  {
    id: "7",
    name: "House Wine (Glass)",
    description: "Red or white house wine",
    price: 9,
    category: "drinks",
    dietary: ["vegan"],
    isAvailable: true,
  },
  {
    id: "8",
    name: "Sparkling Water",
    description: "Bottle of premium sparkling water",
    price: 4,
    category: "drinks",
    dietary: ["vegan", "gluten-free"],
    isAvailable: true,
  },
  {
    id: "9",
    name: "Tiramisu",
    description: "Classic Italian dessert with coffee and mascarpone",
    price: 9,
    category: "desserts",
    dietary: ["vegetarian"],
    isAvailable: false,
  },
  {
    id: "10",
    name: "Craft Beer",
    description: "Selection of local craft beers",
    price: 7,
    category: "drinks",
    dietary: [],
    isAvailable: true,
  },
]

interface MenuItemListProps {
  category: string
}

export function MenuItemList({ category }: MenuItemListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredItems = menuItems.filter(
    (item) =>
      item.category === category &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
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
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Dietary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.dietary.length > 0 ? (
                      item.dietary.map((diet) => (
                        <Badge key={diet} variant="outline" className="capitalize">
                          {diet}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {item.isAvailable ? (
                    <Badge variant="success">Available</Badge>
                  ) : (
                    <Badge variant="secondary">Unavailable</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/services/restaurant/${item.id}`}>
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  No menu items found. Try adjusting your search or add a new item.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
