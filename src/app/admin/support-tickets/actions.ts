"use server";

import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";

// Server actions are reachable by a direct POST from anyone, regardless of the
// /admin middleware, so every action checks the caller itself.

const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
type TicketStatus = (typeof TICKET_STATUSES)[number];

export async function getSupportTickets(search?: string, status?: string) {
  await requireAdmin();

  const results = await db
    .select({
      id: supportTickets.id,
      name: supportTickets.name,
      email: supportTickets.email,
      message: supportTickets.message,
      status: supportTickets.status,
      userId: supportTickets.userId,
      assignedTo: supportTickets.assignedTo,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
    })
    .from(supportTickets)
    .orderBy(desc(supportTickets.createdAt));

  const q = search?.toLowerCase();
  return results.filter((t) => {
    const matchesSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q);
    const matchesStatus = !status || status === "all" || t.status === status;
    return matchesSearch && matchesStatus;
  });
}

export async function getTicketStats() {
  await requireAdmin();

  const allTickets = await db
    .select({ status: supportTickets.status })
    .from(supportTickets);
  return {
    total: allTickets.length,
    open: allTickets.filter((t) => t.status === "open").length,
    inProgress: allTickets.filter((t) => t.status === "in_progress").length,
    resolved: allTickets.filter((t) => t.status === "resolved").length,
    closed: allTickets.filter((t) => t.status === "closed").length,
  };
}

export async function updateTicketStatus(ticketId: number, newStatus: TicketStatus) {
  await requireAdmin();
  if (!TICKET_STATUSES.includes(newStatus)) throw new Error("Invalid status");

  await db
    .update(supportTickets)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  revalidatePath("/admin/support-tickets");
}

export async function updateTicketDetails(
  ticketId: number,
  data: { name?: string; email?: string; message?: string }
) {
  await requireAdmin();

  // Only these three fields may change; never spread the raw input.
  const update: { name?: string; email?: string; message?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (typeof data.name === "string") update.name = data.name.slice(0, 255);
  if (typeof data.email === "string") update.email = data.email.slice(0, 255);
  if (typeof data.message === "string") update.message = data.message.slice(0, 10_000);

  await db.update(supportTickets).set(update).where(eq(supportTickets.id, ticketId));
  revalidatePath("/admin/support-tickets");
}

export async function deleteTicket(ticketId: number) {
  await requireAdmin();
  await db.delete(supportTickets).where(eq(supportTickets.id, ticketId));
  revalidatePath("/admin/support-tickets");
}

export async function deleteMultipleTickets(ticketIds: number[]) {
  await requireAdmin();
  const ids = ticketIds.filter((id) => Number.isInteger(id));
  if (ids.length === 0) return;
  await db.delete(supportTickets).where(inArray(supportTickets.id, ids));
  revalidatePath("/admin/support-tickets");
}
