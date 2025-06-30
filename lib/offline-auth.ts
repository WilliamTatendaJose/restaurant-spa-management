'use client';

import { v4 as uuidv4 } from 'uuid';
import { hashSync, compareSync } from 'bcryptjs';

// Initialize storage for offline auth
const AUTH_STORE_NAME = 'restaurantSpaAuth';

// Simple localStorage-based storage as fallback
class SimpleStorage {
  private prefix = 'restaurant_spa_';

  async getItem<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined') return null;
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to store data:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Failed to remove data:', error);
    }
  }
}

// Initialize storage
const storage = new SimpleStorage();

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
  try {
    if (typeof window === 'undefined') {
      console.log('Running on server side, skipping auth store initialization');
      return;
    }

    const initialized = await storage.getItem<boolean>('initialized');
    console.log('Auth store initialized status:', initialized);

    if (!initialized) {
      console.log('Initializing offline auth store...');

      // Create default users for different roles
      const adminUser: UserWithHash = {
        id: uuidv4(),
        name: 'Administrator',
        email: 'admin@restaurant-spa.com',
        role: 'admin',
        status: 'active',
        passwordHash: hashSync('Admin@123', 10),
      };

      const managerUser: UserWithHash = {
        id: uuidv4(),
        name: 'Manager',
        email: 'manager@restaurant-spa.com',
        role: 'manager',
        status: 'active',
        passwordHash: hashSync('Manager@123', 10),
      };

      const staffUser: UserWithHash = {
        id: uuidv4(),
        name: 'Staff Member',
        email: 'staff@restaurant-spa.com',
        role: 'staff',
        status: 'active',
        passwordHash: hashSync('Staff@123', 10),
      };

      console.log('Creating users with emails:', [
        adminUser.email,
        managerUser.email,
        staffUser.email,
      ]);

      // Initialize with all test users
      await storage.setItem<UserWithHash[]>('users', [
        adminUser,
        managerUser,
        staffUser,
      ]);
      await storage.setItem<Session[]>('sessions', []);
      await storage.setItem('initialized', true);

      console.log('Auth store initialized with default users');
    } else {
      console.log('Auth store already initialized');
      const users = (await storage.getItem<UserWithHash[]>('users')) || [];
      console.log('Current users in store:', users.length);
    }
  } catch (error) {
    console.error('Error initializing auth store:', error);
  }
}

// Ensure store is initialized before auth operations
ensureAuthStoreExists();

// Create a new user in offline mode
export async function createUser({
  name,
  email,
  password,
  role = 'staff' as const,
  department,
}: {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'manager' | 'staff';
  department?: string;
}): Promise<User> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];

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
    department,
    status: 'active',
    passwordHash: hashSync(password, 10),
  };

  // Store user without exposing password hash
  const { passwordHash, ...userWithoutHash } = user;
  users.push(user);
  await storage.setItem('users', users);

  return userWithoutHash;
}

// Get user by ID
export async function getUser(id: string): Promise<User | null> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  const user = users.find((u: UserWithHash) => u.id === id);

  if (!user) return null;

  // Return user without exposing password hash
  const { passwordHash, ...userWithoutHash } = user;
  return userWithoutHash;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  const user = users.find((u: UserWithHash) => u.email === email);

  if (!user) return null;

  // Return user without exposing password hash
  const { passwordHash, ...userWithoutHash } = user;
  return userWithoutHash;
}

// Authenticate a user
export async function authenticateUser(
  email: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  console.log('Attempting to authenticate user:', email);

  await ensureAuthStoreExists();

  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  console.log('Found users in storage:', users.length);

  const user = users.find((u: UserWithHash) => u.email === email);
  console.log('User found:', !!user);

  // If user not found or password incorrect
  if (!user) {
    console.log('User not found');
    return null;
  }

  const passwordMatch = compareSync(password, user.passwordHash);
  console.log('Password match:', passwordMatch);

  if (!passwordMatch) {
    return null;
  }

  // Create and store session
  const token = uuidv4();
  const session: Session = {
    id: uuidv4(),
    userId: user.id,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    token,
  };

  const sessions = (await storage.getItem<Session[]>('sessions')) || [];
  sessions.push(session);
  await storage.setItem('sessions', sessions);

  console.log('Authentication successful, created session');

  // Return user and token without exposing password hash
  const { passwordHash, ...userWithoutHash } = user;
  return { user: userWithoutHash, token };
}

// Verify a session token
export async function verifySession(token: string): Promise<User | null> {
  const sessions = (await storage.getItem<Session[]>('sessions')) || [];
  const session = sessions.find((s: Session) => s.token === token);

  // If session not found or expired
  if (!session || new Date(session.expires) < new Date()) {
    return null;
  }

  return getUser(session.userId);
}

// Logout a user by removing their session
export async function logoutUser(token: string): Promise<void> {
  const sessions = (await storage.getItem<Session[]>('sessions')) || [];
  const updatedSessions = sessions.filter((s: Session) => s.token !== token);
  await storage.setItem('sessions', updatedSessions);
}

// Update a user's profile
export async function updateUserProfile(
  id: string,
  profile: Partial<User>
): Promise<User | null> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  const index = users.findIndex((u: UserWithHash) => u.id === id);

  if (index === -1) return null;

  // Update user fields
  users[index] = {
    ...users[index],
    ...profile,
    // Don't allow updating these fields through this method
    id: users[index].id,
    email: profile.email || users[index].email,
    passwordHash: users[index].passwordHash,
  };

  await storage.setItem('users', users);

  // Return updated user without exposing password hash
  const { passwordHash, ...userWithoutHash } = users[index];
  return userWithoutHash;
}

// Change user password
export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  const index = users.findIndex((u: UserWithHash) => u.id === id);

  if (index === -1) return false;

  // Verify current password
  if (!compareSync(currentPassword, users[index].passwordHash)) {
    return false;
  }

  // Update password
  users[index].passwordHash = hashSync(newPassword, 10);
  await storage.setItem('users', users);

  return true;
}

// Reset a user's password (admin function)
export async function resetPassword(
  id: string,
  newPassword: string
): Promise<boolean> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  const index = users.findIndex((u: UserWithHash) => u.id === id);

  if (index === -1) return false;

  // Update password hash
  users[index].passwordHash = hashSync(newPassword, 10);
  await storage.setItem('users', users);

  return true;
}

// List all users
export async function listAllUsers(): Promise<User[]> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  // Return users without exposing password hashes
  return users.map(({ passwordHash, ...user }) => user);
}

// Delete user and their sessions
export async function deleteUser(id: string): Promise<boolean> {
  const users = (await storage.getItem<UserWithHash[]>('users')) || [];
  const sessions = (await storage.getItem<Session[]>('sessions')) || [];

  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return false;

  // Remove user
  users.splice(index, 1);
  await storage.setItem('users', users);

  // Remove any sessions for this user
  const updatedSessions = sessions.filter((s) => s.userId !== id);
  await storage.setItem('sessions', updatedSessions);

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
