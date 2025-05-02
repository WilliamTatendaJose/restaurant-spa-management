import { InventoryForm } from "@/components/inventory/inventory-form"
import { PageHeader } from "@/components/page-header"

export default function NewInventoryItemPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Add Inventory Item" subheading="Add a new item to your inventory" />

      <div className="mt-6">
        <InventoryForm />
      </div>
    </div>
  )
}
