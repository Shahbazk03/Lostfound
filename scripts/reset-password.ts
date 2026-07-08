import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function resetPassword() {
    const hashedPassword = await bcrypt.hash("password123", 12);
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, "admin@lostfound.in"));
    console.log("Password reset successfully to password123");
    process.exit(0);
}

resetPassword().catch(console.error);
