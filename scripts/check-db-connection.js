// Read-only connectivity check for DATABASE_URL, using the same driver and
// options as src/db/index.ts (postgres.js, SSL required, IPv4-first DNS).
// Useful for telling "the database is unreachable" apart from app errors.
//
//   node scripts/check-db-connection.js
//
// Only runs `SELECT NOW()`; it never writes.
require('dotenv').config();
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
const postgres = require('postgres');

async function test() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set.");
    process.exitCode = 1;
    return;
  }
  console.log("Connecting...");
  const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, connect_timeout: 30 });
  try {
    const [row] = await sql`SELECT NOW() AS now`;
    console.log("SUCCESS: database time is", row.now);
  } catch (err) {
    console.error("FAILED:", err.message || err);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}
test();
