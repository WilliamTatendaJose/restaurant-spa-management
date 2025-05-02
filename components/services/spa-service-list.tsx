"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Clock } from "lucide-react"
import Link from "next/link"

// Mock spa services data
const spaServices = [
  {
    id: "1",
    name: "Deep Tissue Massage",
    description: "A therapeutic massage focusing on realigning deeper layers of muscles",
    duration: 60,
    price: 120,
    category: "massage",
    isActive: true,
  },
  {
    id: "2",
    name: "Swedish Massage",
    description: "A gentle full body massage to relax and energize",
    duration: 60,
    price: 100,
    category: "massage",
    isActive: true,
  },
  {
    id: "3",
    name: "Hot Stone Massage",
    description: "Massage with heated stones to ease muscle tension",
    duration: 90,
    price: 150,
    category: "massage",
    isActive: true,
  },
  {
    id: "4",
    name: "Aromatherapy Massage",
    description: "Massage with essential oils for enhanced relaxation",
    duration: 60,
    price: 110,
    category: "massage",
    isActive: true,
  },
  {
    id: "5",
    name: "Facial Treatment",
    description: "Deep cleansing facial with premium products",
    duration: 45,
    price: 85,
    category: "facial",
    isActive: true,
  },
  {
    id: "6",
    name: "Body Scrub",
    description: "Full body exfoliation treatment",
    duration: 45,
    price: 95,
    category: "body",
    isActive: false,
  },
  {
    id: "7",
    name: "Manicure & Pedicure",
    description: "Nail care for hands and feet",
    duration: 60,
    price: 65,
    category: "nails",
    isActive: true,
  },
]

export function SpaServiceList() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredServices = spaServices.filter(
    (service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
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
              <TableHead>Service Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {service.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                    {service.duration} min
                  </div>
                </TableCell>
                <TableCell>${service.price.toFixed(2)}</TableCell>
                <TableCell>
                  {service.isActive ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/services/spa/${service.id}`}>
                      <Edit className="mr-1 h-4 w-4" />
                      Edit
                    </Link>
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
