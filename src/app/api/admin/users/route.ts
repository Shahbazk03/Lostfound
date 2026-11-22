import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, items, payments, userRoleEnum } from "@/db/schema";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { authErrorResponse, badRequest } from "@/lib/api-errors";
import { eq, desc, sql, count } from "drizzle-orm";

type Role = (typeof userRoleEnum.enumValues)[number];
const ROLES: readonly string[] = userRoleEnum.enumValues;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

/** Never select the password hash. */
const SAFE_COLUMNS = {
  id: users.id,
  email: users.email,
  name: users.name,
  phone: users.phone,
  role: users.role,
  verified: users.verified,
  createdAt: users.createdAt,
};

export async function GET() {
  try {
    await requireAdmin();
    const allUsers = await db.select(SAFE_COLUMNS).from(users).orderBy(desc(users.createdAt));

    const earningsRows = await db
      .select({
        userId: items.userId,
        currency: sql<string>`upper(${payments.currency})`,
        total: sql<string>`sum(${payments.amount})`,
      })
      .from(payments)
      .innerJoin(items, eq(payments.itemId, items.id))
      .where(eq(payments.status, "completed"))
      .groupBy(items.userId, sql`upper(${payments.currency})`);

    const earningsMap = new Map<number, Record<string, number>>();
    for (const row of earningsRows) {
      const entry = earningsMap.get(row.userId) ?? {};
      entry[row.currency] = (entry[row.currency] ?? 0) + Number(row.total);
      earningsMap.set(row.userId, entry);
    }

    const itemCounts = await db
      .select({ userId: items.userId, count: count() })
      .from(items)
      .groupBy(items.userId);
    const itemsCountMap = new Map(itemCounts.map((row) => [row.userId, row.count]));

    const usersWithEarnings = allUsers.map((user) => ({
      ...user,
      totalEarned: earningsMap.get(user.id) || { USD: 0 },
      _count: { items: itemsCountMap.get(user.id) || 0 },
    }));

    return NextResponse.json({ users: usersWithEarnings });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Body: { name, email, password, role?: "user" | "admin" } (role defaults to "user").
 * Response: { user } without the password hash.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Invalid request body");
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return badRequest("Name is required");
    if (name.length > NAME_MAX_LENGTH) return badRequest(`Name must be at most ${NAME_MAX_LENGTH} characters`);

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      return badRequest("Enter a valid email address");
    }

    const password = body.password;
    if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
      return badRequest(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
      return badRequest(`Password must be at most ${PASSWORD_MAX_LENGTH} characters`);
    }

    let role: Role = "user";
    if (body.role !== undefined) {
      if (typeof body.role !== "string" || !ROLES.includes(body.role)) {
        return badRequest("Role must be user or admin");
      }
      role = body.role as Role;
    }

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);
    if (existing) return badRequest("Email already exists");

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: await hashPassword(password),
        role,
        verified: false,
      })
      .returning(SAFE_COLUMNS);

    return NextResponse.json({ user: newUser });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    const code = (error as { code?: string; cause?: { code?: string } })?.cause?.code;
    if (code === "23505") return badRequest("Email already exists");
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
