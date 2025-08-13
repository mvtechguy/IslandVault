# Kaiveni Application Bug Report

## Overview
This report documents critical bugs and issues identified in the Kaiveni application - a Maldives-only partner finder platform. The issues span authentication, UI components, object storage, frontend code, real-time chat, service worker caching, database schema, and connection request flows.

## 1. Authentication Issues (401 Errors)

### Problem
Users experience 401 Unauthorized errors when making API requests, despite being logged in.

### Root Cause
- Session configuration issues in `server/auth.ts`
- Cookie settings not properly configured for the application domain
- Session expiration too short or not properly refreshed

### Recommendation
1. Update session configuration in `server/auth.ts`:
   ```typescript
   app.use(
     session({
       secret: process.env.SESSION_SECRET || "your-secret-key",
       resave: false,
       saveUninitialized: false,
       cookie: {
         secure: process.env.NODE_ENV === "production",
         httpOnly: true,
         maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
         sameSite: "lax"
       }
     })
   );
   ```

2. Implement proper session refresh mechanism:
   ```typescript
   // Add to auth.ts
   app.use((req, res, next) => {
     if (req.session && req.user) {
       // Refresh session expiration on activity
       req.session.touch();
     }
     next();
   });
   ```

3. Fix authentication check middleware to properly handle expired sessions:
   ```typescript
   export const isAuthenticated = (req, res, next) => {
     if (req.isAuthenticated()) {
       return next();
     }
     return res.status(401).json({ message: "Authentication required" });
   };
   ```

## 2. Select Component Errors

### Problem
Select components throw errors due to missing null checks on values.

### Root Cause
The Select component doesn't handle null or undefined values properly.

### Recommendation
1. Add null checks in all Select components:
   ```tsx
   <Select
     value={value || ""}  // Add null check here
     onValueChange={onChange}
   >
     {/* Select options */}
   </Select>
   ```

2. Create a wrapper component that handles null values:
   ```tsx
   export function SafeSelect({ value, ...props }) {
     return (
       <Select
         value={value || ""}
         {...props}
       />
     );
   }
   ```

## 3. Object Storage Access Issues (403 Forbidden)

### Problem
Users receive 403 Forbidden errors when trying to access uploaded images and files.

### Root Cause
- Missing ACL policy setting after file upload
- Incorrect URL being used for image display (using upload URL instead of access URL)
- Improper error handling in object access endpoint (returning 401 instead of 403)

### Recommendation
1. Fix the object access endpoint in `server/routes.ts`:
   ```typescript
   // Change line 100 from:
   return res.sendStatus(401);
   // To:
   return res.sendStatus(403);
   ```

2. Modify the upload process to set ACL policy after upload:
   ```typescript
   // Add to server/routes.ts
   app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
     try {
       const objectStorageService = new ObjectStorageService();
       const uploadURL = await objectStorageService.getObjectEntityUploadURL();
       
       // Return both upload URL and object path for later access
       const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
       
       res.json({ uploadURL, objectPath });
     } catch (error) {
       console.error("Error getting upload URL:", error);
       res.status(500).json({ message: "Failed to get upload URL" });
     }
   });
   
   // Add new endpoint to set ACL policy after upload
   app.post("/api/objects/:objectId/acl", isAuthenticated, async (req, res) => {
     try {
       const objectId = req.params.objectId;
       const { visibility = "private" } = req.body;
       
       const objectStorageService = new ObjectStorageService();
       const objectPath = `/objects/${objectId}`;
       
       await objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
         owner: req.user.id.toString(),
         visibility: visibility as "public" | "private",
         aclRules: [
           {
             group: {
               type: ObjectAccessGroupType.ADMIN_ONLY,
               id: "admins"
             },
             permission: ObjectPermission.READ
           }
         ]
       });
       
       res.json({ success: true, objectPath });
     } catch (error) {
       console.error("Error setting ACL policy:", error);
       res.status(500).json({ message: "Failed to set ACL policy" });
     }
   });
   ```

