import { 
  User, 
  InsertUser, 
  Post, 
  InsertPost, 
  ConnectionRequest, 
  InsertConnectionRequest,
  CoinTopup,
  InsertCoinTopup,
  CoinLedgerEntry,
  Settings,
  Notification,
  Audit
} from "@shared/schema";
import { db } from "./db";
import { 
  users, 
  posts, 
  connectionRequests, 
  coinTopups, 
  coinLedger, 
  settings, 
  notifications, 
  audits 
} from "@shared/schema";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
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
    const conditions = eq(posts.status, 'APPROVED');
    
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
      .where(eq(posts.userId, userId))
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

  async getPostsForAdmin(status?: string, limit = 50, offset = 0): Promise<{ posts: Post[], total: number }> {
    const conditions = status ? eq(posts.status, status as any) : undefined;
    
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
      .values(topupData)
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
}

export const storage = new DatabaseStorage();
