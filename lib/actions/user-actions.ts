'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateUserData {
  name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  password: string;
}

interface UpdateUserData {
  name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
}

export async function createUser(userData: CreateUserData) {
  const supabase = await createSupabaseServerClient();

  // Check if current user is admin
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to perform this action');
  }

  const { data: currentUserProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!currentUserProfile || currentUserProfile.role !== 'admin') {
    throw new Error('Only administrators can create users');
  }

  // Create the user in auth
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

  if (authError) {
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  // Create the user profile
  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: authData.user.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    department: userData.department,
    status: userData.status,
  });

  if (profileError) {
    // If profile creation fails, we should ideally delete the auth user
    // but Supabase Edge Functions don't support this directly
    throw new Error(`Failed to create user profile: ${profileError.message}`);
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function updateUser(userId: string, userData: UpdateUserData) {
  const supabase = await createSupabaseServerClient();

  // Check if current user is admin or the user being updated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to perform this action');
  }

  const { data: currentUserProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const isAdmin = currentUserProfile?.role === 'admin';
  const isSelf = session.user.id === userId;

  if (!isAdmin && !isSelf) {
    throw new Error('You do not have permission to update this user');
  }

  // If not admin and trying to change role, prevent it
  if (!isAdmin && userData.role !== currentUserProfile?.role) {
    throw new Error('Only administrators can change user roles');
  }

  // Update the user profile
  const { error } = await supabase
    .from('user_profiles')
    .update({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      status: userData.status,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Check if current user is admin
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('You must be logged in to perform this action');
  }

  const { data: currentUserProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!currentUserProfile || currentUserProfile.role !== 'admin') {
    throw new Error('Only administrators can delete users');
  }

  // Prevent deleting yourself
  if (session.user.id === userId) {
    throw new Error('You cannot delete your own account');
  }

  // Delete the user from auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);

  if (authError) {
    throw new Error(`Failed to delete user: ${authError.message}`);
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}
