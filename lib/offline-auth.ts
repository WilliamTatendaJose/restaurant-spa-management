"use client"

import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { hashSync, compareSync } from 'bcryptjs';

// Initialize IndexedDB for offline auth
const AUTH_STORE = 'restaurantSpaAuth';

// Setup local storage for auth
localforage.config({
  name: 'Restaurant-Spa-Management',
  storeName: AUTH_STORE
});

// User interface consistent with the one in sqlite-db.ts
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  department?: string;
  status?: string;
}

// Session interface
interface Session {
  id: string;
  userId: string;
  expires: Date;
  token: string;
}

// User with password hash for internal use
interface UserWithHash extends User {
  passwordHash: string;
}

// Initialize auth store if it doesn't exist
async function ensureAuthStoreExists() {
  const initialized = await localforage.getItem<boolean>('initialized');
  
  if (!initialized) {
    // Create empty arrays for users and sessions
    await localforage.setItem<UserWithHash[]>('users', []);
    await localforage.setItem<Session[]>('sessions', []);
    await localforage.setItem('initialized', true);
    
    // Create default admin user if in development mode
    if (process.env.NODE_ENV === 'development') {
      const adminExists = await getUserByEmail('admin@restaurant-spa.com');
      
      if (!adminExists) {
        await createUser({
          name: 'Administrator',
          email: 'admin@restaurant-spa.com',
          password: 'Admin@123',
          role: 'admin'
        });
      }
    }
  }
}

// Ensure store is initialized before auth operations
ensureAuthStoreExists();

// Create a new user in offline mode
export async function createUser({ 
  name, 
  email, 
  password, 
  role = 'staff' as const
}: { 
  name: string; 
  email: string; 
  password: string; 
  role?: 'admin' | 'manager' | 'staff';
}): Promise<User> {
  const users = await localforage.getItem<UserWithHash[]>('users') || [];
  
  // Check if user already exists
  if (users.some((u: UserWithHash) => u.email === email)) {
    throw new Error(`User with email ${email} already exists`);
  }
  
  // Create user with hashed password
  const user: UserWithHash = {
    id: uuidv4(),
    name,
    email,
    role,
    status: 'active',
    passwordHash: hashSync(password, 10)
  };
  
  // Store user without exposing password hash in the returned user
  const { passwordHash, ...userWithoutHash } = user;
  users.push(user);
  await localforage.setItem('users', users);
  
  return userWithoutHash;
}

// Get user by ID
export async function getUser(id: string): Promise<User | null> {
  const users = await localforage.getItem<UserWithHash[]>('users') || [];
  const user = users.find((u: UserWithHash) => u.id === id);
  
  if (!user) return null;
  
  // Return user without exposing password hash
  const { passwordHash, ...userWithoutHash } = user;
  return userWithoutHash;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await localforage.getItem<UserWithHash[]>('users') || [];
  const user = users.find((u: UserWithHash) => u.email === email);
  
  if (!user) return null;
  
  // Return user without exposing password hash
  const { passwordHash, ...userWithoutHash } = user;
  return userWithoutHash;
}

// Authenticate a user
export async function authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
  const users = await localforage.getItem<UserWithHash[]>('users') || [];
  const user = users.find((u: UserWithHash) => u.email === email);
  
  // If user not found or password incorrect
  if (!user || !compareSync(password, user.passwordHash)) {
    return null;
  }
  
  // Create and store session
  const token = uuidv4();
  const session: Session = {
    id: uuidv4(),
    userId: user.id,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    token
  };
  
  const sessions = await localforage.getItem<Session[]>('sessions') || [];
  sessions.push(session);
  await localforage.setItem('sessions', sessions);
  
  // Return user and token without exposing password hash
  const { passwordHash, ...userWithoutHash } = user;
  return { user: userWithoutHash, token };
}

// Verify a session token
export async function verifySession(token: string): Promise<User | null> {
  const sessions = await localforage.getItem<Session[]>('sessions') || [];
  const session = sessions.find((s: Session) => s.token === token);
  
  // If session not found or expired
  if (!session || new Date(session.expires) < new Date()) {
    return null;
  }
  
  return getUser(session.userId);
}

// Logout a user by removing their session
export async function logoutUser(token: string): Promise<void> {
  const sessions = await localforage.getItem<Session[]>('sessions') || [];
  const updatedSessions = sessions.filter((s: Session) => s.token !== token);
  await localforage.setItem('sessions', updatedSessions);
}

// Update a user's profile
export async function updateUserProfile(id: string, profile: Partial<User>): Promise<User | null> {
  const users = await localforage.getItem<UserWithHash[]>('users') || [];
  const index = users.findIndex((u: UserWithHash) => u.id === id);
  
  if (index === -1) return null;
  
  // Update user fields
  users[index] = {
    ...users[index],
    ...profile,
    // Don't allow updating these fields through this method
    id: users[index].id,
    email: profile.email || users[index].email,
    passwordHash: users[index].passwordHash
  };
  
  await localforage.setItem('users', users);
  
  // Return updated user without exposing password hash
  const { passwordHash, ...userWithoutHash } = users[index];
  return userWithoutHash;
}

// Change user password
export async function changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const users = await localforage.getItem<UserWithHash[]>('users') || [];
  const index = users.findIndex((u: UserWithHash) => u.id === id);
  
  if (index === -1) return false;
  
  // Verify current password
  if (!compareSync(currentPassword, users[index].passwordHash)) {
    return false;
  }
  
  // Update password
  users[index].passwordHash = hashSync(newPassword, 10);
  await localforage.setItem('users', users);
  
  return true;
}

// Sync offline users with online database when connection is restored
export async function syncOfflineUsers(): Promise<void> {
  // This function would sync local changes with the server
  // Implementation depends on your backend API and sync strategy
  console.log('Syncing offline users with server...');
  
  // Example implementation:
  // 1. Get all locally created/modified users
  // 2. Send them to server through an API
  // 3. Update local status to synced
}