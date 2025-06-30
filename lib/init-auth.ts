'use client';

import * as offlineAuth from '@/lib/offline-auth';

// Function to initialize the offline authentication system
export async function initializeOfflineAuth() {
  try {
    // Check if initialization already happened (by seeing if admin user exists)
    const adminUser = await offlineAuth.getUserByEmail(
      'admin@restaurant-spa.com'
    );

    if (!adminUser) {
      console.log('Seeding default admin user...');

      // Create default admin user
      await offlineAuth.createUser({
        name: 'Administrator',
        email: 'admin@restaurant-spa.com',
        password: 'Admin@123',
        role: 'admin',
      });

      // Create a secondary admin user
      await offlineAuth.createUser({
        name: 'Admin Admin',
        email: 'admiadmin@restaurant-spa.com',
        password: 'Admin@123',
        role: 'admin',
      });

      console.log('Default admin users created successfully');
    }

    return true;
  } catch (error) {
    console.error('Error initializing offline auth:', error);
    return false;
  }
}

// Export initialization function as default
export default initializeOfflineAuth;
