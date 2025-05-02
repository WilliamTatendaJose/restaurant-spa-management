import { createServerClient } from "@/lib/supabase/server"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditIcon } from "lucide-react"
import Link from "next/link"
import { DeleteUserButton } from "./delete-user-button"

export async function UserTable() {
  const supabase = createServerClient()

  const { data: users, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return <div className="text-red-500">Error loading users: {error.message}</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No users found. Create your first user to get started.
              </TableCell>
            </TableRow>
          )}

          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge
                  variant={user.role === "admin" ? "destructive" : user.role === "manager" ? "default" : "secondary"}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{user.department || "-"}</TableCell>
              <TableCell>
                <Badge variant={user.status === "active" ? "success" : "outline"}>{user.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/dashboard/users/${user.id}`}>
                    <Button variant="outline" size="icon">
                      <EditIcon className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </Link>
                  <DeleteUserButton userId={user.id} userName={user.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
