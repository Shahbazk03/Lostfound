// Grants the admin role to an existing user.
//
//   node scripts/upgrade-admin.js someone@example.com
//
// Runs against whatever DATABASE_URL is in .env, which may be production.
require("dotenv").config();
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
const postgres = require("postgres");

const email = (process.argv[2] || "").trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: node scripts/upgrade-admin.js <email>");
  console.error("Refusing to run without a valid email address.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });

async function makeAdmin() {
  try {
    const rows = await sql`
      UPDATE users SET role = 'admin', updated_at = NOW()
      WHERE lower(email) = ${email}
      RETURNING id, email`;

    if (rows.length > 0) {
      console.log(`Success! User ${rows[0].email} is now an ADMIN.`);
    } else {
      console.log(`User ${email} not found in database.`);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Error updating user:", err.message || err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

makeAdmin();