3. Update the client-side image uploader components to set ACL policy after upload:
   ```typescript
   // In ImageUploader.tsx and MultiImageUploader.tsx
   const uploadImage = async (file: File): Promise<string> => {
     // Get upload URL from server
     const response = await fetch("/api/objects/upload", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
     });
     
     if (!response.ok) {
       throw new Error('Failed to get upload URL');
     }
     
     const { uploadURL, objectPath } = await response.json();
     
     // Upload file to cloud storage
     const uploadResponse = await fetch(uploadURL, {
       method: "PUT",
       body: file,
       headers: {
         'Content-Type': file.type,
       },
     });
     
     if (!uploadResponse.ok) {
       throw new Error('Failed to upload file');
     }
     
     // Set ACL policy after upload
     const objectId = objectPath.split('/').pop();
     await fetch(`/api/objects/${objectId}/acl`, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ visibility: "public" }),
     });
     
     return objectPath; // Return object path instead of upload URL
   };
   ```

4. Implement a proper image proxy endpoint:
   ```typescript
   // Replace the current image-proxy endpoint with:
   app.get("/api/image-proxy/:objectId", async (req, res) => {
     try {
       const objectId = req.params.objectId;
       const objectPath = `/objects/${objectId}`;
       
       const objectStorageService = new ObjectStorageService();
       try {
         const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
         return objectStorageService.downloadObject(objectFile, res);
       } catch (error) {
         if (error instanceof ObjectNotFoundError) {
           // Fallback to placeholder if object not found
           const svgPlaceholder = `
             <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
               <rect width="100" height="100" fill="#88D8F4" />
               <text x="50" y="60" font-family="Arial" font-size="24" 
                     fill="white" text-anchor="middle">Image</text>
             </svg>
           `;
           
           res.setHeader('Content-Type', 'image/svg+xml');
           res.send(svgPlaceholder);
         } else {
           throw error;
         }
       }
     } catch (error) {
       console.error("Error serving image:", error);
       res.status(500).json({ message: "Failed to serve image" });
     }
   });
   ```

## 4. TypeError in Frontend Code

### Problem
Frontend code throws "Cannot read properties of null" errors when rendering components.

### Root Cause
Missing null checks when accessing nested properties in post rendering code.

### Recommendation
1. Add null checks in post rendering code:
   ```tsx
   // In browse-posts-page.tsx
   {post?.user?.fullName || 'Unknown User'}
   
   // Instead of:
   {post.user.fullName}
   ```

2. Use optional chaining and nullish coalescing operators:
   ```tsx
   const userAtoll = post?.user?.atoll ?? 'Unknown';
   const userIsland = post?.user?.island ?? 'Unknown';
   ```

3. Add defensive rendering patterns:
   ```tsx
   {post ? (
     <PostCard 
       post={post}
       user={post.user || { fullName: 'Unknown User' }}
     />
   ) : (
     <PostSkeleton />
   )}
   ```

## 5. WebSocket Implementation for Real-time Chat

### Problem
The WebSocket implementation for real-time chat is incomplete.

### Root Cause
- Missing message broadcasting to connected clients
- No reconnection logic on the client side
- No message persistence mechanism

### Recommendation
1. Complete the WebSocket server implementation:
   ```typescript
   // In routes.ts, add to the WebSocket connection handler:
   
   // Broadcast message to conversation participants
   const broadcastToConversation = async (conversationId: number, message: any) => {
     try {
       const participants = await storage.getConversationParticipants(conversationId);
       
       participants.forEach(participant => {
         const userConnections = activeConnections.get(participant.userId);
         if (userConnections) {
           userConnections.forEach(ws => {
             if (ws.readyState === WebSocket.OPEN) {
               ws.send(JSON.stringify(message));
             }
           });
         }
       });
     } catch (error) {
       console.error('Error broadcasting message:', error);
     }
   };
   
   // Handle chat messages
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
           
         case 'chat_message':
           if (!userId) {
             ws.send(JSON.stringify({ 
               type: 'error', 
               error: 'Not authenticated' 
             }));
             return;
           }
           
           const { conversationId, body, attachments } = data;
           
           // Verify user is participant in conversation
           const isParticipant = await storage.isConversationParticipant(
             conversationId, 
             userId
           );
           
           if (!isParticipant) {
             ws.send(JSON.stringify({ 
               type: 'error', 
               error: 'Not authorized for this conversation' 
             }));
             return;
           }
           
           // Save message to database
           const message = await storage.createMessage({
             conversationId,
             senderId: userId,
             body,
             attachments
           });
           
           // Broadcast to all participants
           await broadcastToConversation(conversationId, {
             type: 'new_message',
             message
           });
           break;
       }
     } catch (error) {
       console.error('WebSocket message error:', error);
     }
   });
   ```

