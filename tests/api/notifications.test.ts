import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Notifications API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('GET /api/notifications', () => {
    it('should require authentication to get notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /api/notifications/:id/seen', () => {
    it('should require authentication to mark notifications as seen', async () => {
      const response = await request(app)
        .patch('/api/notifications/1/seen')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/notifications/:id/mark-seen', () => {
    it('should require authentication to mark specific notifications as seen', async () => {
      const response = await request(app)
        .post('/api/notifications/1/mark-seen')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/notifications/mark-all-seen', () => {
    it('should require authentication to mark all notifications as seen', async () => {
      const response = await request(app)
        .post('/api/notifications/mark-all-seen')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should require authentication to delete notifications', async () => {
      const response = await request(app)
        .delete('/api/notifications/1')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
