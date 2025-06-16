"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { MenuItemList } from "@/components/services/menu-item-list"
import { Plus } from "lucide-react"
import Link from "next/link"

const categories = [
  { id: "food", label: "Food", description: "Main dishes and entrees" },
  { id: "drinks", label: "Drinks", description: "Beverages and cocktails" },
  { id: "desserts", label: "Desserts", description: "Sweet treats and desserts" },
  { id: "appetizers", label: "Appetizers", description: "Starters and small plates" },
  { id: "mains", label: "Mains", description: "Main course dishes" },
]

export default function RestaurantServicesPage() {
  const [activeCategory, setActiveCategory] = useState("food")

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader 
          heading="Restaurant Menu" 
          subheading="Manage your restaurant menu items and categories" 
        />
        <Button asChild>
          <Link href="/services/restaurant/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="capitalize">
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{category.label}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <MenuItemList category={category.id} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
