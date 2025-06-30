'use client';

import {
  createUser as offlineCreateUser,
  listAllUsers,
  updateUserProfile,
  deleteUser as offlineDeleteUser,
} from '@/lib/offline-auth';

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'manager' | 'staff';
  department?: string;
  phone?: string;
}

export interface UserUpdateInput {
  id: string;
  name?: string;
  role?: 'admin' | 'manager' | 'staff';
  department?: string;
  phone?: string;
}

// Create a new user
export async function createUser(userData: UserCreateInput) {
  return offlineCreateUser({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'staff',
    department: userData.department,
  });
}

// List all users
export async function listUsers() {
  return await listAllUsers();
}

// Update a user
export async function updateUser(userData: UserUpdateInput) {
  return await updateUserProfile(userData.id, {
    name: userData.name,
    role: userData.role,
    department: userData.department,
  });
}

// Delete a user
export async function deleteUser(userId: string) {
  return await offlineDeleteUser(userId);
}
