import { MenuItemForm } from "@/components/services/menu-item-form"
import { PageHeader } from "@/components/page-header"

export default function NewMenuItemPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="New Menu Item" subheading="Add a new item to your restaurant menu" />

      <div className="mt-6">
        <MenuItemForm />
      </div>
    </div>
  )
}
