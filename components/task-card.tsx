import Link from 'next/link';
import { CalendarIcon, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignee: string;
}

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  };

  const statusColors = {
    completed:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    'in-progress':
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    pending:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const priorityColor =
    priorityColors[task.priority as keyof typeof priorityColors] || '';
  const statusColor =
    statusColors[task.status as keyof typeof statusColors] || '';

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between'>
          <CardTitle className='text-lg'>{task.title}</CardTitle>
          <Button variant='ghost' size='icon' asChild>
            <Link href={`/tasks/${task.id}`}>
              <Edit className='h-4 w-4' />
              <span className='sr-only'>Edit</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className='mb-4 text-sm text-muted-foreground'>{task.description}</p>
        <div className='mb-4 flex flex-wrap gap-2'>
          <Badge variant='outline' className={priorityColor}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}{' '}
            Priority
          </Badge>
          <Badge variant='outline' className={statusColor}>
            {task.status.charAt(0).toUpperCase() +
              task.status.slice(1).replace('-', ' ')}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className='flex justify-between border-t pt-4'>
        <div className='flex items-center text-sm text-muted-foreground'>
          <CalendarIcon className='mr-1 h-4 w-4' />
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
        <div className='text-sm text-muted-foreground'>
          Assigned to: {task.assignee}
        </div>
      </CardFooter>
    </Card>
  );
}
