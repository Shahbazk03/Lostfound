import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, userRoleEnum } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { authErrorResponse, badRequest, parseId } from "@/lib/api-errors";
import { and, asc, eq, ne, sql } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };
type Role = (typeof userRoleEnum.enumValues)[number];
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const ROLES: readonly string[] = userRoleEnum.enumValues;
const NAME_MAX_LENGTH = 100;
const PHONE_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** Never select the password hash. */
const SAFE_COLUMNS = {
  id: users.id,
  email: users.email,
  name: users.name,
  phone: users.phone,
  role: users.role,
  verified: users.verified,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

/**
 * Lock every admin row, in id order, so two requests can't each remove a
 * different admin and leave none. Returns the admin ids.
 */
async function lockAdmins(tx: Tx) {
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .orderBy(asc(users.id))
    .for("update");
  return rows.map((r) => r.id);
}

type UserUpdate = Partial<Pick<typeof users.$inferInsert, "name" | "email" | "phone" | "role" | "verified">>;

function validateUserUpdate(body: Record<string, unknown>): { data: UserUpdate } | { error: string } {
  const data: UserUpdate = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return { error: "Name can't be empty" };
    if (name.length > NAME_MAX_LENGTH) return { error: `Name must be at most ${NAME_MAX_LENGTH} characters` };
    data.name = name;
  }

  if (body.email !== undefined) {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
      return { error: "Enter a valid email address" };
    }
    data.email = email;
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === "") data.phone = null;
    else if (typeof body.phone !== "string" || body.phone.trim().length > PHONE_MAX_LENGTH) {
      return { error: `Phone must be at most ${PHONE_MAX_LENGTH} characters` };
    } else data.phone = body.phone.trim();
  }

  if (body.role !== undefined) {
    if (typeof body.role !== "string" || !ROLES.includes(body.role)) {
      return { error: "Role must be user or admin" };
    }
    data.role = body.role as Role;
  }

  if (body.verified !== undefined) {
    if (typeof body.verified !== "boolean") return { error: "verified must be true or false" };
    data.verified = body.verified;
  }

  return { data };
}

/**
 * Body: { name?, email?, phone?, role?: "user" | "admin", verified?: boolean }.
 * Other fields (id, createdAt, _count, ...) are ignored.
 * An admin can't demote themselves, and the last admin can't be demoted.
 * Response: { user } without the password hash.
 */
async function updateUser(request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const userId = parseId((await params).id);
    if (!userId) return badRequest("Invalid user id");

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Invalid request body");
    }

    const result = validateUserUpdate(body);
    if ("error" in result) return badRequest(result.error);
    const data = result.data;
    if (Object.keys(data).length === 0) return badRequest("Nothing to update");

    const outcome = await db.transaction(async (tx) => {
      const adminIds = data.role ? await lockAdmins(tx) : [];

      const [target] = await tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      if (!target) return { status: 404, error: "User not found" };

      if (data.role === "user" && target.role === "admin") {
        if (target.id === admin.id) {
          return { status: 409, error: "You can't remove your own admin role" };
        }
        if (adminIds.length <= 1) {
          return { status: 409, error: "This is the last admin; promote someone else first" };
        }
      }

      if (data.email) {
        const [taken] = await tx
          .select({ id: users.id })
          .from(users)
          .where(and(sql`lower(${users.email}) = ${data.email}`, ne(users.id, userId)))
          .limit(1);
        if (taken) return { status: 409, error: "Another account already uses this email" };
      }

      const [updated] = await tx
        .update(users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning(SAFE_COLUMNS);
      return { updated };
    });

    if ("updated" in outcome) return NextResponse.json({ user: outcome.updated });
    return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export { updateUser as PATCH, updateUser as PUT };

/** An admin can't delete themselves, and the last admin can't be deleted. */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const admin = await requireAdmin();
    const userId = parseId((await params).id);
    if (!userId) return badRequest("Invalid user id");
    if (userId === admin.id) {
      return NextResponse.json({ error: "You can't delete your own account here" }, { status: 409 });
    }

    const outcome = await db.transaction(async (tx) => {
      const adminIds = await lockAdmins(tx);
      const [target] = await tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .for("update");
      if (!target) return { status: 404, error: "User not found" };
      if (target.role === "admin" && adminIds.length <= 1) {
        return { status: 409, error: "This is the last admin and can't be deleted" };
      }

      await tx.delete(users).where(eq(users.id, userId));
      return null;
    });

    if (outcome) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
