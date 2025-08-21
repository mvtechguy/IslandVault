import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Authentication API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('POST /api/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser123',
        fullName: 'Test User',
        phone: '7901234567',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        dateOfBirth: '1995-05-15',
        gender: 'MALE',
        atoll: 'Male',
        island: 'Hulhumale',
        profileImage: null,
        bio: 'Test bio for testing',
        interests: ['technology', 'travel'],
        occupation: 'Software Developer',
        education: 'Bachelor\'s Degree',
        height: '175',
        religiosity: 'MODERATE',
        smokingStatus: 'NON_SMOKER',
        relationshipGoal: 'SERIOUS_RELATIONSHIP',
        hasChildren: false,
        wantsChildren: true,
        languages: ['Dhivehi', 'English']
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.status).toBe('PENDING');
    });

    it('should reject registration with invalid data', async () => {
      const invalidUserData = {
        username: '', // Empty username
        password: '123', // Too short password
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/register')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject duplicate usernames', async () => {
      const userData = {
        username: 'duplicatetest',
        fullName: 'Test User',
        phone: '7901234568',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        dateOfBirth: '1995-05-15',
        gender: 'MALE',
        atoll: 'Male',
        island: 'Hulhumale'
      };

      // Register first user
      await request(app)
        .post('/api/register')
        .send(userData)
        .expect(201);

      // Try to register with same username
      const duplicateData = { ...userData, phone: '7901234569' };
      const response = await request(app)
        .post('/api/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.message).toContain('username');
    });
  });

  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        username: 'logintest',
        fullName: 'Login Test',
        phone: '7901234570',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        dateOfBirth: '1995-05-15',
        gender: 'MALE',
        atoll: 'Male',
        island: 'Hulhumale'
      };

      await request(app)
        .post('/api/register')
        .send(userData);

      // Now test login
      const loginData = {
        username: userData.username,
        password: userData.password
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe(userData.username);
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/me', () => {
    it('should return user profile when authenticated', async () => {
      // This test requires authentication setup
      // You'll need to implement proper session handling for tests
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