2. Implement client-side WebSocket handling:
   ```typescript
   // Create a new hook: useChat.tsx
   
   export function useChat(userId: number) {
     const [socket, setSocket] = useState<WebSocket | null>(null);
     const [connected, setConnected] = useState(false);
     const [messages, setMessages] = useState<Record<number, any[]>>({});
     
     useEffect(() => {
       if (!userId) return;
       
       const connect = () => {
         const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
         
         ws.onopen = () => {
           ws.send(JSON.stringify({ 
             type: 'authenticate', 
             userId 
           }));
         };
         
         ws.onmessage = (event) => {
           const data = JSON.parse(event.data);
           
           switch (data.type) {
             case 'authenticated':
               setConnected(true);
               break;
               
             case 'new_message':
               const message = data.message;
               setMessages(prev => ({
                 ...prev,
                 [message.conversationId]: [
                   ...(prev[message.conversationId] || []),
                   message
                 ]
               }));
               break;
           }
         };
         
         ws.onclose = () => {
           setConnected(false);
           // Reconnect after delay
           setTimeout(connect, 3000);
         };
         
         setSocket(ws);
       };
       
       connect();
       
       return () => {
         if (socket) {
           socket.close();
         }
       };
     }, [userId]);
     
     const sendMessage = useCallback((conversationId: number, body: string, attachments?: any[]) => {
       if (!socket || !connected) return false;
       
       socket.send(JSON.stringify({
         type: 'chat_message',
         conversationId,
         body,
         attachments
       }));
       
       return true;
     }, [socket, connected]);
     
     return { connected, messages, sendMessage };
   }
   ```

## 6. Service Worker Caching Strategy

### Problem
The service worker caching strategy is not optimized for the application's needs.

### Root Cause
- Inefficient caching rules
- No versioning for cache invalidation
- Missing offline fallback content

### Recommendation
1. Implement a proper caching strategy in `client/public/sw.js`:
   ```javascript
   // Cache version for invalidation
   const CACHE_VERSION = 'v1';
   const CACHE_NAME = `kaiveni-cache-${CACHE_VERSION}`;
   
   // Assets to cache on install
   const STATIC_ASSETS = [
     '/',
     '/index.html',
     '/offline.html', // Create this file for offline fallback
     '/static/css/main.css',
     '/static/js/main.js',
     '/static/media/logo.png'
   ];
   
   // Install event - cache static assets
   self.addEventListener('install', event => {
     event.waitUntil(
       caches.open(CACHE_NAME)
         .then(cache => cache.addAll(STATIC_ASSETS))
         .then(() => self.skipWaiting())
     );
   });
   
   // Activate event - clean old caches
   self.addEventListener('activate', event => {
     event.waitUntil(
       caches.keys().then(cacheNames => {
         return Promise.all(
           cacheNames
             .filter(name => name.startsWith('kaiveni-cache-') && name !== CACHE_NAME)
             .map(name => caches.delete(name))
         );
       })
       .then(() => self.clients.claim())
     );
   });
   
   // Fetch event - network-first strategy for API, cache-first for assets
   self.addEventListener('fetch', event => {
     const url = new URL(event.request.url);
     
     // Skip non-GET requests
     if (event.request.method !== 'GET') return;
     
     // Handle API requests (network-first)
     if (url.pathname.startsWith('/api/')) {
       event.respondWith(
         fetch(event.request)
           .then(response => {
             // Cache successful responses
             if (response.ok) {
               const clonedResponse = response.clone();
               caches.open(CACHE_NAME).then(cache => {
                 cache.put(event.request, clonedResponse);
               });
             }
             return response;
           })
           .catch(() => {
             // Fallback to cache if network fails
             return caches.match(event.request);
           })
       );
       return;
     }
     
     // Handle static assets (cache-first)
     event.respondWith(
       caches.match(event.request)
         .then(cachedResponse => {
           if (cachedResponse) {
             return cachedResponse;
           }
           
           return fetch(event.request)
             .then(response => {
               if (!response || response.status !== 200 || response.type !== 'basic') {
                 return response;
               }
               
               const clonedResponse = response.clone();
               caches.open(CACHE_NAME).then(cache => {
                 cache.put(event.request, clonedResponse);
               });
               
               return response;
             })
             .catch(() => {
               // Fallback to offline page for HTML requests
               if (event.request.headers.get('accept')?.includes('text/html')) {
                 return caches.match('/offline.html');
               }
               
               return new Response('Network error occurred', {
                 status: 408,
                 headers: { 'Content-Type': 'text/plain' }
               });
             });
         })
     );
   });
   ```

