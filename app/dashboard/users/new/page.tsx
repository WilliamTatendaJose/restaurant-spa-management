import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { UserForm } from "@/components/users/user-form"

export default async function NewUserPage() {
  const supabase = createServerClient()

  // Check if user is authenticated and has admin role
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Get user profile to check role
  const { data: profile } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).single()

  // Redirect if not admin
  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Create New User</h1>
      <UserForm />
    </div>
  )
}
