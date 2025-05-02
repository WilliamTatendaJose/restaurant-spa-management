import { MenuItemForm } from "@/components/services/menu-item-form"
import { PageHeader } from "@/components/page-header"

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  // In a real app, this would fetch the menu item from the database
  const menuItem = {
    id: params.id,
    name: "Grilled Salmon",
    description: "Fresh salmon fillet grilled with herbs and lemon",
    price: 24,
    category: "food",
    dietary: ["gluten-free"],
    isAvailable: true,
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Edit Menu Item" subheading="Update menu item details and pricing" />

      <div className="mt-6">
        <MenuItemForm menuItem={menuItem} />
      </div>
    </div>
  )
}