2. Create an offline fallback page:
   ```html
   <!-- client/public/offline.html -->
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>Kaiveni - Offline</title>
     <style>
       body {
         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         display: flex;
         flex-direction: column;
         align-items: center;
         justify-content: center;
         height: 100vh;
         margin: 0;
         padding: 20px;
         text-align: center;
         background-color: #f9fafb;
         color: #1f2937;
       }
       .logo {
         width: 120px;
         height: 120px;
         margin-bottom: 24px;
         background-color: #10b981;
         border-radius: 50%;
         display: flex;
         align-items: center;
         justify-content: center;
         color: white;
         font-size: 32px;
         font-weight: bold;
       }
       h1 {
         margin-bottom: 16px;
         font-size: 24px;
       }
       p {
         margin-bottom: 24px;
         color: #6b7280;
       }
       button {
         background-color: #10b981;
         color: white;
         border: none;
         padding: 12px 24px;
         border-radius: 6px;
         font-weight: 500;
         cursor: pointer;
       }
     </style>
   </head>
   <body>
     <div class="logo">K</div>
     <h1>You're offline</h1>
     <p>Please check your internet connection and try again.</p>
     <button onclick="window.location.reload()">Retry</button>
   </body>
   </html>
   ```

## 7. Database Schema Implementation

### Problem
The database schema implementation doesn't fully match the requirements.

### Root Cause
Missing or incomplete schema definitions in `shared/schema.ts`.

### Recommendation
1. Update the schema definitions to match requirements:
   ```typescript
   // Add missing fields to user schema
   export const users = pgTable("users", {
     // Existing fields...
     profileCompleteness: integer("profile_completeness").default(0),
     lastActive: timestamp("last_active"),
     // Add other missing fields...
   });
   
   // Add missing fields to posts schema
   export const posts = pgTable("posts", {
     // Existing fields...
     viewCount: integer("view_count").default(0),
     // Add other missing fields...
   });
   
   // Add missing fields to connection_requests schema
   export const connectionRequests = pgTable("connection_requests", {
     // Existing fields...
     responseMessage: text("response_message"),
     // Add other missing fields...
   });
   ```

2. Create migration scripts to update the database:
   ```typescript
   // Create a new migration file
   
   import { sql } from "drizzle-orm";
   
   export async function up(db) {
     await sql`
       ALTER TABLE users 
       ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0,
       ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
       
       ALTER TABLE posts
       ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
       
       ALTER TABLE connection_requests
       ADD COLUMN IF NOT EXISTS response_message TEXT;
     `;
   }
   
   export async function down(db) {
     await sql`
       ALTER TABLE users 
       DROP COLUMN IF EXISTS profile_completeness,
       DROP COLUMN IF EXISTS last_active;
       
       ALTER TABLE posts
       DROP COLUMN IF EXISTS view_count;
       
       ALTER TABLE connection_requests
       DROP COLUMN IF EXISTS response_message;
     `;
   }
   ```

## 8. Connection Request Approval Flow

### Problem
The connection request approval flow is incomplete.

### Root Cause
Missing endpoints and functionality for approving connection requests.

