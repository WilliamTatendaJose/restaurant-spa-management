"use client"

import * as offlineAuth from '@/lib/offline-auth'

export interface UserCreateInput {
  name: string
  email: string
  password: string
  role?: 'admin' | 'manager' | 'staff'
  department?: string
  phone?: string
}

export interface UserUpdateInput {
  id: string
  name?: string
  role?: 'admin' | 'manager' | 'staff'
  department?: string
  phone?: string
}

// Create a new user
export async function createUser(userData: UserCreateInput) {
  return offlineAuth.createUser({
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'staff',
    department: userData.department,
    phone: userData.phone
  });
}

// List all users
export async function listUsers() {
  const users = await offlineAuth.listAllUsers();
  return users.map(user => ({
    ...user,
    status: user.status || 'active' // Ensure status is always set
  }));
}

// Update a user
export async function updateUser(userData: UserUpdateInput) {
  const result = await offlineAuth.updateUserProfile(userData.id, userData);
  if (!result) {
    throw new Error('User not found');
  }
  return result;
}

// Delete a user
export async function deleteUser(userId: string) {
  return offlineAuth.deleteUser(userId);
}