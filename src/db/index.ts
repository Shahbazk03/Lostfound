import * as dns from "node:dns";
dns.setDefaultResultOrder("ipv4first"); // Force IPv4 to bypass Windows IPv6 routing failures
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

// The database is far away (~250 ms per round trip from India to us-east-1),
// and opening a TLS connection costs several round trips (~2.5 s). So:
//  - keep ONE pool per process. In dev, hot reload re-evaluates this module;
//    without the globalThis cache every reload leaked a new pool (we saw a
//    3.4 GB dev server with hundreds of half-closed sockets).
//  - keep connections open longer so normal browsing reuses warm sockets.
//  - skip postgres.js' type-discovery query on connect (one less round trip);
//    Drizzle doesn't need it.
type Sql = ReturnType<typeof postgres>;
const globalForDb = globalThis as unknown as { __pgClient?: Sql };

const queryClient: Sql =
  globalForDb.__pgClient ??
  postgres(databaseUrl, {
    ssl: "require",
    max: 10, // homepage runs ~15 queries in parallel
    idle_timeout: 300, // seconds; release only after 5 idle minutes
    max_lifetime: 60 * 30, // recycle sockets every 30 minutes
    connect_timeout: 30,
    fetch_types: false,
    connection: { application_name: "lostfound-web" },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pgClient = queryClient;
}

export const db = drizzle(queryClient);

// Network errors worth one more try. The link to the database occasionally
// drops a connection (ECONNRESET), times out a new one (CONNECT_TIMEOUT) or
// fails a DNS lookup (ENOTFOUND); a single retry hides almost all of these.
const TRANSIENT_CODES = new Set([
  "CONNECT_TIMEOUT",
  "CONNECTION_CLOSED",
  "CONNECTION_ENDED",
  "CONNECTION_DESTROYED",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
]);

function isTransientDbError(error: unknown): boolean {
  for (let e: unknown = error, depth = 0; e && depth < 4; depth++) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string" && TRANSIENT_CODES.has(code)) return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Run a READ-ONLY database operation, retrying once after a transient
 * network error. Never wrap writes: a retried write could apply twice.
 */
export async function withDbRetry<T>(read: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (retries <= 0 || !isTransientDbError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return withDbRetry(read, retries - 1);
  }
}
