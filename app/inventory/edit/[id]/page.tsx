import { InventoryForm } from "@/components/inventory/inventory-form"
import { PageHeader } from "@/components/page-header"
import { inventoryApi } from "@/lib/db"

interface EditInventoryItemPageProps {
  params: {
    id: string
  }
}

export default async function EditInventoryItemPage({ params }: EditInventoryItemPageProps) {
  // No need to fetch client-side as we'll use the client component for that
  // We're just setting up the structure here
  
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Edit Inventory Item" subheading="Update inventory item details" />

      <div className="mt-6">
        <InventoryForm itemId={params.id} />
      </div>
    </div>
  )
}