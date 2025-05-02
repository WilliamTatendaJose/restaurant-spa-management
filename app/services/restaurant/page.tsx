import { MenuItemList } from "@/components/services/menu-item-list"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RestaurantMenuPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Restaurant Menu" subheading="Manage your restaurant menu items" />
        <Button asChild>
          <Link href="/services/restaurant/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Menu Item
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="food" className="mt-6">
        <TabsList>
          <TabsTrigger value="food">Food</TabsTrigger>
          <TabsTrigger value="drinks">Drinks</TabsTrigger>
          <TabsTrigger value="desserts">Desserts</TabsTrigger>
        </TabsList>
        <TabsContent value="food" className="mt-4">
          <MenuItemList category="food" />
        </TabsContent>
        <TabsContent value="drinks" className="mt-4">
          <MenuItemList category="drinks" />
        </TabsContent>
        <TabsContent value="desserts" className="mt-4">
          <MenuItemList category="desserts" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
