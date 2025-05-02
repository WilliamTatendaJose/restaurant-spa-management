import { TaskForm } from "@/components/task-form"

export default function EditTaskPage({ params }: { params: { id: string } }) {
  // This would typically fetch the task from a database
  const task = {
    id: params.id,
    title: "Complete project proposal",
    description: "Draft and finalize the Q3 project proposal for client review",
    status: "in-progress",
    priority: "high",
    dueDate: "2025-05-15",
    assignee: "John Doe",
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Task</h1>
      <TaskForm task={task} />
    </div>
  )
}