### Recommendation
1. Add connection request approval endpoints:
   ```typescript
   // Add to routes.ts
   
   // Approve connection request
   app.post("/api/connect/:id/approve", isAuthenticated, async (req, res) => {
     try {
       const id = parseInt(req.params.id);
       const { message } = req.body;
       
       // Get the connection request
       const request = await storage.getConnectionRequest(id);
       if (!request) {
         return res.status(404).json({ message: "Connection request not found" });
       }
       
       // Verify the user is the target of the request
       if (request.targetUserId !== req.user!.id) {
         return res.status(403).json({ message: "You can only approve requests sent to you" });
       }
       
       // Update the request status
       const updatedRequest = await storage.updateConnectionRequest(id, {
         status: 'APPROVED',
         responseMessage: message || null
       });
       
       // Create a conversation for the users
       const conversation = await createConversationForConnection(
         request.requesterId,
         request.targetUserId
       );
       
       // Send notification to requester
       await storage.createNotification({
         userId: request.requesterId,
         type: 'CONNECTION_APPROVED',
         data: {
           targetUserId: request.targetUserId,
           message,
           conversationId: conversation.id
         },
         seen: false
       });
       
       // Send Telegram notification
       const requester = await storage.getUser(request.requesterId);
       const target = await storage.getUser(request.targetUserId);
       if (requester && target) {
         await telegramService.notifyConnectionApproved(
           requester.id,
           target.fullName
         );
       }
       
       res.json(updatedRequest);
     } catch (error) {
       console.error("Error approving connection request:", error);
       res.status(500).json({ message: "Failed to approve connection request" });
     }
   });
   
   // Reject connection request
   app.post("/api/connect/:id/reject", isAuthenticated, async (req, res) => {
     try {
       const id = parseInt(req.params.id);
       const { message } = req.body;
       
       // Get the connection request
       const request = await storage.getConnectionRequest(id);
       if (!request) {
         return res.status(404).json({ message: "Connection request not found" });
       }
       
       // Verify the user is the target of the request
       if (request.targetUserId !== req.user!.id) {
         return res.status(403).json({ message: "You can only reject requests sent to you" });
       }
       
       // Update the request status
       const updatedRequest = await storage.updateConnectionRequest(id, {
         status: 'REJECTED',
         responseMessage: message || null
       });
       
       // Send notification to requester
       await storage.createNotification({
         userId: request.requesterId,
         type: 'CONNECTION_REJECTED',
         data: {
           targetUserId: request.targetUserId,
           message
         },
         seen: false
       });
       
       res.json(updatedRequest);
     } catch (error) {
       console.error("Error rejecting connection request:", error);
       res.status(500).json({ message: "Failed to reject connection request" });
     }
   });
   ```

2. Add storage methods for connection requests:
   ```typescript
   // Add to storage.ts
   
   async getConnectionRequest(id: number) {
     const [request] = await db
       .select()
       .from(connectionRequests)
       .where(eq(connectionRequests.id, id));
     return request || null;
   }
   
   async updateConnectionRequest(id: number, data: Partial<typeof connectionRequests.$inferInsert>) {
     const [updated] = await db
       .update(connectionRequests)
       .set(data)
       .where(eq(connectionRequests.id, id))
       .returning();
     return updated;
   }
   
   async getConversationParticipants(conversationId: number) {
     return db
       .select()
       .from(conversationParticipants)
       .where(eq(conversationParticipants.conversationId, conversationId));
   }
   ```

## 9. Image Upload Functionality

### Problem
Image upload functionality has several issues:
- Uploaded images are not accessible due to missing ACL policies
- The upload URL is incorrectly used as the image URL
- There are two different image uploader components with similar functionality

### Root Cause
- Missing ACL policy setting after file upload
- Incorrect URL handling in image uploader components
- Duplicate implementation of image uploaders

### Recommendation
1. Consolidate the image uploader components:
   ```typescript
   // Create a unified ImageUploader component that uses ObjectUploader internally
   
   export function ImageUploader({
     maxImages = 5,
     onImagesChange,
     currentImages = []
   }: ImageUploaderProps) {
     // Implementation that uses ObjectUploader
   }
   ```

2. Fix the upload and ACL policy setting process as described in section 3.

3. Update image URLs to use the object path instead of the upload URL:
   ```typescript
   // In ImageUploader component
   
   const handleImageUpload = async (result: any) => {
     if (result.successful && result.successful.length > 0) {
       // Map to object paths instead of upload URLs
       const newImagePaths = result.successful.map((file: any) => {
         // Extract object ID from upload URL
         const url = new URL(file.uploadURL);
         const pathParts = url.pathname.split('/');
         const objectId = pathParts[pathParts.length - 1];
         
         // Return path for image proxy
         return `/api/image-proxy/${objectId}`;
       });
       
       const updatedImages = [...images, ...newImagePaths];
       setImages(updatedImages);
       onImagesChange(updatedImages);
     }
   };
   ```

## Summary of Recommendations

1. **Authentication**:
   - Update session configuration
   - Implement session refresh
   - Fix authentication middleware

2. **Select Component**:
   - Add null checks
   - Create a SafeSelect wrapper component

3. **Object Storage**:
   - Fix status codes in object access endpoint
   - Implement ACL policy setting after upload
   - Create proper image proxy endpoint

4. **Frontend TypeErrors**:
   - Add null checks and optional chaining
   - Implement defensive rendering patterns

5. **WebSocket Chat**:
   - Complete server-side message broadcasting
   - Implement client-side WebSocket hook
   - Add reconnection logic

6. **Service Worker**:
   - Implement proper caching strategies
   - Add cache versioning
   - Create offline fallback page

7. **Database Schema**:
   - Update schema definitions
   - Create migration scripts

8. **Connection Requests**:
   - Add approval/rejection endpoints
   - Implement conversation creation on approval

9. **Image Upload**:
   - Consolidate image uploader components
   - Fix ACL policy setting
   - Update image URL handling

10. **Admin Panel Bank Details**:
   - Implement dialog component for adding/editing bank accounts
   - Add mutation functions for bank account operations
   - Connect dialog to the "Add Bank Details" button

By addressing these issues, the Kaiveni application will have improved stability, better user experience, and more reliable functionality across all its features.

## 10. Admin Panel Bank Details Issue

### Problem
Users cannot click the "Add Bank Details" button in the admin panel.

### Root Cause
The "Add Bank Details" button sets the `showAddBank` state to true (line 1186 in admin-page.tsx), but there's no corresponding dialog component that uses this state to display the bank details form.

