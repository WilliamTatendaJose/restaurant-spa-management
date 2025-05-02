import { InventoryList } from "@/components/inventory/inventory-list"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function InventoryPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Inventory" subheading="Manage your stock and supplies" />
        <Button asChild>
          <Link href="/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <InventoryList />
      </div>
    </div>
  )
}
