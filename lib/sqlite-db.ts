import { Database } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// Set up database directory in a persistent location
const DB_DIR = path.resolve(process.cwd(), '.db');
const USER_DB_PATH = path.join(DB_DIR, 'auth.db');

// Ensure the database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database | null = null;

// Define types for database results
interface UserRecord {
  id: string;
  name: string;
  email: string;
  email_verified: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface SessionRecord {
  id: string;
  session_token: string;
  user_id: string;
  expires: string;
  [key: string]: any;
}

interface VerificationTokenRecord {
  identifier: string;
  token: string;
  expires: string;
}

interface UserCredentialsRecord {
  id: string;
  user_id: string;
  password_hash: string;
}

interface UserProfileRecord {
  id: string;
  user_id: string;
  role: string;
  department: string | null;
  status: string;
  settings: string | null;
}

// Initialize SQLite database with authentication tables
export function getAuthDb(): Database {
  if (db) return db;

  // Only run in server context
  if (typeof window !== 'undefined') {
    throw new Error('SQLite database can only be accessed on the server side');
  }

  try {
    // Import better-sqlite3 dynamically to avoid issues with Next.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sqlite3 = require('better-sqlite3');
    db = new sqlite3(USER_DB_PATH, { verbose: process.env.NODE_ENV === 'development' ? console.log : undefined });
    
    // Initialize the auth tables if they don't exist
    initializeAuthTables();
    
    return db!;
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
    throw new Error(`Failed to initialize SQLite database: ${error}`);
  }
}

// Create the authentication tables if they don't exist
function initializeAuthTables() {
  const database = db; // Store in local variable to prevent null check warnings
  if (!database) return;

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      email_verified DATETIME,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Accounts table (for OAuth providers)
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Sessions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      expires DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Verification tokens table (for email verification)
  database.exec(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT,
      token TEXT,
      expires DATETIME NOT NULL,
      PRIMARY KEY (identifier, token)
    )
  `);

  // User credentials table (for username/password auth)
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // User profiles table (for additional user data)
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      department TEXT,
      status TEXT DEFAULT 'active',
      settings TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

// Create a SQLite adapter for NextAuth
export function createSQLiteAdapter() {
  const db = getAuthDb();

  return {
    // User operations
    async createUser(user: any) {
      const userId = randomUUID();
      const stmt = db.prepare(`
        INSERT INTO users (id, name, email, email_verified, image)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        userId,
        user.name || null,
        user.email,
        user.emailVerified ? user.emailVerified.toISOString() : null,
        user.image || null
      );

      // Create default profile for user
      const profileStmt = db.prepare(`
        INSERT INTO user_profiles (id, user_id, role)
        VALUES (?, ?, ?)
      `);
      
      profileStmt.run(
        userId,
        userId,
        'staff' // Default role
      );

