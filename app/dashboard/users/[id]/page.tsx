import { notFound, redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { UserForm } from "@/components/users/user-form"

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const supabase = createServerClient()

  // Check if user is authenticated and has admin role
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    redirect("/login")
  }

  // Get user profile to check role
  const { data: currentUserProfile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", session.user.id)
    .single()

  // Redirect if not admin
  if (!currentUserProfile || currentUserProfile.role !== "admin") {
    redirect("/dashboard")
  }

  // Get user to edit
  const { data: user } = await supabase.from("user_profiles").select("*").eq("id", params.id).single()

  if (!user) {
    notFound()
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Edit User: {user.name}</h1>
      <UserForm user={user} />
    </div>
  )
}
