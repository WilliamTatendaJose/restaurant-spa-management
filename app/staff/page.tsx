import { StaffList } from "@/components/staff/staff-list"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function StaffPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Staff" subheading="Manage your team and schedules" />
        <Button asChild>
          <Link href="/staff/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <StaffList />
      </div>
    </div>
  )
}
