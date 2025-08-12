import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import multer from "multer";
import { z } from "zod";
import { insertUserSchema, insertPostSchema, insertCoinTopupSchema, insertConnectionRequestSchema } from "@shared/schema";

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
        userId: req.user!.id
      });

      // Deduct coins
      await storage.updateUserCoins(req.user!.id, -settings.costPost);
      await storage.addCoinLedgerEntry({
        userId: req.user!.id,
        delta: -settings.costPost,
        reason: 'POST',
        refTable: 'posts',
        refId: post.id,
        description: 'Created new post'
      });

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
        requesterId: req.user!.id
      });

      // Deduct coins
      await storage.updateUserCoins(req.user!.id, -settings.costConnect);
      await storage.addCoinLedgerEntry({
        userId: req.user!.id,
        delta: -settings.costConnect,
        reason: 'CONNECT',
        refTable: 'connection_requests',
        refId: request.id,
        description: 'Sent connection request'
      });

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
        amountMvr: amountMvr.toString(),
        pricePerCoin: settings.coinPriceMvr,
        slipPath: slipPath
      });

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
      
      const result = await storage.getUsersForAdmin(status, limit, offset);
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
        data: { note }
      });

      // Create audit log
      await storage.createAudit({
        adminId: req.user!.id,
        action: 'USER_APPROVED',
        entity: 'users',
        entityId: id,
        meta: { note },
        ip: req.ip
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
        data: { note }
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'USER_REJECTED',
        entity: 'users',
        entityId: id,
        meta: { note },
        ip: req.ip
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
      
      const result = await storage.getPostsForAdmin(status, limit, offset);
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
      
      const result = await storage.getCoinTopupsForAdmin(status, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching topups for admin:", error);
      res.status(500).json({ message: "Failed to fetch coin topups" });
    }
  });

  app.post("/api/admin/topups/:id/approve", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { note } = req.body;
      
      const topup = await storage.getConnectionRequest(id);
      if (!topup) {
        return res.status(404).json({ message: "Topup not found" });
      }

      const settings = await storage.getSettings();
      const computedCoins = Math.floor(parseFloat(topup.amountMvr) / parseFloat(settings.coinPriceMvr));
      
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
        data: { coins: computedCoins, note }
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'TOPUP_APPROVED',
        entity: 'coin_topups',
        entityId: id,
        meta: { coins: computedCoins, note },
        ip: req.ip
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

  const httpServer = createServer(app);
  return httpServer;
}