### Recommendation
1. Implement a dialog component for adding bank details:
   ```tsx
   {/* Bank Account Dialog */}
   <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
     <DialogContent className="max-w-md">
       <DialogHeader>
         <DialogTitle className="flex items-center space-x-2">
           <Landmark className="w-5 h-5" />
           <span>{isEditingBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}</span>
         </DialogTitle>
       </DialogHeader>
       
       <div className="space-y-4">
         <div>
           <Label htmlFor="bankName">Bank Name</Label>
           <Input
             id="bankName"
             value={bankAccountForm.bankName}
             onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
             placeholder="e.g., Bank of Maldives"
           />
         </div>

         <div>
           <Label htmlFor="accountNumber">Account Number</Label>
           <Input
             id="accountNumber"
             value={bankAccountForm.accountNumber}
             onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
             placeholder="e.g., 7701-123456-001"
           />
         </div>

         <div>
           <Label htmlFor="accountName">Account Name</Label>
           <Input
             id="accountName"
             value={bankAccountForm.accountName}
             onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountName: e.target.value })}
             placeholder="e.g., Kaiveni Ltd"
           />
         </div>

         <div>
           <Label htmlFor="branchName">Branch Name</Label>
           <Input
             id="branchName"
             value={bankAccountForm.branchName}
             onChange={(e) => setBankAccountForm({ ...bankAccountForm, branchName: e.target.value })}
             placeholder="e.g., Male Branch"
           />
         </div>

         <div>
           <Label htmlFor="swiftCode">SWIFT Code (Optional)</Label>
           <Input
             id="swiftCode"
             value={bankAccountForm.swiftCode}
             onChange={(e) => setBankAccountForm({ ...bankAccountForm, swiftCode: e.target.value })}
             placeholder="e.g., MALBMVMV"
           />
         </div>

         <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2">
             <input
               type="checkbox"
               id="bankActive"
               checked={bankAccountForm.isActive}
               onChange={(e) => setBankAccountForm({ ...bankAccountForm, isActive: e.target.checked })}
               className="rounded"
             />
             <Label htmlFor="bankActive">Active</Label>
           </div>
           <div className="flex items-center space-x-2">
             <input
               type="checkbox"
               id="bankPrimary"
               checked={bankAccountForm.isPrimary}
               onChange={(e) => setBankAccountForm({ ...bankAccountForm, isPrimary: e.target.checked })}
               className="rounded"
             />
             <Label htmlFor="bankPrimary">Primary Account</Label>
           </div>
         </div>

         <div className="flex justify-end space-x-2 pt-4">
           <Button
             variant="outline"
             onClick={() => setShowAddBank(false)}
           >
             Cancel
           </Button>
           <Button
             onClick={() => {
               const bankData = {
                 bankName: bankAccountForm.bankName,
                 accountNumber: bankAccountForm.accountNumber,
                 accountName: bankAccountForm.accountName,
                 branchName: bankAccountForm.branchName,
                 swiftCode: bankAccountForm.swiftCode || null,
                 isActive: bankAccountForm.isActive,
                 isPrimary: bankAccountForm.isPrimary
               };

               if (isEditingBankAccount && selectedBankAccount?.id) {
                 // Update existing bank account
                 apiRequest("PUT", `/api/admin/bank-accounts/${selectedBankAccount.id}`, bankData)
                   .then(() => {
                     queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
                     toast({ title: "Bank account updated successfully" });
                     setShowAddBank(false);
                   })
                   .catch(() => {
                     toast({ title: "Failed to update bank account", variant: "destructive" });
                   });
               } else {
                 // Create new bank account
                 apiRequest("POST", "/api/admin/bank-accounts", bankData)
                   .then(() => {
                     queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
                     toast({ title: "Bank account created successfully" });
                     setShowAddBank(false);
                   })
                   .catch(() => {
                     toast({ title: "Failed to create bank account", variant: "destructive" });
                   });
               }
             }}
             disabled={!bankAccountForm.bankName || !bankAccountForm.accountNumber || !bankAccountForm.accountName}
             className="bg-mint hover:bg-mint/90"
           >
             {isEditingBankAccount ? (
               <>
                 <Edit className="w-4 h-4 mr-1" />
                 Update Bank Account
               </>
             ) : (
               <>
                 <Plus className="w-4 h-4 mr-1" />
                 Add Bank Account
               </>
             )}
           </Button>
         </div>
       </div>
     </DialogContent>
   </Dialog>
   ```

2. Add the dialog component to the admin-page.tsx file, just before the closing `</div>` tag at the end of the component.

3. Implement the necessary mutation functions for creating and updating bank accounts:
   ```typescript
   const createBankAccountMutation = useMutation({
     mutationFn: async (data: any) => {
       const res = await apiRequest("POST", "/api/admin/bank-accounts", data);
       return res.json();
     },
     onSuccess: () => {
       toast({ title: "Bank account created successfully" });
       queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
       setShowAddBank(false);
       setBankAccountForm({
         bankName: "",
         accountNumber: "",
         accountName: "",
         branchName: "",
         swiftCode: "",
         isActive: true,
         isPrimary: false
       });
     },
     onError: (error: Error) => {
       toast({
         title: "Failed to create bank account",
         description: error.message,
         variant: "destructive",
       });
     },
   });

   const updateBankAccountMutation = useMutation({
     mutationFn: async ({ id, data }: { id: number; data: any }) => {
       const res = await apiRequest("PUT", `/api/admin/bank-accounts/${id}`, data);
       return res.json();
     },
     onSuccess: () => {
       toast({ title: "Bank account updated successfully" });
       queryClient.invalidateQueries({ queryKey: ["/api/admin/bank-accounts"] });
       setShowAddBank(false);
       setSelectedBankAccount(null);
     },
     onError: (error: Error) => {
       toast({
         title: "Failed to update bank account",
         description: error.message,
         variant: "destructive",
       });
     },
   });
   ```

4. Update the Summary of Recommendations section to include this fix:

## Summary of Recommendations

1. **Authentication**: