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
export const conversationStatusEnum = pgEnum("conversation_status", ["ACTIVE", "BLOCKED", "CLOSED"]);
export const messageReceiptStatusEnum = pgEnum("message_receipt_status", ["DELIVERED", "READ"]);
export const chatReportStatusEnum = pgEnum("chat_report_status", ["PENDING", "REVIEWED"]);

// Visitor tracking table
export const visitors = pgTable("visitors", {
  id: serial("id").primaryKey(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userAgent: text("user_agent"),
  referer: text("referer"),
  path: varchar("path", { length: 500 }).notNull(),
  userId: integer("user_id").references(() => users.id), // null for anonymous visitors
  visitedAt: timestamp("visited_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 })
}, (table) => ({
  visitorDateIdx: index("visitor_date_idx").on(table.visitedAt),
  visitorIpIdx: index("visitor_ip_idx").on(table.ipAddress),
  visitorUserIdx: index("visitor_user_idx").on(table.userId),
  visitorSessionIdx: index("visitor_session_idx").on(table.sessionId)
}));

// Chat tables
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  status: conversationStatusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`)
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  userId: integer("user_id").notNull().references(() => users.id),
  lastReadMessageId: integer("last_read_message_id"),
  mutedUntil: timestamp("muted_until"),
  joinedAt: timestamp("joined_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  uniqueParticipant: index("unique_participant").on(table.conversationId, table.userId),
  participantUserIdx: index("participant_user_idx").on(table.userId)
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  body: text("body"),
  attachments: json("attachments"),
  sentAt: timestamp("sent_at").default(sql`CURRENT_TIMESTAMP`),
  editedAt: timestamp("edited_at"),
  deletedAt: timestamp("deleted_at")
}, (table) => ({
  messageConversationIdx: index("message_conversation_idx").on(table.conversationId, table.id),
  messageSenderIdx: index("message_sender_idx").on(table.senderId)
}));

export const messageReceipts = pgTable("message_receipts", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  status: messageReceiptStatusEnum("status").notNull(),
  at: timestamp("at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  uniqueReceipt: index("unique_receipt").on(table.messageId, table.userId, table.status)
}));

export const chatBlocks = pgTable("chat_blocks", {
  id: serial("id").primaryKey(),
  blockerId: integer("blocker_id").notNull().references(() => users.id),
  blockedId: integer("blocked_id").notNull().references(() => users.id),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  uniqueBlock: index("unique_block").on(table.blockerId, table.blockedId)
}));

export const chatReports = pgTable("chat_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull().references(() => users.id),
  messageId: integer("message_id").references(() => messages.id),
  targetUserId: integer("target_user_id").references(() => users.id),
  reason: varchar("reason", { length: 255 }).notNull(),
  status: chatReportStatusEnum("status").default("PENDING"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`)
});

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  gender: genderEnum("gender").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  island: varchar("island", { length: 64 }).notNull(),
  atoll: varchar("atoll", { length: 64 }).notNull(),
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
  themeConfig: json("theme_config"),
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
  phone: true,
  password: true,
  fullName: true,
  gender: true,
  island: true,
  atoll: true,
  job: true,
  education: true,
  shortBio: true,
  partnerPreferences: true
}).extend({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string()
    .min(7, "Phone number must be at least 7 digits")
    .max(8, "Phone number must be at most 8 digits")
    .regex(/^[0-9]+$/, "Phone number must contain only digits")
    .refine((phone) => {
      // Dhiraagu numbers start with 7, 9 or 3
      // Ooredoo numbers start with 7, 9, or 8
      return /^[37-9]/.test(phone);
    }, "Invalid Maldivian phone number")
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

// Chat types
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type InsertConversationParticipant = typeof conversationParticipants.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type MessageReceipt = typeof messageReceipts.$inferSelect;
export type InsertMessageReceipt = typeof messageReceipts.$inferInsert;
export type ChatBlock = typeof chatBlocks.$inferSelect;
export type InsertChatBlock = typeof chatBlocks.$inferInsert;
export type ChatReport = typeof chatReports.$inferSelect;
export type InsertChatReport = typeof chatReports.$inferInsert;

// Chat schemas
export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  body: true,
  attachments: true
});

export const insertChatReportSchema = createInsertSchema(chatReports).pick({
  messageId: true,
  targetUserId: true,
  reason: true
});

export const insertChatBlockSchema = createInsertSchema(chatBlocks).pick({
  blockedId: true,
  reason: true
});

// Visitor types and schemas
export type Visitor = typeof visitors.$inferSelect;
export type InsertVisitor = typeof visitors.$inferInsert;

export const insertVisitorSchema = createInsertSchema(visitors).pick({
  ipAddress: true,
  userAgent: true,
  referer: true,
  path: true,
  userId: true,
  sessionId: true,
  country: true,
  city: true
});
