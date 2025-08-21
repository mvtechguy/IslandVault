import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { storage } from '../../server/storage';

describe('Database Storage Tests', () => {
  // Test data cleanup
  const testUserIds: number[] = [];
  const testPostIds: number[] = [];

  afterEach(async () => {
    // Clean up test data
    for (const postId of testPostIds) {
      try {
        await storage.updatePost(postId, { deletedAt: new Date() });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    testPostIds.length = 0;

    for (const userId of testUserIds) {
      try {
        // In a real test environment, you might want to actually delete test users
        // For now, just mark them as deleted or inactive
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    testUserIds.length = 0;
  });

  describe('User Management', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'storagetest' + Date.now(),
        fullName: 'Storage Test User',
        phone: '790' + Date.now().toString().slice(-7),
        password: 'hashedpassword123',
        dateOfBirth: '1995-05-15',
        gender: 'MALE' as const,
        atoll: 'Male',
        island: 'Hulhumale',
        status: 'PENDING' as const,
        coins: 0
      };

      const createdUser = await storage.createUser(userData);
      testUserIds.push(createdUser.id);

      expect(createdUser).toHaveProperty('id');
      expect(createdUser.username).toBe(userData.username);
      expect(createdUser.fullName).toBe(userData.fullName);
      expect(createdUser.status).toBe('PENDING');
    });

    it('should get user by ID', async () => {
      // First create a user
      const userData = {
        username: 'gettest' + Date.now(),
        fullName: 'Get Test User',
        phone: '790' + Date.now().toString().slice(-7),
        password: 'hashedpassword123',
        dateOfBirth: '1995-05-15',
        gender: 'MALE' as const,
        atoll: 'Male',
        island: 'Hulhumale',
        status: 'PENDING' as const,
        coins: 0
      };

      const createdUser = await storage.createUser(userData);
      testUserIds.push(createdUser.id);

      // Now get the user
      const retrievedUser = await storage.getUser(createdUser.id);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.username).toBe(userData.username);
    });

    it('should get user by username', async () => {
      const userData = {
        username: 'usernametest' + Date.now(),
        fullName: 'Username Test User',
        phone: '790' + Date.now().toString().slice(-7),
        password: 'hashedpassword123',
        dateOfBirth: '1995-05-15',
        gender: 'MALE' as const,
        atoll: 'Male',
        island: 'Hulhumale',
        status: 'PENDING' as const,
        coins: 0
      };

      const createdUser = await storage.createUser(userData);
      testUserIds.push(createdUser.id);

      const retrievedUser = await storage.getUserByUsername(userData.username);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.username).toBe(userData.username);
    });

    it('should update user data', async () => {
      const userData = {
        username: 'updatetest' + Date.now(),
        fullName: 'Update Test User',
        phone: '790' + Date.now().toString().slice(-7),
        password: 'hashedpassword123',
        dateOfBirth: '1995-05-15',
        gender: 'MALE' as const,
        atoll: 'Male',
        island: 'Hulhumale',
        status: 'PENDING' as const,
        coins: 0
      };

      const createdUser = await storage.createUser(userData);
      testUserIds.push(createdUser.id);

      const updateData = {
        fullName: 'Updated Name',
        bio: 'Updated bio'
      };

      const updatedUser = await storage.updateUser(createdUser.id, updateData);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.fullName).toBe('Updated Name');
      expect(updatedUser?.bio).toBe('Updated bio');
    });
  });

  describe('Post Management', () => {
    let testUserId: number;

    beforeEach(async () => {
      // Create a test user for post operations
      const userData = {
        username: 'posttest' + Date.now(),
        fullName: 'Post Test User',
        phone: '790' + Date.now().toString().slice(-7),
        password: 'hashedpassword123',
        dateOfBirth: '1995-05-15',
        gender: 'MALE' as const,
        atoll: 'Male',
        island: 'Hulhumale',
        status: 'APPROVED' as const,
        coins: 100
      };

      const createdUser = await storage.createUser(userData);
      testUserId = createdUser.id;
      testUserIds.push(createdUser.id);
    });

    it('should create a new post', async () => {
      const postData = {
        userId: testUserId,
        title: 'Test Post',
        description: 'This is a test post',
        aboutYourself: 'About myself',
        lookingFor: 'Looking for someone special',
        relationshipType: 'SERIOUS_RELATIONSHIP' as const,
        status: 'PENDING' as const,
        preferences: {
          ageMin: 25,
          ageMax: 35
        }
      };

      const createdPost = await storage.createPost(postData);
      testPostIds.push(createdPost.id);

      expect(createdPost).toHaveProperty('id');
      expect(createdPost.title).toBe(postData.title);
      expect(createdPost.userId).toBe(testUserId);
      expect(createdPost.status).toBe('PENDING');
    });

    it('should get post by ID', async () => {
      const postData = {
        userId: testUserId,
        title: 'Get Test Post',
        description: 'This is a get test post',
        aboutYourself: 'About myself',
        lookingFor: 'Looking for someone special',
        relationshipType: 'SERIOUS_RELATIONSHIP' as const,
        status: 'APPROVED' as const,
        preferences: {}
      };

      const createdPost = await storage.createPost(postData);
      testPostIds.push(createdPost.id);

      const retrievedPost = await storage.getPost(createdPost.id);
      
      expect(retrievedPost).toBeDefined();
      expect(retrievedPost?.id).toBe(createdPost.id);
      expect(retrievedPost?.title).toBe(postData.title);
    });

    it('should get approved posts', async () => {
      const result = await storage.getApprovedPosts(10, 0);
      
      expect(result).toHaveProperty('posts');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.posts)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should update post data', async () => {
      const postData = {
        userId: testUserId,
        title: 'Update Test Post',
        description: 'This will be updated',
        aboutYourself: 'About myself',
        lookingFor: 'Looking for someone special',
        relationshipType: 'SERIOUS_RELATIONSHIP' as const,
        status: 'PENDING' as const,
        preferences: {}
      };

      const createdPost = await storage.createPost(postData);
      testPostIds.push(createdPost.id);

      const updateData = {
        title: 'Updated Post Title',
        status: 'APPROVED' as const
      };

      const updatedPost = await storage.updatePost(createdPost.id, updateData);
      
      expect(updatedPost).toBeDefined();
      expect(updatedPost?.title).toBe('Updated Post Title');
      expect(updatedPost?.status).toBe('APPROVED');
    });
  });

  describe('Coin System', () => {
    let testUserId: number;

    beforeEach(async () => {
      // Create a test user for coin operations
      const userData = {
        username: 'cointest' + Date.now(),
        fullName: 'Coin Test User',
        phone: '790' + Date.now().toString().slice(-7),
        password: 'hashedpassword123',
        dateOfBirth: '1995-05-15',
        gender: 'MALE' as const,
        atoll: 'Male',
        island: 'Hulhumale',
        status: 'APPROVED' as const,
        coins: 50
      };

      const createdUser = await storage.createUser(userData);
      testUserId = createdUser.id;
      testUserIds.push(createdUser.id);
    });

    it('should get user coin balance', async () => {
      const balance = await storage.getUserCoinBalance(testUserId);
      expect(typeof balance).toBe('number');
      expect(balance).toBe(50);
    });

    it('should update user coins', async () => {
      await storage.updateUserCoins(testUserId, 25);
      const newBalance = await storage.getUserCoinBalance(testUserId);
      expect(newBalance).toBe(75);
    });

    it('should deduct coins', async () => {
      await storage.deductCoins(testUserId, 10);
      const newBalance = await storage.getUserCoinBalance(testUserId);
      expect(newBalance).toBe(40);
    });

    it('should add coin ledger entry', async () => {
      const ledgerEntry = {
        userId: testUserId,
        amount: 25,
        type: 'CREDIT' as const,
        description: 'Test credit',
        relatedId: null,
        relatedType: null
      };

      await storage.addCoinLedgerEntry(ledgerEntry);
      const ledger = await storage.getCoinLedger(testUserId, 10);
      
      expect(Array.isArray(ledger)).toBe(true);
      expect(ledger.length).toBeGreaterThan(0);
      
      const entry = ledger.find(e => e.description === 'Test credit');
      expect(entry).toBeDefined();
      expect(entry?.amount).toBe(25);
    });
  });
});
