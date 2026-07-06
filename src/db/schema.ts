import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const itemTypeEnum = pgEnum("item_type", ["lost", "found"]);
export const itemStatusEnum = pgEnum("item_status", [
  "active",
  "resolved",
  "archived",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
]);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", [
  "pending",
  "completed",
  "rejected",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "incomplete",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatar: text("avatar"),
  role: userRoleEnum("role").default("user").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: itemTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  approximateLocation: varchar("approximate_location", { length: 255 }).notNull(),
  preciseLocation: text("precise_location"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  dateLostFound: timestamp("date_lost_found").notNull(),
  timeframe: varchar("timeframe", { length: 100 }),
  photos: jsonb("photos").$type<string[]>().default([]),
  status: itemStatusEnum("status").default("active").notNull(),
  unlockAmount: integer("unlock_amount").default(100).notNull(), // Amount in cents
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  stripeSessionId: varchar("stripe_session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  status: withdrawalStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  receiverId: integer("receiver_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  organizationName: varchar("organization_name", { length: 255 }).notNull(),
  description: text("description"),
  contactEmail: varchar("contact_email", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  logo: text("logo"),
  banner: text("banner"),
  supportEmail: varchar("support_email", { length: 255 }),
  supportPhone: varchar("support_phone", { length: 50 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type NewWithdrawalRequest = typeof withdrawalRequests.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type OrganizationSettings = typeof organizationSettings.$inferSelect;
export type NewOrganizationSettings = typeof organizationSettings.$inferInsert;

export const gameRewards = pgTable("game_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  level: integer("level").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GameReward = typeof gameRewards.$inferSelect;
export type NewGameReward = typeof gameRewards.$inferInsert;

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  plan: varchar("plan", { length: 50 }).notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const unlockedConversations = pgTable("unlocked_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type UnlockedConversation = typeof unlockedConversations.$inferSelect;
export type NewUnlockedConversation = typeof unlockedConversations.$inferInsert;
