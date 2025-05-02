import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createSQLiteAdapter, verifyUserCredentials, seedAdminUser } from "@/lib/sqlite-db";
import { AdapterUser } from "next-auth/adapters";

// Initialize admin user for first run
try {
  seedAdminUser();
} catch (error) {
  console.error("Failed to seed admin user:", error);
}

// Extending the Session and JWT types to include our custom fields
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      department?: string | null;
    }
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    department?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
    department?: string | null;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  // While we've created a custom adapter, we'll temporarily disable it
  // until we resolve type compatibility issues
  // adapter: createSQLiteAdapter(),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Only continue if credentials are provided
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Verify credentials with SQLite
          const user = verifyUserCredentials(credentials.email, credentials.password);
          
          if (!user) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department, // This can be null
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role and department to the token when user signs in
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.department = user.department;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role and department to the session
      if (session.user) {
        session.user.id = token.userId;
        session.user.role = token.role;
        session.user.department = token.department;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
});