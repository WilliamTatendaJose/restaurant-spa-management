import { TaskForm } from "@/components/task-form"

export default function NewTaskPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Create New Task</h1>
      <TaskForm />
    </div>
  )
}
