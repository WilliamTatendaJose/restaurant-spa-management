import { CustomerForm } from "@/components/customers/customer-form"
import { PageHeader } from "@/components/page-header"

interface EditCustomerPageProps {
  params: {
    id: string
  }
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Edit Customer" subheading="Update customer information" />

      <div className="mt-6">
        <CustomerForm customerId={params.id} />
      </div>
    </div>
  )
}