      return {
        id: userId,
        ...user,
      };
    },

    async getUser(id: string) {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
      const user = stmt.get(id) as UserRecord | undefined;
      
      if (!user) return null;
      
      return {
        ...user,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },

    async getUserByEmail(email: string) {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const user = stmt.get(email) as UserRecord | undefined;
      
      if (!user) return null;
      
      return {
        ...user,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },

    async getUserByAccount({ provider, providerAccountId }: { provider: string, providerAccountId: string }) {
      const stmt = db.prepare(`
        SELECT u.* FROM users u
        JOIN accounts a ON u.id = a.user_id
        WHERE a.provider = ? AND a.provider_account_id = ?
      `);
      
      const user = stmt.get(provider, providerAccountId) as UserRecord | undefined;
      
      if (!user) return null;
      
      return {
        ...user,
        emailVerified: user.email_verified ? new Date(user.email_verified) : null,
      };
    },

    async updateUser(user: any) {
      const stmt = db.prepare(`
        UPDATE users
        SET name = ?, email = ?, email_verified = ?, image = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      
      stmt.run(
        user.name || null,
        user.email,
        user.emailVerified ? user.emailVerified.toISOString() : null,
        user.image || null,
        user.id
      );
      
      return user;
    },

    async deleteUser(userId: string) {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(userId);
    },

    // Session operations
    async createSession(session: any) {
      const stmt = db.prepare(`
        INSERT INTO sessions (id, session_token, user_id, expires)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(
        randomUUID(),
        session.sessionToken,
        session.userId,
        session.expires.toISOString()
      );
      
      return session;
    },

    async getSessionAndUser(sessionToken: string) {
      const stmt = db.prepare(`
        SELECT s.*, u.* FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ?
      `);
      
      const result = stmt.get(sessionToken) as (SessionRecord & UserRecord) | undefined;
      
      if (!result) return null;
      
      const { id, session_token, user_id, expires, ...userData } = result;
      
      return {
        session: {
          id,
          sessionToken: session_token,
          userId: user_id,
          expires: new Date(expires),
        },
        user: {
          id: user_id,
          ...userData,
          emailVerified: userData.email_verified ? new Date(userData.email_verified) : null,
        },
      };
    },

    async updateSession(session: any) {
      const stmt = db.prepare(`
        UPDATE sessions
        SET expires = ?
        WHERE session_token = ?
      `);
      
      stmt.run(session.expires.toISOString(), session.sessionToken);
      
      return session;
    },

    async deleteSession(sessionToken: string) {
      const stmt = db.prepare('DELETE FROM sessions WHERE session_token = ?');
      stmt.run(sessionToken);
    },

    // Account operations
    async linkAccount(account: any) {
      const stmt = db.prepare(`
        INSERT INTO accounts (
          id, user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at, token_type, scope, id_token, session_state
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        randomUUID(),
        account.userId,
        account.type,
        account.provider,
        account.providerAccountId,
        account.refresh_token || null,
        account.access_token || null,
        account.expires_at || null,
        account.token_type || null,
        account.scope || null,
        account.id_token || null,
        account.session_state || null
      );
      
      return account;
    },

    async unlinkAccount({ provider, providerAccountId }: { provider: string, providerAccountId: string }) {
      const stmt = db.prepare(`
        DELETE FROM accounts
        WHERE provider = ? AND provider_account_id = ?
      `);
      
      stmt.run(provider, providerAccountId);
    },

    // Verification token operations
    async createVerificationToken(verificationToken: any) {
      const stmt = db.prepare(`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (?, ?, ?)
      `);
      
      stmt.run(
        verificationToken.identifier,
        verificationToken.token,
        verificationToken.expires.toISOString()
      );
      
      return verificationToken;
    },

    async useVerificationToken({ identifier, token }: { identifier: string, token: string }) {
      const stmt = db.prepare(`
        SELECT * FROM verification_tokens
        WHERE identifier = ? AND token = ?
      `);
      
      const verificationToken = stmt.get(identifier, token) as VerificationTokenRecord | undefined;
      
      if (!verificationToken) return null;
      
      const deleteStmt = db.prepare(`
        DELETE FROM verification_tokens
        WHERE identifier = ? AND token = ?
      `);
      
      deleteStmt.run(identifier, token);
      
      return {
        ...verificationToken,
        expires: new Date(verificationToken.expires),
      };
    },
  };
}

// User credentials management
export function createUserWithCredentials(email: string, name: string, password: string, role: string = 'staff') {
  const db = getAuthDb();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require('bcryptjs');
  
  // Check if user already exists
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRecord | undefined;
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Create user in transaction
  const userId = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  
  db.transaction(() => {
    // Insert user
    db.prepare(`
      INSERT INTO users (id, name, email)
      VALUES (?, ?, ?)
    `).run(userId, name, email);
    
    // Insert credentials
    db.prepare(`
      INSERT INTO user_credentials (id, user_id, password_hash)
      VALUES (?, ?, ?)
    `).run(randomUUID(), userId, passwordHash);
    
    // Insert profile
    db.prepare(`
      INSERT INTO user_profiles (id, user_id, role)
      VALUES (?, ?, ?)
    `).run(userId, userId, role);
  })();
  
  return { id: userId, name, email, role };
}

export function verifyUserCredentials(email: string, password: string) {
  const db = getAuthDb();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require('bcryptjs');
  
  // Get user and credentials
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRecord | undefined;
  if (!user) return null;
  
  const credentials = db.prepare('SELECT * FROM user_credentials WHERE user_id = ?').get(user.id) as UserCredentialsRecord | undefined;
  if (!credentials) return null;
  
  // Verify password
  const validPassword = bcrypt.compareSync(password, credentials.password_hash);
  if (!validPassword) return null;
  
  // Get user profile
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id) as UserProfileRecord | undefined;
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: profile?.role || 'staff',
    department: profile?.department || null,
  };
}

// Get user profile with role information
export function getUserProfile(userId: string) {
  const db = getAuthDb();
  
  const query = `
    SELECT u.id, u.name, u.email, p.role, p.department, p.status
    FROM users u
    LEFT JOIN user_profiles p ON u.id = p.user_id
    WHERE u.id = ?
  `;
  
  return db.prepare(query).get(userId) as (UserRecord & Partial<UserProfileRecord>) | undefined;
}

// Seed admin user if no users exist
export function seedAdminUser(email: string = 'admin@restaurant-spa.com', password: string = 'Admin@123') {
  try {
    const db = getAuthDb();
    
    console.log('Seeding admin user with email:', email);
    
    // First, check if this specific admin user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRecord | undefined;
    
    if (existingUser) {
      console.log(`Admin user ${email} already exists, skipping creation.`);
      return;
    }
    
    // Create the admin user
    try {
      createUserWithCredentials(email, 'Administrator', password, 'admin');
      console.log('Admin user created successfully:', email);
    } catch (error) {
      console.error(`Failed to create admin user ${email}:`, error);
    }
    
    // For debugging, list all users
    const users = db.prepare('SELECT id, name, email FROM users LIMIT 5').all() as { id: string, name: string, email: string }[];
    console.log('Existing users:', users.map(u => `${u.name} (${u.email})`).join(', '));
    
  } catch (error) {
    console.error('Error in seedAdminUser:', error);
  }
}