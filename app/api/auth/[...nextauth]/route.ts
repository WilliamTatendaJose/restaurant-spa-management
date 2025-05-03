import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { createSQLiteAdapter, verifyUserCredentials, seedAdminUser } from "@/lib/sqlite-db";

// Initialize admin user for first run
try {
  seedAdminUser();
  // Also create the "admiadmin@restaurant-spa.com" user
  seedAdminUser("admiadmin@restaurant-spa.com", "Admin@123");
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

const handler = NextAuth({
  // Properly enable the SQLite adapter
  adapter: createSQLiteAdapter(),
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

          console.log(`Auth: Attempting login with email: ${credentials.email}`);

          // Verify credentials with SQLite
          const user = verifyUserCredentials(credentials.email, credentials.password);
          
          if (!user) {
            console.log(`Auth: Invalid credentials for ${credentials.email}`);
            return null;
          }

          console.log(`Auth: Successful login for ${credentials.email}`);
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
      // Add role and department to the session with proper type casting
      if (session.user) {
        session.user.id = token.userId as string | undefined;
        session.user.role = token.role as string | undefined;
        session.user.department = token.department as string | null | undefined;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };