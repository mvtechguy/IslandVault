import { 
  User, 
  InsertUser, 
  Post, 
  InsertPost, 
  ConnectionRequest, 
  InsertConnectionRequest,
  CoinTopup,
  InsertCoinTopup,
  CoinPackage,
  InsertCoinPackage,
  BankAccount,
  InsertBankAccount,
  CoinLedgerEntry,
  Settings,
  Notification,
  Audit,
  Conversation,
  ConversationParticipant,
  Message,
  MessageReceipt,
  ChatBlock,
  ChatReport,
  Visitor,
  InsertVisitor,
  PostLike
} from "@shared/schema";
import { db } from "./db";
import { 
  users, 
  posts, 
  postLikes,
  connectionRequests, 
  coinTopups, 
  coinPackages,
  bankAccounts,
  coinLedger, 
  settings, 
  notifications, 
  audits,
  conversations,
  conversationParticipants,
  messages,
  messageReceipts,
  chatBlocks,
  chatReports,
  visitors
} from "@shared/schema";
import { eq, and, desc, asc, sql, count, ne, or, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsersForAdmin(status?: string, limit?: number, offset?: number): Promise<{ users: User[], total: number }>;
  
  // Posts  
  getPost(id: number): Promise<Post | undefined>;
  getApprovedPosts(limit?: number, offset?: number, filters?: any): Promise<{ posts: Post[], total: number }>;
  getUserPosts(userId: number): Promise<Post[]>;
  createPost(post: InsertPost & { userId: number }): Promise<Post>;
  updatePost(id: number, post: Partial<Post>): Promise<Post | undefined>;
  getPostsForAdmin(status?: string, limit?: number, offset?: number): Promise<{ posts: Post[], total: number }>;
  
  // Post Likes
  likePost(postId: number, userId: number): Promise<void>;
  unlikePost(postId: number, userId: number): Promise<void>;
  hasUserLikedPost(postId: number, userId: number): Promise<boolean>;
  getPostLikes(postId: number): Promise<PostLike[]>;
  
  // Post Management
  pinPost(postId: number, days?: number): Promise<Post | undefined>;
  unpinPost(postId: number): Promise<Post | undefined>;
  searchPosts(query: string, filters?: any, limit?: number, offset?: number): Promise<{ posts: Post[], total: number }>;
  
  // Connection Requests
  getConnectionRequest(id: number): Promise<ConnectionRequest | undefined>;
  createConnectionRequest(request: InsertConnectionRequest & { requesterId: number }): Promise<ConnectionRequest>;
  updateConnectionRequest(id: number, request: Partial<ConnectionRequest>): Promise<ConnectionRequest | undefined>;
  getUserConnectionRequests(userId: number, type: 'sent' | 'received'): Promise<ConnectionRequest[]>;
  getConnectionRequestsForAdmin(status?: string, limit?: number, offset?: number): Promise<{ requests: ConnectionRequest[], total: number }>;
  
  // Coin System
  createCoinTopup(topup: InsertCoinTopup & { userId: number }): Promise<CoinTopup>;
  updateCoinTopup(id: number, topup: Partial<CoinTopup>): Promise<CoinTopup | undefined>;
  getCoinTopupsForUser(userId: number): Promise<CoinTopup[]>;
  getCoinTopupsForAdmin(status?: string, limit?: number, offset?: number): Promise<{ topups: CoinTopup[], total: number }>;
  addCoinLedgerEntry(entry: Omit<CoinLedgerEntry, 'id' | 'createdAt'>): Promise<void>;
  getCoinLedger(userId: number, limit?: number): Promise<CoinLedgerEntry[]>;
  updateUserCoins(userId: number, delta: number): Promise<void>;
  
  // Coin Packages
  getCoinPackages(activeOnly?: boolean): Promise<CoinPackage[]>;
  createCoinPackage(pkg: InsertCoinPackage): Promise<CoinPackage>;
  updateCoinPackage(id: number, pkg: Partial<CoinPackage>): Promise<CoinPackage | undefined>;
  deleteCoinPackage(id: number): Promise<void>;

  // Bank Accounts
  getBankAccounts(activeOnly?: boolean): Promise<BankAccount[]>;
  createBankAccount(account: InsertBankAccount): Promise<BankAccount>;
  updateBankAccount(id: number, account: Partial<BankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: number): Promise<void>;
  setPrimaryBankAccount(id: number): Promise<void>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<Settings>): Promise<Settings>;
  
  // Notifications
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  markNotificationSeen(id: number): Promise<void>;
  
  // Audit
  createAudit(audit: Omit<Audit, 'id' | 'createdAt'>): Promise<Audit>;
  getAudits(limit?: number, offset?: number): Promise<{ audits: Audit[], total: number }>;

  // Chat methods
  createConversation(data: any): Promise<any>;
  getConversation(id: number): Promise<any>;
  getConversationByParticipants(userId1: number, userId2: number): Promise<any>;
  getUserConversations(userId: number): Promise<any[]>;
  addConversationParticipant(data: any): Promise<any>;
  isConversationParticipant(conversationId: number, userId: number): Promise<boolean>;
  
  createMessage(data: any): Promise<any>;
  getMessages(conversationId: number, beforeId?: number, limit?: number): Promise<any[]>;
  getMessageById(id: number): Promise<any>;
  updateMessageReadStatus(conversationId: number, userId: number, messageId: number): Promise<void>;
  
  createMessageReceipt(data: any): Promise<any>;
  createChatBlock(data: any): Promise<any>;
  removeChatBlock(blockerId: number, blockedId: number): Promise<void>;
  isChatBlocked(userId1: number, userId2: number): Promise<boolean>;
  
  createChatReport(data: any): Promise<any>;
  getChatReports(status?: string, limit?: number, offset?: number): Promise<{ reports: any[]; total: number }>;
  updateChatReportStatus(id: number, status: string): Promise<any>;
  
  // Admin chat methods
  getAllConversations(limit?: number, offset?: number): Promise<{ conversations: any[]; total: number }>;
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<any[]>;
  
  // Visitor tracking
  createVisitor(visitor: InsertVisitor): Promise<Visitor>;
  getVisitorStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    if (!phone) return undefined;
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([insertUser])
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUsersForAdmin(status?: string, limit = 50, offset = 0): Promise<{ users: User[], total: number }> {
    const conditions = status ? eq(users.status, status as any) : undefined;
    
    const usersList = await db
      .select()
      .from(users)
      .where(conditions)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(conditions);

    return {
      users: usersList,
      total: totalResult?.count || 0
    };
  }

  // Posts
  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async getApprovedPosts(limit = 20, offset = 0, filters?: any): Promise<{ posts: Post[], total: number }> {
    const conditions = and(eq(posts.status, 'APPROVED'), isNull(posts.deletedAt));
    
    const postsList = await db
      .select()
      .from(posts)
      .where(conditions)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(conditions);

    return {
      posts: postsList,
      total: totalResult?.count || 0
    };
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return await db
      .select()
      .from(posts)
      .where(and(eq(posts.userId, userId), isNull(posts.deletedAt)))
      .orderBy(desc(posts.createdAt));
  }

  async createPost(postData: InsertPost & { userId: number }): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(postData)
      .returning();
    return post;
  }

  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set(postData)
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async getPostsForAdmin(status?: string, limit = 50, offset = 0): Promise<{ posts: any[], total: number }> {
    const conditions = status ? eq(posts.status, status as any) : undefined;
    
    const postsList = await db
      .select({
        id: posts.id,
        title: posts.title,
        description: posts.description,
        images: posts.images,
        preferences: posts.preferences,
        status: posts.status,
        createdAt: posts.createdAt,
        userId: posts.userId,
        user: {
          id: users.id,
          fullName: users.fullName,
          username: users.username
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(conditions)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(posts)
      .where(conditions);

    return {
      posts: postsList,
      total: totalResult?.count || 0
    };
  }

  // Connection Requests
  async getConnectionRequest(id: number): Promise<ConnectionRequest | undefined> {
    const [request] = await db.select().from(connectionRequests).where(eq(connectionRequests.id, id));
    return request || undefined;
  }

  async createConnectionRequest(requestData: InsertConnectionRequest & { requesterId: number }): Promise<ConnectionRequest> {
    const [request] = await db
      .insert(connectionRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async updateConnectionRequest(id: number, requestData: Partial<ConnectionRequest>): Promise<ConnectionRequest | undefined> {
    const [request] = await db
      .update(connectionRequests)
      .set(requestData)
      .where(eq(connectionRequests.id, id))
      .returning();
    return request || undefined;
  }

  async getUserConnectionRequests(userId: number, type: 'sent' | 'received'): Promise<ConnectionRequest[]> {
    const condition = type === 'sent' 
      ? eq(connectionRequests.requesterId, userId)
      : eq(connectionRequests.targetUserId, userId);
    
    return await db
      .select()
      .from(connectionRequests)
      .where(condition)
      .orderBy(desc(connectionRequests.createdAt));
  }

  async getConnectionRequestsForAdmin(status?: string, limit = 50, offset = 0): Promise<{ requests: ConnectionRequest[], total: number }> {
    const conditions = status ? eq(connectionRequests.status, status as any) : undefined;
    
    const requestsList = await db
      .select()
      .from(connectionRequests)
      .where(conditions)
      .orderBy(desc(connectionRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(connectionRequests)
      .where(conditions);

    return {
      requests: requestsList,
      total: totalResult?.count || 0
    };
  }

  // Coin System
  async createCoinTopup(topupData: InsertCoinTopup & { userId: number }): Promise<CoinTopup> {
    const [topup] = await db
      .insert(coinTopups)
      .values([topupData])
      .returning();
    return topup;
  }

  async updateCoinTopup(id: number, topupData: Partial<CoinTopup>): Promise<CoinTopup | undefined> {
    const [topup] = await db
      .update(coinTopups)
      .set(topupData)
      .where(eq(coinTopups.id, id))
      .returning();
    return topup || undefined;
  }

  async getCoinTopupsForUser(userId: number): Promise<CoinTopup[]> {
    return await db
      .select()
      .from(coinTopups)
      .where(eq(coinTopups.userId, userId))
      .orderBy(desc(coinTopups.createdAt));
  }

  async getCoinTopupsForAdmin(status?: string, limit = 50, offset = 0): Promise<{ topups: CoinTopup[], total: number }> {
    const conditions = status ? eq(coinTopups.status, status as any) : undefined;
    
    const topupsList = await db
      .select()
      .from(coinTopups)
      .where(conditions)
      .orderBy(desc(coinTopups.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(coinTopups)
      .where(conditions);

    return {
      topups: topupsList,
      total: totalResult?.count || 0
    };
  }

  async addCoinLedgerEntry(entryData: Omit<CoinLedgerEntry, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(coinLedger).values(entryData);
  }

  async getCoinLedger(userId: number, limit = 100): Promise<CoinLedgerEntry[]> {
    return await db
      .select()
      .from(coinLedger)
      .where(eq(coinLedger.userId, userId))
      .orderBy(desc(coinLedger.createdAt))
      .limit(limit);
  }

  async updateUserCoins(userId: number, delta: number): Promise<void> {
    await db
      .update(users)
      .set({ coins: sql`${users.coins} + ${delta}` })
      .where(eq(users.id, userId));
  }

  // Coin Packages
  async getCoinPackages(activeOnly = false): Promise<CoinPackage[]> {
    const conditions = activeOnly ? eq(coinPackages.isActive, true) : undefined;
    return await db
      .select()
      .from(coinPackages)
      .where(conditions)
      .orderBy(asc(coinPackages.coins));
  }

  async createCoinPackage(packageData: InsertCoinPackage): Promise<CoinPackage> {
    const [pkg] = await db
      .insert(coinPackages)
      .values(packageData)
      .returning();
    return pkg;
  }

  async updateCoinPackage(id: number, packageData: Partial<CoinPackage>): Promise<CoinPackage | undefined> {
    const [pkg] = await db
      .update(coinPackages)
      .set(packageData)
      .where(eq(coinPackages.id, id))
      .returning();
    return pkg || undefined;
  }

  async deleteCoinPackage(id: number): Promise<void> {
    await db
      .delete(coinPackages)
      .where(eq(coinPackages.id, id));
  }

  // Bank Account methods
  async getBankAccounts(activeOnly = false): Promise<BankAccount[]> {
    const conditions = activeOnly ? eq(bankAccounts.isActive, true) : undefined;
    return await db
      .select()
      .from(bankAccounts)
      .where(conditions)
      .orderBy(desc(bankAccounts.isPrimary), asc(bankAccounts.bankName));
  }

  async createBankAccount(account: InsertBankAccount): Promise<BankAccount> {
    const [newAccount] = await db
      .insert(bankAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateBankAccount(id: number, account: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const [updated] = await db
      .update(bankAccounts)
      .set({ ...account, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(bankAccounts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBankAccount(id: number): Promise<void> {
    await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
  }

  async setPrimaryBankAccount(id: number): Promise<void> {
    // First, set all accounts to non-primary
    await db
      .update(bankAccounts)
      .set({ isPrimary: false, updatedAt: sql`CURRENT_TIMESTAMP` });
    
    // Then set the specified account as primary
    await db
      .update(bankAccounts)
      .set({ isPrimary: true, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(bankAccounts.id, id));
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const [setting] = await db.select().from(settings).where(eq(settings.id, 1));
    if (!setting) {
      // Create default settings if none exist
      const [newSetting] = await db
        .insert(settings)
        .values({
          id: 1,
          coinPriceMvr: "10.00",
          costPost: 2,
          costConnect: 5,
          bankAccountName: process.env.BANK_ACCOUNT_NAME || "Kaiveni Pvt Ltd",
          bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || "7701234567890",
          bankBranch: process.env.BANK_BRANCH || "Malé Main Branch",
          bankName: process.env.BANK_NAME || "Bank of Maldives",
          allowRefunds: true,
          requireTargetAccept: true,
          maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || "5"),
          allowedMimes: JSON.parse(process.env.ALLOWED_MIMES || '["image/jpeg", "image/png", "image/webp"]'),
          branding: {}
        })
        .returning();
      return newSetting;
    }
    return setting;
  }

  async updateSettings(settingsData: Partial<Settings>): Promise<Settings> {
    const [setting] = await db
      .update(settings)
      .set(settingsData)
      .where(eq(settings.id, 1))
      .returning();
    return setting;
  }

  // Notifications
  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: number, limit = 50): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationSeen(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ seen: true })
      .where(eq(notifications.id, id));
  }

  // Audit
  async createAudit(auditData: Omit<Audit, 'id' | 'createdAt'>): Promise<Audit> {
    const [audit] = await db
      .insert(audits)
      .values(auditData)
      .returning();
    return audit;
  }

  async getAudits(limit = 100, offset = 0): Promise<{ audits: Audit[], total: number }> {
    const auditsList = await db
      .select()
      .from(audits)
      .orderBy(desc(audits.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(audits);

    return {
      audits: auditsList,
      total: totalResult?.count || 0
    };
  }

  // Chat methods
  async createConversation(data: any): Promise<any> {
    const [conversation] = await db
      .insert(conversations)
      .values(data)
      .returning();
    return conversation;
  }

  async getConversation(id: number): Promise<any> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getConversationByParticipants(userId1: number, userId2: number): Promise<any> {
    // Find conversations where both users are participants
    const conversationsWithUser1 = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId1));

    const conversationsWithUser2 = await db
      .select({ conversationId: conversationParticipants.conversationId })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, userId2));

    // Find common conversations
    const user1ConvIds = conversationsWithUser1.map(c => c.conversationId);
    const user2ConvIds = conversationsWithUser2.map(c => c.conversationId);
    const commonConvIds = user1ConvIds.filter(id => user2ConvIds.includes(id));

    if (commonConvIds.length === 0) {
      return undefined;
    }

    // Return the first common conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, commonConvIds[0]));

    return conversation || undefined;
  }

  async getUserConversations(userId: number): Promise<any[]> {
    const result = await db
      .select({
        conversation: conversations,
        participant: conversationParticipants,
        otherUser: users,
        lastMessage: messages
      })
      .from(conversationParticipants)
      .innerJoin(conversations, eq(conversationParticipants.conversationId, conversations.id))
      .innerJoin(users, and(
        eq(users.id, conversationParticipants.userId),
        ne(users.id, userId)
      ))
      .leftJoin(messages, eq(messages.conversationId, conversations.id))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(conversations.updatedAt));

    return result;
  }

  async addConversationParticipant(data: any): Promise<any> {
    const [participant] = await db
      .insert(conversationParticipants)
      .values(data)
      .returning();
    return participant;
  }

  async isConversationParticipant(conversationId: number, userId: number): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
    return !!participant;
  }

  async createMessage(data: any): Promise<any> {
    const [message] = await db
      .insert(messages)
      .values(data)
      .returning();
    return message;
  }

  async getMessages(conversationId: number, beforeId?: number, limit = 50): Promise<any[]> {
    const conditions = beforeId 
      ? and(
          eq(messages.conversationId, conversationId),
          sql`${messages.id} < ${beforeId}`
        )
      : eq(messages.conversationId, conversationId);

    const result = await db
      .select({
        message: messages,
        sender: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(conditions)
      .orderBy(desc(messages.sentAt))
      .limit(limit);

    return result;
  }

  async getMessageById(id: number): Promise<any> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id));
    return message || undefined;
  }

  async updateMessageReadStatus(conversationId: number, userId: number, messageId: number): Promise<void> {
    await db
      .update(conversationParticipants)
      .set({ lastReadMessageId: messageId })
      .where(
        and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.userId, userId)
        )
      );
  }

  async createMessageReceipt(data: any): Promise<any> {
    const [receipt] = await db
      .insert(messageReceipts)
      .values(data)
      .returning();
    return receipt;
  }

  async createChatBlock(data: any): Promise<any> {
    const [block] = await db
      .insert(chatBlocks)
      .values(data)
      .returning();
    return block;
  }

  async removeChatBlock(blockerId: number, blockedId: number): Promise<void> {
    await db
      .delete(chatBlocks)
      .where(
        and(
          eq(chatBlocks.blockerId, blockerId),
          eq(chatBlocks.blockedId, blockedId)
        )
      );
  }

  async isChatBlocked(userId1: number, userId2: number): Promise<boolean> {
    const [block] = await db
      .select()
      .from(chatBlocks)
      .where(
        or(
          and(
            eq(chatBlocks.blockerId, userId1),
            eq(chatBlocks.blockedId, userId2)
          ),
          and(
            eq(chatBlocks.blockerId, userId2),
            eq(chatBlocks.blockedId, userId1)
          )
        )
      );
    return !!block;
  }

  async createChatReport(data: any): Promise<any> {
    const [report] = await db
      .insert(chatReports)
      .values(data)
      .returning();
    return report;
  }

  async getChatReports(status?: string, limit = 50, offset = 0): Promise<{ reports: any[]; total: number }> {
    const conditions = status ? eq(chatReports.status, status as any) : undefined;

    const reportsList = await db
      .select({
        report: chatReports,
        reporter: users,
        targetUser: users,
        message: messages
      })
      .from(chatReports)
      .leftJoin(users, eq(chatReports.reporterId, users.id))
      .leftJoin(users, eq(chatReports.targetUserId, users.id))
      .leftJoin(messages, eq(chatReports.messageId, messages.id))
      .where(conditions)
      .orderBy(desc(chatReports.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(chatReports)
      .where(conditions);

    return {
      reports: reportsList,
      total: totalResult?.count || 0
    };
  }

  async updateChatReportStatus(id: number, status: string): Promise<any> {
    const [report] = await db
      .update(chatReports)
      .set({ status: status as any })
      .where(eq(chatReports.id, id))
      .returning();
    return report;
  }

  async getAllConversations(limit = 50, offset = 0): Promise<{ conversations: any[]; total: number }> {
    // Get all conversations with participant count
    const conversationsList = await db
      .select({
        id: conversations.id,
        status: conversations.status,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(limit)
      .offset(offset);

    // For each conversation, get the participants
    const conversationsWithParticipants = await Promise.all(
      conversationsList.map(async (conv) => {
        const participants = await db
          .select({
            userId: conversationParticipants.userId,
            fullName: users.fullName,
            username: users.username
          })
          .from(conversationParticipants)
          .innerJoin(users, eq(conversationParticipants.userId, users.id))
          .where(eq(conversationParticipants.conversationId, conv.id));

        return {
          conversation: conv,
          user1: participants[0] || null,
          user2: participants[1] || null,
          participants: participants
        };
      })
    );

    const [totalResult] = await db
      .select({ count: count() })
      .from(conversations);

    return {
      conversations: conversationsWithParticipants,
      total: totalResult?.count || 0
    };
  }

  async getConversationMessages(conversationId: number, limit = 100, offset = 0): Promise<any[]> {
    const result = await db
      .select({
        message: messages,
        sender: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.sentAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  // Visitor tracking methods
  async createVisitor(visitorData: InsertVisitor): Promise<Visitor> {
    const [visitor] = await db
      .insert(visitors)
      .values(visitorData)
      .returning();
    return visitor;
  }

  async getVisitorStats(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  }> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get unique visitors (by IP) for each period
    const [todayResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${visitors.ipAddress})` })
      .from(visitors)
      .where(sql`${visitors.visitedAt} >= ${startOfToday}`);

    const [weekResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${visitors.ipAddress})` })
      .from(visitors)
      .where(sql`${visitors.visitedAt} >= ${startOfWeek}`);

    const [monthResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${visitors.ipAddress})` })
      .from(visitors)
      .where(sql`${visitors.visitedAt} >= ${startOfMonth}`);

    const [yearResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${visitors.ipAddress})` })
      .from(visitors)
      .where(sql`${visitors.visitedAt} >= ${startOfYear}`);

    return {
      today: Number(todayResult?.count || 0),
      thisWeek: Number(weekResult?.count || 0),
      thisMonth: Number(monthResult?.count || 0),
      thisYear: Number(yearResult?.count || 0)
    };
  }

  // Post Like Methods
  async likePost(postId: number, userId: number): Promise<void> {
    try {
      await db.insert(postLikes).values({ postId, userId });
      // Update the likes count on the post
      await db
        .update(posts)
        .set({ likes: sql`${posts.likes} + 1` })
        .where(eq(posts.id, postId));
    } catch (error) {
      // Ignore duplicate key errors (user already liked)
      if (!error.message?.includes('duplicate')) {
        throw error;
      }
    }
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    const result = await db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .returning();
    
    if (result.length > 0) {
      // Update the likes count on the post
      await db
        .update(posts)
        .set({ likes: sql`${posts.likes} - 1` })
        .where(eq(posts.id, postId));
    }
  }

  async hasUserLikedPost(postId: number, userId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
    return !!like;
  }

  async getPostLikes(postId: number): Promise<PostLike[]> {
    return await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.postId, postId))
      .orderBy(desc(postLikes.createdAt));
  }

  // Post Management Methods
  async pinPost(postId: number, days: number = 7): Promise<Post | undefined> {
    const pinnedUntil = new Date();
    pinnedUntil.setDate(pinnedUntil.getDate() + days);
    
    const [post] = await db
      .update(posts)
      .set({ 
        isPinned: true, 
        pinnedAt: new Date(), 
        pinnedUntil 
      })
      .where(eq(posts.id, postId))
      .returning();
    return post || undefined;
  }

  async unpinPost(postId: number): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set({ 
        isPinned: false, 
        pinnedAt: null, 
        pinnedUntil: null 
      })
      .where(eq(posts.id, postId))
      .returning();
    return post || undefined;
  }

  async searchPosts(query: string, filters?: any, limit = 20, offset = 0): Promise<{ posts: Post[], total: number }> {
    let conditions = [eq(posts.status, 'APPROVED'), isNull(posts.deletedAt)];

    // Add search conditions
    if (query) {
      conditions.push(
        or(
          sql`${posts.title} ILIKE ${`%${query}%`}`,
          sql`${posts.description} ILIKE ${`%${query}%`}`,
          sql`${posts.aboutYourself} ILIKE ${`%${query}%`}`,
          sql`${posts.lookingFor} ILIKE ${`%${query}%`}`
        )
      );
    }

    // Add filters
    if (filters?.relationshipType) {
      conditions.push(eq(posts.relationshipType, filters.relationshipType));
    }

    // User filters (join with users table)
    let userConditions = [];
    if (filters?.atoll) {
      userConditions.push(eq(users.atoll, filters.atoll));
    }
    if (filters?.island) {
      userConditions.push(eq(users.island, filters.island));
    }
    if (filters?.gender) {
      userConditions.push(eq(users.gender, filters.gender));
    }
    if (filters?.ageMin || filters?.ageMax) {
      const now = new Date();
      if (filters.ageMin) {
        const maxBirth = new Date(now.getFullYear() - filters.ageMin, now.getMonth(), now.getDate());
        userConditions.push(sql`${users.dateOfBirth} <= ${maxBirth}`);
      }
      if (filters.ageMax) {
        const minBirth = new Date(now.getFullYear() - filters.ageMax - 1, now.getMonth(), now.getDate());
        userConditions.push(sql`${users.dateOfBirth} >= ${minBirth}`);
      }
    }

    const finalConditions = and(...conditions);
    const userFilter = userConditions.length > 0 ? and(...userConditions) : undefined;

    const postsList = await db
      .select()
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(userFilter ? and(finalConditions, userFilter) : finalConditions)
      .orderBy(desc(posts.isPinned), desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: count() })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(userFilter ? and(finalConditions, userFilter) : finalConditions);

    return {
      posts: postsList.map(row => row.posts),
      total: totalResult?.count || 0
    };
  }
}

export const storage = new DatabaseStorage();
