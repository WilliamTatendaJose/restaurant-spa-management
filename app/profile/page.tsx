'use client';

import type React from 'react';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { userDetails, refreshSession } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    name: userDetails?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userDetails) {
      toast({
        title: 'Error',
        description: 'User details not found.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Update name
      if (formData.name !== userDetails.name) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ name: formData.name })
          .eq('id', userDetails.id);

        if (error) throw error;
      }

      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'New passwords do not match.',
            variant: 'destructive',
          });
          return;
        }

        // Verify current password
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userDetails.email,
          password: formData.currentPassword,
        });

        if (signInError) {
          toast({
            title: 'Error',
            description: 'Current password is incorrect.',
            variant: 'destructive',
          });
          return;
        }

        // Update password
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (updateError) throw updateError;
      }

      // Refresh session to get updated user details
      await refreshSession();

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className='container mx-auto px-4 py-6'>
      <PageHeader
        heading='My Profile'
        subheading='Manage your account information'
      />

      <div className='mt-6 grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center gap-4 pb-6'>
              <Avatar className='h-24 w-24'>
                <AvatarImage
                  src='/placeholder.svg?height=96&width=96'
                  alt='Profile'
                />
                <AvatarFallback className='text-xl'>
                  {userDetails.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className='text-center'>
                <h3 className='text-xl font-semibold'>{userDetails.name}</h3>
                <p className='text-muted-foreground'>{userDetails.email}</p>
                <div className='mt-2 flex justify-center gap-2'>
                  <Badge
                    variant={
                      userDetails.role === 'admin'
                        ? 'default'
                        : userDetails.role === 'manager'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {userDetails.role === 'admin'
                      ? 'Administrator'
                      : userDetails.role === 'manager'
                        ? 'Manager'
                        : 'Staff'}
                  </Badge>
                  {userDetails.department && (
                    <Badge variant='outline'>
                      {userDetails.department === 'both'
                        ? 'Spa & Restaurant'
                        : userDetails.department === 'spa'
                          ? 'Spa'
                          : 'Restaurant'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Full Name</Label>
                  <Input
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder='Enter your full name'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={userDetails.email}
                    disabled
                    className='bg-muted'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Email cannot be changed
                  </p>
                </div>
              </div>
              <div className='mt-6'>
                <Button type='submit' disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile}>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='currentPassword'>Current Password</Label>
                  <Input
                    id='currentPassword'
                    name='currentPassword'
                    type='password'
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    placeholder='Enter your current password'
                    required={!!formData.newPassword}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='newPassword'>New Password</Label>
                  <Input
                    id='newPassword'
                    name='newPassword'
                    type='password'
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder='Enter new password'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='confirmPassword'>Confirm New Password</Label>
                  <Input
                    id='confirmPassword'
                    name='confirmPassword'
                    type='password'
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder='Confirm new password'
                    required={!!formData.newPassword}
                  />
                </div>
              </div>
              <div className='mt-6'>
                <Button
                  type='submit'
                  disabled={
                    isUpdating ||
                    (!formData.currentPassword &&
                      !formData.newPassword &&
                      !formData.confirmPassword)
                  }
                >
                  {isUpdating ? 'Updating...' : 'Change Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
