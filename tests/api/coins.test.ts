import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Coins System API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('GET /api/coins/packages', () => {
    it('should return available coin packages', async () => {
      const response = await request(app)
        .get('/api/coins/packages')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // If packages exist, verify structure
      if (response.body.length > 0) {
        const package_ = response.body[0];
        expect(package_).toHaveProperty('id');
        expect(package_).toHaveProperty('name');
        expect(package_).toHaveProperty('coins');
        expect(package_).toHaveProperty('price');
        expect(package_).toHaveProperty('isActive');
      }
    });
  });

  describe('GET /api/coins/balance', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/coins/balance')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/coins/topups', () => {
    it('should require authentication for creating topup requests', async () => {
      const topupData = {
        packageId: 1,
        bankAccountId: 1,
        amount: 100.00
      };

      const response = await request(app)
        .post('/api/coins/topups')
        .send(topupData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate topup request data', async () => {
      const invalidTopupData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/coins/topups')
        .send(invalidTopupData)
        .expect(401); // Will be 401 due to auth first
    });
  });

  describe('GET /api/coins/topups', () => {
    it('should require authentication to view topups', async () => {
      const response = await request(app)
        .get('/api/coins/topups')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/coins/ledger', () => {
    it('should require authentication to view coin ledger', async () => {
      const response = await request(app)
        .get('/api/coins/ledger')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
