import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { storage } from "./storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { telegramService } from "./telegram";
import multer from "multer";
import { z } from "zod";
import { insertUserSchema, insertPostSchema, insertCoinTopupSchema, insertConnectionRequestSchema, insertMessageSchema, insertChatReportSchema, insertChatBlockSchema, insertVisitorSchema } from "@shared/schema";
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
  fileFilter: (req: any, file: any, cb: any) => {
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

  // Visitor tracking middleware
  app.use(async (req: any, res: any, next: any) => {
    try {
      // Skip tracking for admin/API endpoints and static files
      if (req.path.startsWith('/api') || req.path.startsWith('/admin') || req.path.includes('.')) {
        return next();
      }

      const visitorData = {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || null,
        referer: req.get('Referer') || null,
        path: req.path,
        userId: req.user?.id || null,
        sessionId: req.sessionID || null
      };

      // Track visitor asynchronously (don't block request)
      storage.createVisitor(visitorData).catch(err => {
        console.error('Failed to track visitor:', err);
      });
    } catch (error) {
      console.error('Visitor tracking error:', error);
    }
    next();
  });

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
      console.log("Object request path:", req.path);
      console.log("Object request params:", req.params);
      console.log("Full URL:", req.url);
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        console.log("Access denied for user:", userId, "to object:", req.path);
        return res.sendStatus(401);
      }
      console.log("Serving object file:", objectFile);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        console.log("Object not found:", req.path);
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

  // Image proxy endpoint for serving uploaded images
  app.get("/api/image-proxy/:filename", isAuthenticated, async (req, res) => {
    try {
      const filename = req.params.filename;
      
      // Since Google Cloud Storage private URLs aren't directly accessible,
      // we'll serve a data URL placeholder for development
      // In production, this would use signed URLs or proper cloud storage authentication
      
      // For now, return a simple SVG placeholder that shows the user's initials
      const user = await storage.getUser(req.user!.id);
      const initials = user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
      
      const svgPlaceholder = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#A8E6CF;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#88D8F4;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#grad1)" />
          <text x="50" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" 
                fill="white" text-anchor="middle">${initials}</text>
        </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(svgPlaceholder);
      
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ message: "Failed to serve image" });
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
      const { dateOfBirth, ...otherData } = req.body;
      const updateData = {
        ...otherData,
        status: 'PENDING' as const, // Reset status to pending on profile update
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }) // Convert string to Date if provided
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
      
      // Admin users bypass all approval and coin requirements
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
      
      if (!isAdmin && (!user || user.status !== 'APPROVED')) {
        return res.status(403).json({ message: "Your profile must be approved to create posts" });
      }

      // Check post limit (3 posts per user) - still applies to admins
      const userPosts = await storage.getUserPosts(req.user!.id);
      const activePosts = userPosts.filter(post => !post.deletedAt);
      if (!isAdmin && activePosts.length >= 3) {
        return res.status(400).json({ message: "You can only have 3 active posts at a time. Please delete an existing post to create a new one." });
      }

      const settings = await storage.getSettings();
      
      // Admin users don't pay coins for posts
      if (!isAdmin && (user.coins || 0) < (settings.costPost || 0)) {
        return res.status(400).json({ message: `Insufficient coins. You need ${settings.costPost || 0} coins to create a post.` });
      }

      const postData = insertPostSchema.parse(req.body);
      const post = await storage.createPost({
        ...postData,
        userId: req.user.id,
        // Admin posts are automatically approved
        status: isAdmin ? 'APPROVED' : 'PENDING'
      });

      // Deduct coins only for non-admin users
      if (!isAdmin) {
        await storage.updateUserCoins(req.user!.id, -(settings.costPost || 0));
        await storage.addCoinLedgerEntry({
          userId: req.user!.id,
          delta: -(settings.costPost || 0),
          reason: 'POST',
          refTable: 'posts',
          refId: post.id,
          description: 'Created new post'
        });
      }

      // Send Telegram notification to admin about new post (only for non-admin users)
      if (!isAdmin) {
        await telegramService.notifyAdminNewPost(
          user.username, 
          post.title || 'Untitled', 
          post.description
        );
      }

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

  // Update user's own post
  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only edit your own posts" });
      }

      const updateData = insertPostSchema.partial().parse(req.body);
      
      // Check if user is admin
      const user = await storage.getUser(req.user!.id);
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
      
      const updatedPost = await storage.updatePost(postId, {
        ...updateData,
        // Admin posts remain approved after editing, others go back to pending
        status: isAdmin ? 'APPROVED' : 'PENDING'
      });

      res.json(updatedPost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // Delete user's own post
  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.userId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }

      // Soft delete
      await storage.updatePost(postId, {
        deletedAt: new Date()
      });

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Connection requests
  app.post("/api/connect", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      // Admin users bypass approval and coin requirements
      const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
      
      if (!isAdmin && (!user || user.status !== 'APPROVED')) {
        return res.status(403).json({ message: "Your profile must be approved to connect" });
      }

      const settings = await storage.getSettings();
      
      // Admin users don't pay coins for connections
      if (!isAdmin && (user.coins || 0) < (settings.costConnect || 0)) {
        return res.status(400).json({ message: `Insufficient coins. You need ${settings.costConnect || 0} coins to send a connection request.` });
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
        requesterId: req.user.id,
        // Admin connection requests are automatically approved
        status: isAdmin ? 'APPROVED' : 'PENDING'
      });

      // Deduct coins only for non-admin users
      if (!isAdmin) {
        await storage.updateUserCoins(req.user!.id, -(settings.costConnect || 0));
        await storage.addCoinLedgerEntry({
          userId: req.user!.id,
          delta: -(settings.costConnect || 0),
          reason: 'CONNECT',
          refTable: 'connection_requests',
          refId: request.id,
          description: 'Sent connection request'
        });
      }

      // Get target user and post details for notifications
      const targetUser = await storage.getUser(requestData.targetUserId);
      const post = requestData.postId ? await storage.getPost(requestData.postId) : null;

      // Send Telegram notification to target user
      if (targetUser) {
        await telegramService.notifyConnectionRequest(targetUser.id, user.fullName);
      }

      // Send admin notification (only for non-admin users)
      if (!isAdmin) {
        await telegramService.notifyAdminConnectionRequest(
          user.fullName,
          targetUser?.fullName || 'Unknown User',
          post?.title
        );
      }

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

  // Get coin packages
  app.get("/api/coins/packages", async (req, res) => {
    try {
      const packages = await storage.getCoinPackages(true); // Only active packages for users
      res.json(packages);
    } catch (error) {
      console.error("Error fetching coin packages:", error);
      res.status(500).json({ message: "Failed to fetch coin packages" });
    }
  });

  // Coin system
  app.post("/api/coins/topups", isAuthenticated, async (req, res) => {
    try {
      const { packageId, slipUrl } = req.body;
      
      if (!packageId) {
        return res.status(400).json({ message: "Package selection is required" });
      }

      if (!slipUrl) {
        return res.status(400).json({ message: "Bank slip file is required" });
      }

      // Get the selected package
      const packages = await storage.getCoinPackages(true);
      const selectedPackage = packages.find(pkg => pkg.id === parseInt(packageId));
      
      if (!selectedPackage) {
        return res.status(400).json({ message: "Invalid package selected" });
      }

      // Convert the uploaded URL to object path
      const objectStorageService = new ObjectStorageService();
      const slipPath = objectStorageService.normalizeObjectEntityPath(slipUrl);

      const topup = await storage.createCoinTopup({
        userId: req.user!.id,
        amountMvr: selectedPackage.priceMvr,
        computedCoins: selectedPackage.coins,
        slipPath: slipPath,
        computedCoins: selectedPackage.coins
      });

      // Get user details for notification
      const user = await storage.getUser(req.user!.id);

      // Send Telegram notification to admin about new coin request
      if (user) {
        await telegramService.notifyAdminCoinRequest(
          user.username,
          selectedPackage.priceMvr.toString(),
          selectedPackage.coins
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
  app.get("/api/admin/queues/users/:status", isAdmin, async (req, res) => {
    try {
      const status = req.params.status;
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
  app.get("/api/admin/queues/posts/:status", isAdmin, async (req, res) => {
    try {
      const status = req.params.status;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getPostsForAdmin(status === "ALL" ? undefined : status, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching posts for admin:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/admin/queues/topups/:status", isAdmin, async (req, res) => {
    try {
      const status = req.params.status;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getCoinTopupsForAdmin(status === "ALL" ? undefined : status, limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching topups for admin:", error);
      res.status(500).json({ message: "Failed to fetch coin topups" });
    }
  });

  app.get("/api/admin/queues/connect/:status", isAdmin, async (req, res) => {
    try {
      const status = req.params.status;
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
      const computedCoins = Math.floor(parseFloat(topup.amountMvr.toString()) / parseFloat(settings.coinPriceMvr?.toString() || "10"));
      
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
        maxUploadMb: settings.maxUploadMb,
        themeConfig: settings.themeConfig
      };
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Admin settings endpoints
  app.get("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", isAdmin, async (req, res) => {
    try {
      const updatedSettings = await storage.updateSettings(req.body);
      
      await storage.createAudit({
        adminId: req.user!.id,
        action: 'SETTINGS_UPDATED',
        entity: 'settings',
        entityId: updatedSettings.id,
        meta: req.body,
        ip: req.ip || null
      });

      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
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

  // ================== COIN PACKAGE MANAGEMENT ==================
  
  // Admin coin package management
  app.get("/api/admin/packages", isAdmin, async (req, res) => {
    try {
      const packages = await storage.getCoinPackages(); // Get all packages for admin
      res.json(packages);
    } catch (error) {
      console.error("Error fetching coin packages for admin:", error);
      res.status(500).json({ message: "Failed to fetch coin packages" });
    }
  });

  app.post("/api/admin/packages", isAdmin, async (req, res) => {
    try {
      const { name, coins, priceMvr, isActive, isPopular, description } = req.body;
      
      const newPackage = await storage.createCoinPackage({
        name,
        coins,
        priceMvr,
        isActive: isActive !== undefined ? isActive : true,
        isPopular: isPopular !== undefined ? isPopular : false,
        description
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'PACKAGE_CREATED',
        entity: 'packages',
        entityId: newPackage.id,
        meta: { name, coins, priceMvr },
        ip: req.ip || null
      });

      res.status(201).json(newPackage);
    } catch (error) {
      console.error("Error creating coin package:", error);
      res.status(500).json({ message: "Failed to create coin package" });
    }
  });

  app.put("/api/admin/packages/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, coins, priceMvr, isActive, isPopular, description } = req.body;
      
      const updatedPackage = await storage.updateCoinPackage(id, {
        name,
        coins,
        priceMvr,
        isActive,
        isPopular,
        description
      });

      if (!updatedPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'PACKAGE_UPDATED',
        entity: 'packages',
        entityId: id,
        meta: { name, coins, priceMvr },
        ip: req.ip || null
      });

      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating coin package:", error);
      res.status(500).json({ message: "Failed to update coin package" });
    }
  });

  app.delete("/api/admin/packages/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await storage.deleteCoinPackage(id);

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'PACKAGE_DELETED',
        entity: 'packages',
        entityId: id,
        meta: {},
        ip: req.ip || null
      });

      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error("Error deleting coin package:", error);
      res.status(500).json({ message: "Failed to delete coin package" });
    }
  });

  // ================== BANK ACCOUNT MANAGEMENT ==================

  // Admin bank account management
  app.get("/api/admin/bank-accounts", isAdmin, async (req, res) => {
    try {
      const accounts = await storage.getBankAccounts(); // Get all accounts for admin
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts for admin:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.post("/api/admin/bank-accounts", isAdmin, async (req, res) => {
    try {
      const { bankName, accountNumber, accountName, branchName, swiftCode, isActive, isPrimary } = req.body;
      
      const newAccount = await storage.createBankAccount({
        bankName,
        accountNumber,
        accountName,
        branchName,
        swiftCode,
        isActive: isActive !== undefined ? isActive : true,
        isPrimary: isPrimary !== undefined ? isPrimary : false
      });

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'BANK_ACCOUNT_CREATED',
        entity: 'bank_accounts',
        entityId: newAccount.id,
        meta: { bankName, accountNumber, accountName },
        ip: req.ip || null
      });

      res.status(201).json(newAccount);
    } catch (error) {
      console.error("Error creating bank account:", error);
      res.status(500).json({ message: "Failed to create bank account" });
    }
  });

  app.put("/api/admin/bank-accounts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { bankName, accountNumber, accountName, branchName, swiftCode, isActive, isPrimary } = req.body;
      
      const updatedAccount = await storage.updateBankAccount(id, {
        bankName,
        accountNumber,
        accountName,
        branchName,
        swiftCode,
        isActive,
        isPrimary
      });

      if (!updatedAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'BANK_ACCOUNT_UPDATED',
        entity: 'bank_accounts',
        entityId: id,
        meta: { bankName, accountNumber, accountName },
        ip: req.ip || null
      });

      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "Failed to update bank account" });
    }
  });

  app.delete("/api/admin/bank-accounts/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await storage.deleteBankAccount(id);

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'BANK_ACCOUNT_DELETED',
        entity: 'bank_accounts',
        entityId: id,
        meta: {},
        ip: req.ip || null
      });

      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });

  app.put("/api/admin/bank-accounts/:id/primary", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      await storage.setPrimaryBankAccount(id);

      await storage.createAudit({
        adminId: req.user!.id,
        action: 'BANK_ACCOUNT_PRIMARY_SET',
        entity: 'bank_accounts',
        entityId: id,
        meta: {},
        ip: req.ip || null
      });

      res.json({ message: "Primary bank account updated successfully" });
    } catch (error) {
      console.error("Error setting primary bank account:", error);
      res.status(500).json({ message: "Failed to set primary bank account" });
    }
  });

  // Public endpoint to get active bank accounts for coin purchases
  app.get("/api/bank-accounts", async (req, res) => {
    try {
      const accounts = await storage.getBankAccounts(true); // Only active accounts
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
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

  // Chat API Routes
  // Get user's conversations with admin inbox visibility for admins
  app.get("/api/chat/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const isAdminUser = req.user!.role === 'ADMIN' || req.user!.role === 'SUPERADMIN';
      
      let conversations;
      if (isAdminUser && req.query.adminView === 'true') {
        // Admin can see all conversations for monitoring
        const result = await storage.getAllConversations(50, 0);
        conversations = result.conversations;
      } else {
        conversations = await storage.getUserConversations(userId);
      }
      
      res.json({ conversations });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Send message in conversation
  // Create conversation endpoint
  app.post("/api/chat/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { participantIds } = req.body;

      if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ error: "participantIds array is required" });
      }

      // Check if conversation already exists between these users
      if (participantIds.length === 1) {
        const existingConversation = await storage.getConversationByParticipants(userId, participantIds[0]);
        if (existingConversation) {
          return res.json(existingConversation);
        }
      }

      // Create new conversation
      const conversation = await storage.createConversation({
        status: 'ACTIVE'
      });

      // Add current user as participant
      await storage.addConversationParticipant({
        conversationId: conversation.id,
        userId: userId
      });

      // Add other participants
      for (const participantId of participantIds) {
        await storage.addConversationParticipant({
          conversationId: conversation.id,
          userId: participantId
        });
      }

      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/chat/conversations/:conversationId/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const userId = req.user!.id;
      const { body } = req.body;

      // Verify user is participant in conversation
      const isParticipant = await storage.isConversationParticipant(conversationId, userId);
      if (!isParticipant) {
        return res.status(403).json({ error: "Not authorized to send messages in this conversation" });
      }

      const message = await storage.createMessage({
        conversationId,
        senderId: userId,
        body,
        attachments: req.body.attachments || null
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get conversation messages with pagination
  app.get("/api/chat/conversations/:conversationId/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const userId = req.user!.id;
      const beforeId = req.query.beforeId ? parseInt(req.query.beforeId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      // Verify user is participant or admin
      const isParticipant = await storage.isConversationParticipant(conversationId, userId);
      const isAdminUser = req.user!.role === 'ADMIN' || req.user!.role === 'SUPERADMIN';
      
      if (!isParticipant && !isAdminUser) {
        return res.status(403).json({ error: "Not authorized to view this conversation" });
      }

      const messages = isAdminUser && req.query.adminView === 'true'
        ? await storage.getConversationMessages(conversationId, limit, 0)
        : await storage.getMessages(conversationId, beforeId, limit);

      res.json({ messages });
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Admin: Get all conversations for monitoring (Admin Inbox)
  app.get("/api/admin/chat/inbox", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await storage.getAllConversations(limit, offset);
      res.json({
        conversations: result.conversations,
        total: result.total,
        adminView: true
      });
    } catch (error) {
      console.error("Error fetching admin chat inbox:", error);
      res.status(500).json({ error: "Failed to fetch admin chat inbox" });
    }
  });

  // Auto-create conversation when connection request is approved
  const createConversationForConnection = async (requesterId: number, targetUserId: number) => {
    try {
      // Check if conversation already exists
      const existingConversation = await storage.getConversationByParticipants(requesterId, targetUserId);
      if (existingConversation) {
        return existingConversation;
      }

      // Create new conversation
      const conversation = await storage.createConversation({
        status: 'ACTIVE'
      });

      // Add participants
      await storage.addConversationParticipant({
        conversationId: conversation.id,
        userId: requesterId
      });

      await storage.addConversationParticipant({
        conversationId: conversation.id,
        userId: targetUserId
      });

      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  };

  // ================== VISITOR ANALYTICS ==================
  
  // Get visitor statistics for admin dashboard
  app.get("/api/admin/visitor-stats", isAdmin, async (req, res) => {
    try {
      const stats = await storage.getVisitorStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching visitor stats:", error);
      res.status(500).json({ message: "Failed to fetch visitor statistics" });
    }
  });

  // WebSocket setup for real-time chat
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active WebSocket connections
  const activeConnections = new Map<number, Set<WebSocket>>();

  wss.on('connection', (ws: WebSocket, req) => {
    let userId: number | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'authenticate':
            userId = data.userId;
            if (!activeConnections.has(userId)) {
              activeConnections.set(userId, new Set());
            }
            activeConnections.get(userId)!.add(ws);
            ws.send(JSON.stringify({ type: 'authenticated', success: true }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (userId && activeConnections.has(userId)) {
        activeConnections.get(userId)!.delete(ws);
        if (activeConnections.get(userId)!.size === 0) {
          activeConnections.delete(userId);
        }
      }
    });
  });

  return httpServer;
}
