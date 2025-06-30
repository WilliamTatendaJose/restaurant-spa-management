import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TaskFilter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>Filter tasks by status and priority</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-6'>
        <div className='grid gap-2'>
          <Label htmlFor='status'>Status</Label>
          <RadioGroup defaultValue='all' id='status'>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='all' id='all' />
              <Label htmlFor='all'>All</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='pending' id='pending' />
              <Label htmlFor='pending'>Pending</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='in-progress' id='in-progress' />
              <Label htmlFor='in-progress'>In Progress</Label>
            </div>
            <div className='flex items-center space-x-2'>
              <RadioGroupItem value='completed' id='completed' />
              <Label htmlFor='completed'>Completed</Label>
            </div>
          </RadioGroup>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='priority'>Priority</Label>
          <Select defaultValue='all'>
            <SelectTrigger id='priority'>
              <SelectValue placeholder='Select priority' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Priorities</SelectItem>
              <SelectItem value='high'>High</SelectItem>
              <SelectItem value='medium'>Medium</SelectItem>
              <SelectItem value='low'>Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='assignee'>Assignee</Label>
          <Select defaultValue='all'>
            <SelectTrigger id='assignee'>
              <SelectValue placeholder='Select assignee' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Team Members</SelectItem>
              <SelectItem value='john'>John Doe</SelectItem>
              <SelectItem value='jane'>Jane Smith</SelectItem>
              <SelectItem value='alex'>Alex Johnson</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
