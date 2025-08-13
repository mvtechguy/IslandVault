import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { setupAuth } from './auth';
import { storage } from './storage';
import { telegramService } from './telegram';

// Mock dependencies
vi.mock('./storage', () => ({
  storage: {
    getUserByUsername: vi.fn(),
    getUserByPhone: vi.fn(),
    createUser: vi.fn(),
  },
}));

vi.mock('./telegram', () => ({
  telegramService: {
    notifyAdminNewUser: vi.fn(),
  },
}));

// Mock passport to avoid real session logic in tests
vi.mock('passport', async (importOriginal) => {
  const actual = await importOriginal();
  const passportMock = {
    ...actual,
    initialize: () => (req, res, next) => next(),
    session: () => (req, res, next) => next(),
    authenticate: () => (req, res, next) => next(),
    use: vi.fn(),
    serializeUser: vi.fn(),
    deserializeUser: vi.fn(),
  };
  return {
    ...actual,
    default: passportMock,
  }
});


describe('Auth Routes', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    // A mock implementation of req.login for testing purposes
    app.use((req: any, res, next) => {
      req.login = vi.fn((user, done) => done());
      next();
    });
    setupAuth(app);
  });

  describe('POST /api/register', () => {
    const validUserData = {
      username: 'testuser',
      phone: '7771234',
      password: 'password123',
      confirmPassword: 'password123',
      fullName: 'Test User',
      gender: 'male',
      dateOfBirth: '1990-01-15',
      island: 'Malé',
      atoll: 'Kaafu',
    };

    it('should register a new user successfully with valid data', async () => {
      // Arrange
      (storage.getUserByUsername as vi.Mock).mockResolvedValue(null);
      (storage.getUserByPhone as vi.Mock).mockResolvedValue(null);
      (storage.createUser as vi.Mock).mockResolvedValue({ id: 1, ...validUserData, password: 'hashedpassword' });
      (telegramService.notifyAdminNewUser as vi.Mock).mockResolvedValue(undefined);

      // Act
      const res = await request(app)
        .post('/api/register')
        .send(validUserData);

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.username).toBe(validUserData.username);
      expect(res.body.password).toBeUndefined(); // Ensure password is not returned
      expect(storage.createUser).toHaveBeenCalledTimes(1);
      expect(telegramService.notifyAdminNewUser).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if username already exists', async () => {
      // Arrange
      (storage.getUserByUsername as vi.Mock).mockResolvedValue({ id: 1, username: 'testuser' });

      // Act
      const res = await request(app)
        .post('/api/register')
        .send(validUserData);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Username already exists');
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 if phone number already exists', async () => {
      // Arrange
      (storage.getUserByUsername as vi.Mock).mockResolvedValue(null);
      (storage.getUserByPhone as vi.Mock).mockResolvedValue({ id: 2, phone: '7771234' });

      // Act
      const res = await request(app)
        .post('/api/register')
        .send(validUserData);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Phone number already exists');
      expect(storage.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid data (e.g., mismatched passwords)', async () => {
      // Arrange
      const invalidUserData = { ...validUserData, confirmPassword: 'wrongpassword' };

      // Act
      const res = await request(app)
        .post('/api/register')
        .send(invalidUserData);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid registration data');
      expect(res.body.errors).toBeInstanceOf(Array);
      expect(res.body.errors[0].message).toBe("Passwords don't match");
    });

    it('should return 400 for missing required fields (e.g., fullName)', async () => {
      // Arrange
      const invalidUserData = { ...validUserData };
      delete invalidUserData.fullName;

      // Act
      const res = await request(app)
        .post('/api/register')
        .send(invalidUserData);

      // Assert
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid registration data');
      expect(res.body.errors).toBeInstanceOf(Array);
      expect(res.body.errors[0].path[0]).toBe('fullName');
    });
  });
});
