import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Admin API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('Admin User Management', () => {
    it('should require admin authentication for user queues', async () => {
      const response = await request(app)
        .get('/api/admin/queues/users/pending')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin authentication for user approval', async () => {
      const response = await request(app)
        .post('/api/admin/users/1/approve')
        .send({ adminNote: 'Approved for testing' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin authentication for user rejection', async () => {
      const response = await request(app)
        .post('/api/admin/users/1/reject')
        .send({ adminNote: 'Rejected for testing', reason: 'Invalid profile' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin Post Management', () => {
    it('should require admin authentication for post queues', async () => {
      const response = await request(app)
        .get('/api/admin/queues/posts/pending')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin authentication for post approval', async () => {
      const response = await request(app)
        .post('/api/admin/posts/1/approve')
        .send({ adminNote: 'Post approved' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin Coin Management', () => {
    it('should require admin authentication for topup queues', async () => {
      const response = await request(app)
        .get('/api/admin/queues/topups/pending')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin authentication for topup approval', async () => {
      const response = await request(app)
        .post('/api/admin/topups/1/approve')
        .send({ adminNote: 'Payment verified' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin Settings', () => {
    it('should require admin authentication for settings access', async () => {
      const response = await request(app)
        .get('/api/admin/settings')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin authentication for settings update', async () => {
      const settingsData = {
        coinPriceMvr: '15.00',
        costPost: 3,
        costConnect: 6
      };

      const response = await request(app)
        .put('/api/admin/settings')
        .send(settingsData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin Package Management', () => {
    it('should require admin authentication for package management', async () => {
      const response = await request(app)
        .get('/api/admin/packages')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin authentication for creating packages', async () => {
      const packageData = {
        name: 'Test Package',
        coins: 100,
        price: '50.00',
        isActive: true
      };

      const response = await request(app)
        .post('/api/admin/packages')
        .send(packageData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Admin Banner Management', () => {
    it('should require admin authentication for banner management', async () => {
      const response = await request(app)
        .get('/api/admin/banners')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should require admin authentication for creating banners', async () => {
      const bannerData = {
        title: 'Test Banner',
        content: 'Test content',
        type: 'PROMOTION',
        status: 'ACTIVE'
      };

      const response = await request(app)
        .post('/api/admin/banners')
        .send(bannerData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
