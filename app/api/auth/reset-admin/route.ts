// import { NextResponse } from "next/server";
// import { createUserWithCredentials } from "@/lib/sqlite-db";
// import { getAuthDb } from "@/lib/sqlite-db";

// export async function GET() {
//   try {
//     // Define the admin email and password
//     const adminEmail = "admiadmin@restaurant-spa.com";
//     const adminPassword = "Admin@123";
    
//     const db = getAuthDb();
    
//     // Check if this specific admin user already exists
//     const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(adminEmail);
    
//     if (existingUser) {
//       // If the user exists, delete and recreate it to reset the password
//       db.prepare('DELETE FROM users WHERE email = ?').run(adminEmail);
//       console.log(`Existing admin user ${adminEmail} deleted`);
//     }
    
//     // Create the admin user
//     const newAdmin = createUserWithCredentials(adminEmail, "Administrator", adminPassword, "admin");
    
//     return NextResponse.json({ 
//       success: true, 
//       message: `Admin user reset successfully: ${adminEmail}`,
//       user: {
//         id: newAdmin.id,
//         name: newAdmin.name,
//         email: newAdmin.email,
//         role: newAdmin.role
//       }
//     });
//   } catch (error) {
//     console.error("Failed to reset admin user:", error);
//     return NextResponse.json({ 
//       success: false, 
//       error: error instanceof Error ? error.message : "Unknown error" 
//     }, { status: 500 });
//   }
// }