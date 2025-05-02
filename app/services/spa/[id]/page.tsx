import { SpaServiceForm } from "@/components/services/spa-service-form"
import { PageHeader } from "@/components/page-header"

export default function EditSpaServicePage({ params }: { params: { id: string } }) {
  // In a real app, this would fetch the service from the database
  const service = {
    id: params.id,
    name: "Deep Tissue Massage",
    description: "A therapeutic massage focusing on realigning deeper layers of muscles",
    duration: 60,
    price: 120,
    category: "massage",
    isActive: true,
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Edit Spa Service" subheading="Update service details and pricing" />

      <div className="mt-6">
        <SpaServiceForm service={service} />
      </div>
    </div>
  )
}
