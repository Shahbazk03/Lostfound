// Sets a new password for an existing user.
//
//   npx tsx scripts/reset-password.ts <email> <new-password>
//
// The password must be at least 12 characters. Tip: prefix the command with a
// space or clear your shell history afterwards, since the password is an argument.
// Runs against whatever DATABASE_URL is in .env, which may be production.
import "dotenv/config";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { sql } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth";

const MIN_PASSWORD_LENGTH = 12;

async function resetPassword() {
  const [, , rawEmail, password] = process.argv;
  const email = rawEmail?.trim().toLowerCase();

  if (!email || !password) {
    console.error("Usage: npx tsx scripts/reset-password.ts <email> <new-password>");
    process.exitCode = 1;
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("The first argument must be an email address.");
    process.exitCode = 1;
    return;
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`The password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exitCode = 1;
    return;
  }

  const updated = await db
    .update(users)
    .set({ password: await hashPassword(password), updatedAt: new Date() })
    // Case-insensitive, matching how the app looks users up.
    .where(sql`lower(${users.email}) = ${email}`)
    .returning({ email: users.email });

  if (updated.length === 0) {
    console.error(`No user found with email ${email}. Nothing was changed.`);
    process.exitCode = 1;
    return;
  }
  console.log(`Password updated for ${updated[0].email}.`);
}

resetPassword()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
