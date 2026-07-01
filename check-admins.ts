import "dotenv/config";
import { db } from "./src/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function main() {
  const adminUsers = await db.select().from(users).where(eq(users.role, "admin"));
  
  if (adminUsers.length > 0) {
    console.log("Existing admins:");
    adminUsers.forEach(u => console.log(`Email: ${u.email}`));
  } else {
    console.log("No admins found. Creating a default admin...");
    
    const adminEmail = process.env.ADMIN_EMAIL || "admin@lostfound.in";
    const adminPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex");
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
    
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    const newAdmin = await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      name: process.env.ADMIN_NAME || "System Admin",
      role: "admin",
      verified: true
    }).returning();
    
    console.log("Created default admin:");
    console.log(`Email: ${newAdmin[0].email}`);
    
    if (!process.env.ADMIN_PASSWORD) {
        console.log(`Password: ${adminPassword} (auto-generated, please save this securely)`);
    } else {
        console.log(`Password: [HIDDEN]`);
    }
  }
  process.exit(0);
}

main().catch(console.error);
