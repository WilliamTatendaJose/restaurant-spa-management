import { SpaServiceForm } from "@/components/services/spa-service-form"
import { PageHeader } from "@/components/page-header"

export default function NewSpaServicePage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="New Spa Service" subheading="Add a new spa service to your offerings" />

      <div className="mt-6">
        <SpaServiceForm />
      </div>
    </div>
  )
}
