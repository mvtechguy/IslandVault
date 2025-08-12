import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { telegramService } from "./telegram";
import multer from "multer";
import { z } from "zod";
import { insertUserSchema, insertPostSchema, insertCoinTopupSchema, insertConnectionRequestSchema } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Error handler for multer
  app.use((error: any, req: any, res: any, next: any) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
      }
    }
    if (error.message === 'Invalid file type') {
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.' });
    }
    next(error);
  });

  // Object storage endpoints
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req, res) => {
    const userId = req.user?.id?.toString();
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Atolls endpoint
  app.get("/api/atolls", (req, res) => {
    const { getMaldivesData } = require("../client/src/data/maldives-data");
    res.json(getMaldivesData());
  });

  // User profile endpoints
  app.get("/api/me", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  app.patch("/api/me", isAuthenticated, async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        status: 'PENDING' as const // Reset status to pending on profile update
      };
      delete updateData.id;
      delete updateData.password;
      delete updateData.coins;
      delete updateData.role;

      const user = await storage.updateUser(req.user!.id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Posts endpoints
  app.get("/api/posts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const filters = req.query;

      const result = await storage.getApprovedPosts(limit, offset, filters);
      
      // Get user details for each post
      const postsWithUsers = await Promise.all(
        result.posts.map(async (post) => {
          const user = await storage.getUser(post.userId);
          return {
            ...post,
            user: user ? { 
              id: user.id,
              fullName: user.fullName,
              island: user.island,
              atoll: user.atoll,
              profilePhotoPath: user.profilePhotoPath,
              shortBio: user.shortBio,
              dateOfBirth: user.dateOfBirth
            } : null
          };
        })
      );

      res.json({
        posts: postsWithUsers,
        total: result.total,
        hasMore: result.total > offset + result.posts.length
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user || user.status !== 'APPROVED') {
        return res.status(403).json({ message: "Your profile must be approved to create posts" });
      }

      const settings = await storage.getSettings();
      if (user.coins < settings.costPost) {
        return res.status(400).json({ message: `Insufficient coins. You need ${settings.costPost} coins to create a post.` });
      }

      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost({
        ...postData,
        userId: req.user.id
      });

      // Deduct coins
      await storage.updateUserCoins(req.user.id, -settings.costPost);
      await storage.addCoinLedgerEntry({
        userId: req.user.id,
        delta: -settings.costPost,
        reason: 'POST',
        refTable: 'posts',
        refId: post.id,
        description: 'Created new post'
      });

      // Send Telegram notification to admin about new post
      await telegramService.notifyAdminNewPost(
        user.username, 
        post.title || 'Untitled', 
        post.description
      );

      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts/my", isAuthenticated, async (req, res) => {
    try {
      const posts = await storage.getUserPosts(req.user!.id);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch your posts" });
    }
  });

  // Connection requests
  app.post("/api/connect", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user || user.status !== 'APPROVED') {
        return res.status(403).json({ message: "Your profile must be approved to connect" });
      }

      const settings = await storage.getSettings();
      if (user.coins < settings.costConnect) {
        return res.status(400).json({ message: `Insufficient coins. You need ${settings.costConnect} coins to send a connection request.` });
      }

      const requestData = insertConnectionRequestSchema.parse(req.body);
      
      // Check if request already exists
      const existingRequests = await storage.getUserConnectionRequests(req.user!.id, 'sent');
      const existingRequest = existingRequests.find(r => 
        r.targetUserId === requestData.targetUserId && 
        ['PENDING', 'APPROVED'].includes(r.status)
      );
      
      if (existingRequest) {
        return res.status(400).json({ message: "Connection request already exists" });
      }

      const request = await storage.createConnectionRequest({
        ...requestData,
        requesterId: req.user.id
      });

      // Deduct coins
      await storage.updateUserCoins(req.user.id, -settings.costConnect);
      await storage.addCoinLedgerEntry({
        userId: req.user.id,
        delta: -settings.costConnect,
        reason: 'CONNECT',
        refTable: 'connection_requests',
        refId: request.id,
        description: 'Sent connection request'
      });

      // Get target user and post details for notifications
      const targetUser = await storage.getUser(requestData.targetUserId);
      const post = requestData.postId ? await storage.getPost(requestData.postId) : null;

      // Send Telegram notification to target user
      if (targetUser) {
        await telegramService.notifyConnectionRequest(targetUser.id, user.fullName);
      }

      // Send admin notification
      await telegramService.notifyAdminConnectionRequest(
        user.fullName,
        targetUser?.fullName || 'Unknown User',
        post?.title
      );

      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error("Error creating connection request:", error);
      res.status(500).json({ message: "Failed to send connection request" });
    }
  });

  app.get("/api/connect/:type", isAuthenticated, async (req, res) => {
    try {
      const type = req.params.type as 'sent' | 'received';
      if (!['sent', 'received'].includes(type)) {
        return res.status(400).json({ message: "Invalid type. Must be 'sent' or 'received'" });
      }

      const requests = await storage.getUserConnectionRequests(req.user!.id, type);
      
      // Get user details for each request
      const requestsWithUsers = await Promise.all(
        requests.map(async (request) => {
          const otherUserId = type === 'sent' ? request.targetUserId : request.requesterId;
          const user = await storage.getUser(otherUserId);
          return {
            ...request,
            user: user ? {
              id: user.id,
              fullName: user.fullName,
              island: user.island,
              atoll: user.atoll,
              profilePhotoPath: user.profilePhotoPath
            } : null
          };
        })
      );

      res.json(requestsWithUsers);
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      res.status(500).json({ message: "Failed to fetch connection requests" });
    }
  });

  // Coin system
  app.post("/api/coins/topups", isAuthenticated, upload.single('slip'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Bank slip file is required" });
      }

      const { amountMvr } = insertCoinTopupSchema.parse(req.body);
      const settings = await storage.getSettings();

      // Upload slip to object storage
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // For now, we'll store the file info and let the admin approve
      // In a real implementation, you'd upload to the object storage here
      const slipPath = `/objects/slips/${Date.now()}_${req.file.originalname}`;

      const topup = await storage.createCoinTopup({
        userId: req.user!.id,
        amountMvr: amountMvr,
        pricePerCoin: settings.coinPriceMvr || "10.00",
        slipPath: slipPath
      });

      // Get user details for notification
      const user = await storage.getUser(req.user.id);
      const computedCoins = Math.floor(parseFloat(amountMvr.toString()) / parseFloat(settings.coinPriceMvr.toString()));

      // Send Telegram notification to admin about new coin request
      if (user) {
        await telegramService.notifyAdminCoinRequest(
          user.username,
          amountMvr.toString(),
          computedCoins
        );
      }

      res.status(201).json(topup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid topup data", errors: error.errors });
      }
      console.error("Error creating coin topup:", error);
      res.status(500).json({ message: "Failed to create coin topup request" });
    }
  });

  app.get("/api/coins/topups", isAuthenticated, async (req, res) => {
    try {
      const topups = await storage.getCoinTopupsForUser(req.user!.id);
      res.json(topups);
    } catch (error) {
      console.error("Error fetching coin topups:", error);
      res.status(500).json({ message: "Failed to fetch coin topups" });
    }
  });

  app.get("/api/coins/balance", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      res.json({ coins: user?.coins || 0 });
    } catch (error) {
      console.error("Error fetching coin balance:", error);
      res.status(500).json({ message: "Failed to fetch coin balance" });
    }
  });

  app.get("/api/coins/ledger", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const ledger = await storage.getCoinLedger(req.user!.id, limit);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching coin ledger:", error);
      res.status(500).json({ message: "Failed to fetch coin ledger" });
    }
  });

  // Notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await storage.getUserNotifications(req.user!.id, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/seen", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationSeen(id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking notification as seen:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/queues/users", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getUsersForAdmin(status === "ALL" ? undefined : status, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users/:id/approve", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { note } = req.body;
      
      const user = await storage.updateUser(id, { status: 'APPROVED' });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create notification
      await storage.createNotification({
        userId: id,
        type: 'PROFILE_APPROVED',
        data: { note },
        seen: false
      });

      // Send Telegram notification to user
      await telegramService.notifyUserRegistrationApproved(id);

      // Create audit log
      await storage.createAudit({
        adminId: req.user.id,
        action: 'USER_APPROVED',
        entity: 'users',
        entityId: id,
        meta: { note },
        ip: req.ip || null
      });

      res.json(user);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  app.post("/api/admin/users/:id/reject", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { note } = req.body;
      
      const user = await storage.updateUser(id, { status: 'REJECTED' });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createNotification({
        userId: id,
        type: 'PROFILE_REJECTED',
        data: { note },
        seen: false
      });

      // Send Telegram notification to user
      await telegramService.notifyUserRegistrationRejected(id, note);

      await storage.createAudit({
        adminId: req.user.id,
        action: 'USER_REJECTED',
        entity: 'users',
        entityId: id,
        meta: { note },
        ip: req.ip || null
      });

      res.json(user);
    } catch (error) {
      console.error("Error rejecting user:", error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // More admin endpoints for posts, topups, connections...
  app.get("/api/admin/queues/posts", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getPostsForAdmin(status === "ALL" ? undefined : status, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching posts for admin:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/admin/queues/topups", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getCoinTopupsForAdmin(status === "ALL" ? undefined : status, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching topups for admin:", error);
      res.status(500).json({ message: "Failed to fetch coin topups" });
    }
  });

  app.get("/api/admin/queues/connect", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getConnectionRequestsForAdmin(status === "ALL" ? undefined : status, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching connection requests for admin:", error);
      res.status(500).json({ message: "Failed to fetch connection requests" });
    }
  });

  app.post("/api/admin/topups/:id/approve", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { note } = req.body;
      
      // Get topup from the correct storage method
      const topups = await storage.getCoinTopupsForAdmin('PENDING', 1000, 0);
      const topup = topups.topups.find(t => t.id === id);
      if (!topup) {
        return res.status(404).json({ message: "Topup not found" });
      }

      const settings = await storage.getSettings();
      const computedCoins = Math.floor(parseFloat(topup.amountMvr.toString()) / parseFloat(settings.coinPriceMvr.toString()));
      
      const updatedTopup = await storage.updateCoinTopup(id, { 
        status: 'APPROVED',
        adminNote: note,
        computedCoins
      });

      // Credit user coins
      await storage.updateUserCoins(topup.userId, computedCoins);
      await storage.addCoinLedgerEntry({
        userId: topup.userId,
        delta: computedCoins,
        reason: 'TOPUP',
        refTable: 'coin_topups',
        refId: id,
        description: `Coin topup approved - MVR ${topup.amountMvr}`
      });

      await storage.createNotification({
        userId: topup.userId,
        type: 'TOPUP_APPROVED',
        data: { coins: computedCoins, note },
        seen: false
      });

      // Send Telegram notification to user
      await telegramService.notifyCoinsAdded(topup.userId, computedCoins);

      await storage.createAudit({
        adminId: req.user.id,
        action: 'TOPUP_APPROVED',
        entity: 'coin_topups',
        entityId: id,
        meta: { coins: computedCoins, note },
        ip: req.ip || null
      });

      res.json(updatedTopup);
    } catch (error) {
      console.error("Error approving topup:", error);
      res.status(500).json({ message: "Failed to approve topup" });
    }
  });

  // Settings endpoint
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      // Remove sensitive data from public settings
      const publicSettings = {
        coinPriceMvr: settings.coinPriceMvr,
        costPost: settings.costPost,
        costConnect: settings.costConnect,
        bankAccountName: settings.bankAccountName,
        bankAccountNumber: settings.bankAccountNumber,
        bankBranch: settings.bankBranch,
        bankName: settings.bankName,
        maxUploadMb: settings.maxUploadMb
      };
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Admin telegram settings endpoints
  app.get("/api/admin/telegram/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        telegramBotToken: settings.telegramBotToken ? '***' : null,
        telegramChatId: settings.telegramChatId
      });
    } catch (error) {
      console.error("Error fetching telegram settings:", error);
      res.status(500).json({ message: "Failed to fetch telegram settings" });
    }
  });

  app.put("/api/admin/telegram/settings", isAdmin, async (req, res) => {
    try {
      const { telegramBotToken, telegramChatId } = req.body;
      
      await storage.updateSettings({
        telegramBotToken,
        telegramChatId
      });

      // Reinitialize telegram service with new settings
      await telegramService.initialize();

      res.json({ message: "Telegram settings updated successfully" });
    } catch (error) {
      console.error("Error updating telegram settings:", error);
      res.status(500).json({ message: "Failed to update telegram settings" });
    }
  });

  app.post("/api/admin/telegram/test", isAdmin, async (req, res) => {
    try {
      await telegramService.sendTestMessage();
      res.json({ message: "Test message sent successfully" });
    } catch (error) {
      console.error("Error sending test message:", error);
      res.status(500).json({ message: "Failed to send test message" });
    }
  });

  // App branding endpoints
  app.get("/api/admin/branding", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const branding = settings.branding as any || {};
      res.json({
        appName: branding.appName || "Kaiveni",
        logoUrl: branding.logoUrl || null,
        primaryColor: branding.primaryColor || "#10b981",
        tagline: branding.tagline || "Find your perfect partner in paradise"
      });
    } catch (error) {
      console.error("Error fetching branding settings:", error);
      res.status(500).json({ message: "Failed to fetch branding settings" });
    }
  });

  app.put("/api/admin/branding", isAdmin, async (req, res) => {
    try {
      const { appName, logoUrl, primaryColor, tagline } = req.body;
      
      const settings = await storage.getSettings();
      const currentBranding = settings.branding || {};
      
      const updatedBranding = {
        ...currentBranding,
        appName: appName || "Kaiveni",
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || "#10b981",
        tagline: tagline || "Find your perfect partner in paradise"
      };

      await storage.updateSettings({
        branding: updatedBranding
      });

      res.json({ message: "Branding settings updated successfully", branding: updatedBranding });
    } catch (error) {
      console.error("Error updating branding settings:", error);
      res.status(500).json({ message: "Failed to update branding settings" });
    }
  });

  // Public branding endpoint for frontend
  app.get("/api/branding", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const branding = settings.branding as any || {};
      res.json({
        appName: branding.appName || "Kaiveni",
        logoUrl: branding.logoUrl || null,
        primaryColor: branding.primaryColor || "#10b981",
        tagline: branding.tagline || "Find your perfect partner in paradise"
      });
    } catch (error) {
      console.error("Error fetching public branding:", error);
      res.status(500).json({ message: "Failed to fetch branding" });
    }
  });

  // ================== COMPREHENSIVE POST MANAGEMENT ==================
  
  // Post CRUD operations for admin
  app.get("/api/admin/posts", isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await storage.getPostsForAdmin(undefined, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/admin/posts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.put("/api/admin/posts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description, preferences, status } = req.body;
      
      const updatedPost = await storage.updatePost(id, {
        title,
        description,
        preferences,
        status
      });
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'POST_UPDATED',
        entity: 'posts',
        entityId: id,
        meta: { title, status },
        ip: req.ip || null
      });

      res.json(updatedPost);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/admin/posts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.updatePost(id, { deletedAt: new Date() });

      await storage.createNotification({
        userId: post.userId,
        type: 'POST_DELETED',
        data: { title: post.title, reason },
        seen: false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'POST_DELETED',
        entity: 'posts',
        entityId: id,
        meta: { reason },
        ip: req.ip || null
      });

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post("/api/admin/posts/:id/approve", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { note } = req.body;
      
      const post = await storage.updatePost(id, { status: 'APPROVED' });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.createNotification({
        userId: post.userId,
        type: 'POST_APPROVED',
        data: { title: post.title, note },
        seen: false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'POST_APPROVED',
        entity: 'posts',
        entityId: id,
        meta: { note },
        ip: req.ip || null
      });

      res.json(post);
    } catch (error) {
      console.error("Error approving post:", error);
      res.status(500).json({ message: "Failed to approve post" });
    }
  });

  app.post("/api/admin/posts/:id/reject", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { note, message } = req.body;
      
      const post = await storage.updatePost(id, { status: 'REJECTED' });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.createNotification({
        userId: post.userId,
        type: 'POST_REJECTED',
        data: { 
          title: post.title, 
          note, 
          message: message || "Your post has been rejected. Please review the guidelines and try again.",
          adminFeedback: note
        },
        seen: false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'POST_REJECTED',
        entity: 'posts',
        entityId: id,
        meta: { note, message },
        ip: req.ip || null
      });

      res.json(post);
    } catch (error) {
      console.error("Error rejecting post:", error);
      res.status(500).json({ message: "Failed to reject post" });
    }
  });

  app.post("/api/admin/posts/:id/hide", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      const post = await storage.updatePost(id, { status: 'HIDDEN' });
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.createNotification({
        userId: post.userId,
        type: 'POST_HIDDEN',
        data: { title: post.title, reason },
        seen: false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'POST_HIDDEN',
        entity: 'posts',
        entityId: id,
        meta: { reason },
        ip: req.ip || null
      });

      res.json(post);
    } catch (error) {
      console.error("Error hiding post:", error);
      res.status(500).json({ message: "Failed to hide post" });
    }
  });

  // ================== COMPREHENSIVE USER MANAGEMENT ==================
  
  // User CRUD operations for admin
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await storage.getUsersForAdmin(undefined, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const userData = req.body;
      
      // Hash password
      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        dateOfBirth: new Date(userData.dateOfBirth),
        status: userData.status || 'PENDING',
        role: userData.role || 'USER',
        coins: userData.coins || 0
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'USER_CREATED',
        entity: 'users',
        entityId: newUser.id,
        meta: { username: newUser.username },
        ip: req.ip || null
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'USER_UPDATED',
        entity: 'users',
        entityId: id,
        meta: { username: updatedUser.username },
        ip: req.ip || null
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUser(id, { deletedAt: new Date() });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'USER_DELETED',
        entity: 'users',
        entityId: id,
        meta: { username: user.username, reason },
        ip: req.ip || null
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.post("/api/admin/users/:id/change-password", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createNotification({
        userId: id,
        type: 'PASSWORD_CHANGED',
        data: { message: "Your password has been changed by an administrator" },
        seen: false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'PASSWORD_CHANGED',
        entity: 'users',
        entityId: id,
        meta: { username: updatedUser.username },
        ip: req.ip || null
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/admin/users/:id/add-coins", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount must be positive" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.updateUserCoins(id, amount);
      await storage.addCoinLedgerEntry({
        userId: id,
        delta: amount,
        reason: 'OTHER',
        description: reason || `Admin added ${amount} coins`,
      });

      await storage.createNotification({
        userId: id,
        type: 'COINS_ADDED',
        data: { amount, reason },
        seen: false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'COINS_ADDED',
        entity: 'users',
        entityId: id,
        meta: { amount, reason },
        ip: req.ip || null
      });

      const updatedUser = await storage.getUser(id);
      res.json({ message: "Coins added successfully", user: updatedUser });
    } catch (error) {
      console.error("Error adding coins:", error);
      res.status(500).json({ message: "Failed to add coins" });
    }
  });

  app.post("/api/admin/users/:id/remove-coins", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Amount must be positive" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if ((user.coins || 0) < amount) {
        return res.status(400).json({ message: "User doesn't have enough coins" });
      }

      await storage.updateUserCoins(id, -amount);
      await storage.addCoinLedgerEntry({
        userId: id,
        delta: -amount,
        reason: 'OTHER',
        description: reason || `Admin removed ${amount} coins`,
      });

      await storage.createNotification({
        userId: id,
        type: 'COINS_REMOVED',
        data: { amount, reason },
        seen: false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'COINS_REMOVED',
        entity: 'users',
        entityId: id,
        meta: { amount, reason },
        ip: req.ip || null
      });

      const updatedUser = await storage.getUser(id);
      res.json({ message: "Coins removed successfully", user: updatedUser });
    } catch (error) {
      console.error("Error removing coins:", error);
      res.status(500).json({ message: "Failed to remove coins" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
