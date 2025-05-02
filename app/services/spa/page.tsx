import { SpaServiceList } from "@/components/services/spa-service-list"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function SpaServicesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <PageHeader heading="Spa Services" subheading="Manage your spa service offerings" />
        <Button asChild>
          <Link href="/services/spa/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Link>
        </Button>
      </div>

      <div className="mt-6">
        <SpaServiceList />
      </div>
    </div>
  )
}
