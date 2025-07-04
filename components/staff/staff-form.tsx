'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useSyncStatus } from '@/components/sync-status-provider';
import { staffApi } from '@/lib/db';
import { listUsers, updateUser } from '@/lib/user-management';

interface StaffMember {
  id?: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: string;
}

interface StaffFormProps {
  staff?: StaffMember;
  staffId?: string;
}

export function StaffForm({ staff, staffId }: StaffFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isOnline } = useSyncStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!staffId && !staff);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(
    staff || null
  );

  const [formData, setFormData] = useState<StaffMember>({
    name: staff?.name || '',
    role: staff?.role || '',
    department: staff?.department || 'spa',
    email: staff?.email || '',
    phone: staff?.phone || '',
    status: staff?.status || 'active',
  });

  // Fetch staff member if staffId is provided and staff member is not
  useEffect(() => {
    async function fetchStaffMember() {
      if (!staffId) return;

      try {
        const fetchedStaff = await staffApi.get(staffId);
        if (fetchedStaff) {
          // Type cast the fetched staff as a StaffMember
          const typedStaff = fetchedStaff as unknown as StaffMember;
          setCurrentStaff(typedStaff);
          setFormData({
            name: typedStaff.name || '',
            role: typedStaff.role || '',
            department: typedStaff.department || 'spa',
            email: typedStaff.email || '',
            phone: typedStaff.phone || '',
            status: typedStaff.status || 'active',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Staff member not found',
            variant: 'destructive',
          });
          router.push('/staff');
        }
      } catch (error) {
        console.error('Error fetching staff member:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch staff member. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (staffId && !staff) {
      fetchStaffMember();
    }
  }, [staffId, staff, toast, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      status: checked ? 'active' : 'inactive',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (currentStaff?.id || staffId) {
        // Update existing staff
        await staffApi.update(currentStaff?.id || staffId!, formData);

        // Check if this staff member is also a user and sync the changes
        try {
          const users = await listUsers();
          const correspondingUser = users.find(
            (user) => user.email === formData.email
          );

          if (correspondingUser) {
            await updateUser({
              id: correspondingUser.id,
              name: formData.name,
              role: formData.role as 'admin' | 'manager' | 'staff',
              department: formData.department,
              phone: formData.phone,
            });
          }
        } catch (error) {
          console.error('Error syncing to user account:', error);
          // Don't fail the staff update if user sync fails
        }

        toast({
          title: 'Staff updated',
          description: isOnline
            ? 'Staff member has been updated successfully.'
            : 'Staff member has been updated offline and will sync when connection is restored.',
        });
      } else {
        // Create new staff
        await staffApi.create(formData);
        toast({
          title: 'Staff added',
          description: isOnline
            ? 'New staff member has been added successfully.'
            : 'Staff member has been added offline and will sync when connection is restored.',
        });
      }

      router.push('/staff');
    } catch (error) {
      console.error('Error saving staff:', error);
      toast({
        title: 'Error',
        description: 'Failed to save staff member. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center p-8'>
            <p>Loading staff data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className='pt-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-4'>
            <div className='grid gap-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                placeholder='Enter staff name'
                required
              />
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='role'>Role</Label>
                <Input
                  id='role'
                  name='role'
                  value={formData.role}
                  onChange={handleChange}
                  placeholder='Enter staff role'
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='department'>Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    handleSelectChange('department', value)
                  }
                >
                  <SelectTrigger id='department'>
                    <SelectValue placeholder='Select department' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='spa'>Spa</SelectItem>
                    <SelectItem value='restaurant'>Restaurant</SelectItem>
                    <SelectItem value='both'>Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  value={formData.email}
                  onChange={handleChange}
                  placeholder='Enter email address'
                  required
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='phone'>Phone</Label>
                <Input
                  id='phone'
                  name='phone'
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder='Enter phone number'
                  required
                />
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Switch
                id='status'
                checked={formData.status === 'active'}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor='status'>Staff member is active</Label>
            </div>
          </div>

          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.push('/staff')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : currentStaff?.id || staffId
                  ? 'Update Staff'
                  : 'Add Staff'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
