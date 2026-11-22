// Lists admin accounts. If there are none, creates one from environment
// variables:
//
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_NAME=...] npx tsx check-admins.ts
//
// Passwords are never generated or printed; supply one (min 12 chars) via
// ADMIN_PASSWORD. Runs against whatever DATABASE_URL is in .env.
import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth";

const MIN_PASSWORD_LENGTH = 12;

async function main() {
  const adminUsers = await db.select({ email: users.email }).from(users).where(eq(users.role, "admin"));

  if (adminUsers.length > 0) {
    console.log("Existing admins:");
    adminUsers.forEach((u) => console.log(`Email: ${u.email}`));
    return;
  }

  console.log("No admins found.");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first admin. Nothing was created.");
    process.exitCode = 1;
    return;
  }
  if (adminPassword.length < MIN_PASSWORD_LENGTH) {
    console.error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters. Nothing was created.`);
    process.exitCode = 1;
    return;
  }

  const [newAdmin] = await db
    .insert(users)
    .values({
      email: adminEmail,
      password: await hashPassword(adminPassword),
      name: process.env.ADMIN_NAME || "System Admin",
      role: "admin",
      verified: true,
    })
    .returning({ email: users.email });

  console.log(`Created admin: ${newAdmin.email} (password as supplied in ADMIN_PASSWORD)`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
