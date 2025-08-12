import { sql } from "drizzle-orm";
import { 
  mysqlTable, 
  varchar, 
  text, 
  int, 
  decimal, 
  boolean, 
  timestamp, 
  json,
  primaryKey,
  index,
  mysqlEnum
} from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female", "other"]).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  island: varchar("island", { length: 64 }).notNull(),
  atoll: varchar("atoll", { length: 64 }).notNull(),
  religion: varchar("religion", { length: 64 }),
  job: varchar("job", { length: 128 }),
  education: varchar("education", { length: 128 }),
  shortBio: text("short_bio"),
  partnerPreferences: json("partner_preferences"),
  profilePhotoPath: varchar("profile_photo_path", { length: 255 }),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  role: mysqlEnum("role", ["USER", "ADMIN", "SUPERADMIN"]).default("USER"),
  coins: int("coins").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  usernameIdx: index("username_idx").on(table.username),
  statusIdx: index("status_idx").on(table.status),
  roleIdx: index("role_idx").on(table.role)
}));

// Posts table
export const posts = mysqlTable("posts", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 120 }),
  description: text("description").notNull(),
  imagePath: varchar("image_path", { length: 255 }),
  preferences: json("preferences"),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED", "HIDDEN"]).default("PENDING"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status)
}));

// Connection requests table
export const connectionRequests = mysqlTable("connection_requests", {
  id: int("id").primaryKey().autoincrement(),
  requesterId: int("requester_id").notNull(),
  targetUserId: int("target_user_id").notNull(),
  postId: int("post_id"),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).default("PENDING"),
  adminNote: varchar("admin_note", { length: 255 }),
  refundApplied: boolean("refund_applied").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
}, (table) => ({
  requesterIdx: index("requester_idx").on(table.requesterId),
  targetIdx: index("target_idx").on(table.targetUserId),
  statusIdx: index("status_idx").on(table.status)
}));

// Coin top-ups table
export const coinTopups = mysqlTable("coin_topups", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  amountMvr: decimal("amount_mvr", { precision: 10, scale: 2 }).notNull(),
  computedCoins: int("computed_coins"),
  pricePerCoin: decimal("price_per_coin", { precision: 10, scale: 2 }).notNull(),
  slipPath: varchar("slip_path", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
  adminNote: varchar("admin_note", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status)
}));

// Coin ledger table
export const coinLedger = mysqlTable("coin_ledger", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  delta: int("delta").notNull(),
  reason: mysqlEnum("reason", ["TOPUP", "POST", "CONNECT", "ADJUST", "REFUND"]).notNull(),
  refTable: varchar("ref_table", { length: 32 }),
  refId: int("ref_id"),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  reasonIdx: index("reason_idx").on(table.reason)
}));

// Settings table
export const settings = mysqlTable("settings", {
  id: int("id").primaryKey().default(1),
  coinPriceMvr: decimal("coin_price_mvr", { precision: 10, scale: 2 }).default("10.00"),
  costPost: int("cost_post").default(2),
  costConnect: int("cost_connect").default(5),
  bankAccountName: varchar("bank_account_name", { length: 120 }),
  bankAccountNumber: varchar("bank_account_number", { length: 64 }),
  bankBranch: varchar("bank_branch", { length: 120 }),
  bankName: varchar("bank_name", { length: 120 }),
  allowRefunds: boolean("allow_refunds").default(true),
  requireTargetAccept: boolean("require_target_accept").default(true),
  maxUploadMb: int("max_upload_mb").default(5),
  allowedMimes: json("allowed_mimes"),
  branding: json("branding"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
});

// Notifications table
export const notifications = mysqlTable("notifications", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  data: json("data"),
  seen: boolean("seen").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
  seenIdx: index("seen_idx").on(table.seen)
}));

// Audit logs table
export const audits = mysqlTable("audits", {
  id: int("id").primaryKey().autoincrement(),
  adminId: int("admin_id").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entity: varchar("entity", { length: 32 }).notNull(),
  entityId: int("entity_id").notNull(),
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
