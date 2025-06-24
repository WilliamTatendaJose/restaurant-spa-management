import { PageHeader } from "@/components/page-header"
import { SettingsTabs } from "@/components/settings/settings-tabs"
import ProtectedRoute from "@/components/protected-route"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6">
        <PageHeader heading="Settings" subheading="Configure your system preferences" />
        <div className="mt-6">
          <SettingsTabs />
        </div>
      </div>
    </ProtectedRoute>
  )
}
