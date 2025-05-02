// User management utility functions for admin operations
import { 
  getAuthDb, 
  createUserWithCredentials, 
  verifyUserCredentials,
  getUserProfile
} from "@/lib/sqlite-db";
import { getSupabaseServerClient } from "@/lib/supabase";

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  department?: string;
}

export interface UserUpdateInput {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'staff';
  department?: string;
  status?: 'active' | 'inactive';
}

// Create a new user with server-side validation
export async function createUser(userData: UserCreateInput) {
  // Validate input
  if (!userData.name || !userData.email || !userData.password) {
    throw new Error('Name, email and password are required');
  }
  
  if (!userData.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  if (userData.password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  // Create user in local SQLite
  try {
    const user = createUserWithCredentials(
      userData.email,
      userData.name,
      userData.password,
      userData.role
    );
    
    // If user was created successfully in SQLite, also try to create in Supabase if online
    try {
      const supabase = getSupabaseServerClient();
      
      // Register user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      });
      
      if (authError) {
        console.error('Supabase auth user creation failed:', authError);
        // Continue anyway, as we've already created the user in SQLite
      } else if (authData?.user) {
        // Create user profile in Supabase database
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          department: userData.department,
          status: 'active'
        });
        
        if (profileError) {
          console.error('Supabase user profile creation failed:', profileError);
        }
      }
    } catch (supabaseError) {
      console.error('Error creating user in Supabase:', supabaseError);
      // Continue anyway, as we've already created the user in SQLite
    }
    
    return user;
  } catch (error) {
    console.error('Error creating user in SQLite:', error);
    throw error;
  }
}

// List all users with pagination
export async function listUsers(page = 1, pageSize = 10) {
  try {
    const db = getAuthDb();
    
    // Get total count
    const countResult = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalUsers = countResult.count;
    
    // Calculate offset
    const offset = (page - 1) * pageSize;
    
    // Get users with profiles
    const query = `
      SELECT u.id, u.name, u.email, u.created_at, p.role, p.department, p.status
      FROM users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const users = db.prepare(query).all(pageSize, offset);
    
    return {
      users,
      pagination: {
        total: totalUsers,
        page,
        pageSize,
        totalPages: Math.ceil(totalUsers / pageSize)
      }
    };
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

// Update user details
export async function updateUser(userData: UserUpdateInput) {
  try {
    const db = getAuthDb();
    
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userData.id);
    if (!existingUser) {
      throw new Error(`User not found: ${userData.id}`);
    }
    
    db.transaction(() => {
      // Update name and email if provided
      if (userData.name || userData.email) {
        const updates = [];
        const params = [];
        
        if (userData.name) {
          updates.push('name = ?');
          params.push(userData.name);
        }
        
        if (userData.email) {
          updates.push('email = ?');
          params.push(userData.email);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userData.id); // For the WHERE clause
        
        db.prepare(`
          UPDATE users 
          SET ${updates.join(', ')} 
          WHERE id = ?
        `).run(...params);
      }
      
      // Update profile if role, department or status provided
      if (userData.role || userData.department || userData.status) {
        const updates = [];
        const params = [];
        
        if (userData.role) {
          updates.push('role = ?');
          params.push(userData.role);
        }
        
        if (userData.department) {
          updates.push('department = ?');
          params.push(userData.department);
        }
        
        if (userData.status) {
          updates.push('status = ?');
          params.push(userData.status);
        }
        
        params.push(userData.id); // For the WHERE clause
        
        db.prepare(`
          UPDATE user_profiles 
          SET ${updates.join(', ')} 
          WHERE user_id = ?
        `).run(...params);
      }
    })();
    
    // Try to update in Supabase if online
    try {
      const supabase = getSupabaseServerClient();
      
      // Update user profile in Supabase database
      if (userData.role || userData.department || userData.status) {
        const updateData: any = {};
        
        if (userData.name) updateData.name = userData.name;
        if (userData.email) updateData.email = userData.email;
        if (userData.role) updateData.role = userData.role;
        if (userData.department) updateData.department = userData.department;
        if (userData.status) updateData.status = userData.status;
        
        const { error } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', userData.id);
        
        if (error) {
          console.error('Supabase user profile update failed:', error);
        }
      }
    } catch (supabaseError) {
      console.error('Error updating user in Supabase:', supabaseError);
    }
    
    // Return updated user
    return getUserProfile(userData.id);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Delete a user
export async function deleteUser(userId: string) {
  try {
    const db = getAuthDb();
    
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existingUser) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Delete user and related records (cascade handles this)
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    
    // Try to delete in Supabase if online
    try {
      const supabase = getSupabaseServerClient();
      
      // Delete user profile in Supabase database
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        console.error('Supabase user profile deletion failed:', profileError);
      }
      
      // Delete from auth system
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Supabase auth user deletion failed:', authError);
      }
    } catch (supabaseError) {
      console.error('Error deleting user in Supabase:', supabaseError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Reset a user's password
export async function resetUserPassword(userId: string, newPassword: string) {
  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  try {
    const db = getAuthDb();
    const bcrypt = require('bcryptjs');
    
    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existingUser) {
      throw new Error(`User not found: ${userId}`);
    }
    
    // Update password hash
    const passwordHash = bcrypt.hashSync(newPassword, 10);
    
    db.prepare(`
      UPDATE user_credentials 
      SET password_hash = ? 
      WHERE user_id = ?
    `).run(passwordHash, userId);
    
    // Try to update in Supabase if online
    try {
      const supabase = getSupabaseServerClient();
      
      // Update password in Supabase auth
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      
      if (error) {
        console.error('Supabase password reset failed:', error);
      }
    } catch (supabaseError) {
      console.error('Error resetting password in Supabase:', supabaseError);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}