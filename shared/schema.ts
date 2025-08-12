import { sql } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  text, 
  integer, 
  decimal, 
  boolean, 
  timestamp, 
  json,
  primaryKey,
  index,
  pgEnum,
  serial
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const userStatusEnum = pgEnum("user_status", ["PENDING", "APPROVED", "REJECTED"]);
export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN", "SUPERADMIN"]);
export const postStatusEnum = pgEnum("post_status", ["PENDING", "APPROVED", "REJECTED", "HIDDEN"]);
export const requestStatusEnum = pgEnum("request_status", ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]);
export const topupStatusEnum = pgEnum("topup_status", ["PENDING", "APPROVED", "REJECTED"]);
export const ledgerReasonEnum = pgEnum("ledger_reason", ["TOPUP", "POST", "CONNECT", "ADJUST", "REFUND", "OTHER"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  gender: genderEnum("gender").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  island: varchar("island", { length: 64 }).notNull(),
  atoll: varchar("atoll", { length: 64 }).notNull(),
  religion: varchar("religion", { length: 64 }),
  job: varchar("job", { length: 128 }),
  education: varchar("education", { length: 128 }),
  shortBio: text("short_bio"),
  partnerPreferences: json("partner_preferences"),
  profilePhotoPath: varchar("profile_photo_path", { length: 255 }),
  telegramChatId: varchar("telegram_chat_id", { length: 128 }),
  telegramNotifications: boolean("telegram_notifications").default(false),
  status: userStatusEnum("status").default("PENDING"),
  role: userRoleEnum("role").default("USER"),
  coins: integer("coins").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  usernameIdx: index("username_idx").on(table.username),
  statusIdx: index("status_idx").on(table.status),
  roleIdx: index("role_idx").on(table.role)
}));

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: varchar("title", { length: 120 }),
  description: text("description").notNull(),
  imagePath: varchar("image_path", { length: 255 }),
  preferences: json("preferences"),
  status: postStatusEnum("status").default("PENDING"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  postUserIdIdx: index("post_user_id_idx").on(table.userId),
  postStatusIdx: index("post_status_idx").on(table.status)
}));

// Connection requests table
export const connectionRequests = pgTable("connection_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull(),
  targetUserId: integer("target_user_id").notNull(),
  postId: integer("post_id"),
  status: requestStatusEnum("status").default("PENDING"),
  adminNote: varchar("admin_note", { length: 255 }),
  refundApplied: boolean("refund_applied").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  connRequesterIdx: index("conn_requester_idx").on(table.requesterId),
  connTargetIdx: index("conn_target_idx").on(table.targetUserId),
  connStatusIdx: index("conn_status_idx").on(table.status)
}));

// Coin top-ups table
export const coinTopups = pgTable("coin_topups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amountMvr: decimal("amount_mvr", { precision: 10, scale: 2 }).notNull(),
  computedCoins: integer("computed_coins"),
  pricePerCoin: decimal("price_per_coin", { precision: 10, scale: 2 }).notNull(),
  slipPath: varchar("slip_path", { length: 255 }).notNull(),
  status: topupStatusEnum("status").default("PENDING"),
  adminNote: varchar("admin_note", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  topupUserIdIdx: index("topup_user_id_idx").on(table.userId),
  topupStatusIdx: index("topup_status_idx").on(table.status)
}));

// Coin ledger table
export const coinLedger = pgTable("coin_ledger", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  delta: integer("delta").notNull(),
  reason: ledgerReasonEnum("reason").notNull(),
  refTable: varchar("ref_table", { length: 32 }),
  refId: integer("ref_id"),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  ledgerUserIdIdx: index("ledger_user_id_idx").on(table.userId),
  ledgerReasonIdx: index("ledger_reason_idx").on(table.reason)
}));

// Settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  coinPriceMvr: decimal("coin_price_mvr", { precision: 10, scale: 2 }).default("10.00"),
  costPost: integer("cost_post").default(2),
  costConnect: integer("cost_connect").default(5),
  bankAccountName: varchar("bank_account_name", { length: 120 }),
  bankAccountNumber: varchar("bank_account_number", { length: 64 }),
  bankBranch: varchar("bank_branch", { length: 120 }),
  bankName: varchar("bank_name", { length: 120 }),
  telegramBotToken: varchar("telegram_bot_token", { length: 255 }),
  telegramAdminChatId: varchar("telegram_admin_chat_id", { length: 128 }),
  allowRefunds: boolean("allow_refunds").default(true),
  requireTargetAccept: boolean("require_target_accept").default(true),
  maxUploadMb: integer("max_upload_mb").default(5),
  allowedMimes: json("allowed_mimes"),
  branding: json("branding"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  data: json("data"),
  seen: boolean("seen").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  notifUserIdIdx: index("notif_user_id_idx").on(table.userId),
  notifSeenIdx: index("notif_seen_idx").on(table.seen)
}));

// Audit logs table
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entity: varchar("entity", { length: 32 }).notNull(),
  entityId: integer("entity_id").notNull(),
  meta: json("meta"),
  ip: varchar("ip", { length: 45 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  adminIdIdx: index("admin_id_idx").on(table.adminId),
  actionIdx: index("action_idx").on(table.action)
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
  gender: true,
  dateOfBirth: true,
  island: true,
  atoll: true,
  religion: true,
  job: true,
  education: true,
  shortBio: true,
  partnerPreferences: true
}).extend({
  confirmPassword: z.string().min(8, "Password must be at least 8 characters")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertPostSchema = createInsertSchema(posts).pick({
  title: true,
  description: true,
  preferences: true
});

export const insertCoinTopupSchema = createInsertSchema(coinTopups).pick({
  amountMvr: true
});

export const insertConnectionRequestSchema = createInsertSchema(connectionRequests).pick({
  targetUserId: true,
  postId: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type ConnectionRequest = typeof connectionRequests.$inferSelect;
export type InsertConnectionRequest = z.infer<typeof insertConnectionRequestSchema>;
export type CoinTopup = typeof coinTopups.$inferSelect;
export type InsertCoinTopup = z.infer<typeof insertCoinTopupSchema>;
export type CoinLedgerEntry = typeof coinLedger.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Audit = typeof audits.$inferSelect;
