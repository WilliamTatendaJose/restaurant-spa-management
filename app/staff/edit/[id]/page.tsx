import { StaffForm } from "@/components/staff/staff-form"
import { PageHeader } from "@/components/page-header"

interface EditStaffPageProps {
  params: {
    id: string
  }
}

export default function EditStaffPage({ params }: EditStaffPageProps) {
  return (
    <div className="container mx-auto px-4 py-6">
      <PageHeader heading="Edit Staff Member" subheading="Update staff information" />

      <div className="mt-6">
        <StaffForm staffId={params.id} />
      </div>
    </div>
  )
}