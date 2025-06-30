import { TaskForm } from '@/components/task-form';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

// This would typically fetch the task from a database
const getTask = async (id: string) => {
  const task = {
    id: id,
    title: 'Complete project proposal',
    description: 'Draft and finalize the Q3 project proposal for client review',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2025-05-15',
    assignee: 'John Doe',
  };
  return task;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const task = await getTask(params.id);

  if (!task) {
    return {
      title: 'Task Not Found',
      description: 'The requested task could not be found.',
    };
  }

  return {
    title: `Edit Task: ${task.title}`,
    description: `Details for task: ${task.title}`,
    openGraph: {
      title: `Edit Task: ${task.title}`,
      description: `Details for task: ${task.title}`,
    },
    twitter: {
      card: 'summary',
      title: `Edit Task: ${task.title}`,
      description: `Details for task: ${task.title}`,
    },
  };
}

export default async function EditTaskPage({ params }: { params: { id:string } }) {
  const task = await getTask(params.id);

  if (!task) {
    notFound();
  }

  return (
    <div className='container mx-auto py-6'>
      <h1 className='mb-6 text-3xl font-bold tracking-tight'>Edit Task</h1>
      <TaskForm task={task} />
    </div>
  );
}
