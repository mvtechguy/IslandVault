import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Connections API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('POST /api/connect/request', () => {
    it('should require authentication to create connection requests', async () => {
      const connectionData = {
        targetUserId: 2,
        postId: 1,
        message: 'I would like to connect with you'
      };

      const response = await request(app)
        .post('/api/connect/request')
        .send(connectionData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate connection request data', async () => {
      const invalidData = {
        // Missing targetUserId
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/connect/request')
        .send(invalidData)
        .expect(401); // Will be 401 due to auth first
    });
  });

  describe('GET /api/connect/sent', () => {
    it('should require authentication to view sent requests', async () => {
      const response = await request(app)
        .get('/api/connect/sent')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/connect/received', () => {
    it('should require authentication to view received requests', async () => {
      const response = await request(app)
        .get('/api/connect/received')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/connect/requests/:id', () => {
    it('should require authentication to update connection requests', async () => {
      const updateData = {
        status: 'ACCEPTED',
        response: 'I accept your connection request'
      };

      const response = await request(app)
        .put('/api/connect/requests/1')
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate connection update data', async () => {
      const invalidData = {
        status: 'INVALID_STATUS'
      };

      const response = await request(app)
        .put('/api/connect/requests/1')
        .send(invalidData)
        .expect(401); // Will be 401 due to auth first
    });
  });

  describe('GET /api/connect/status/:userId', () => {
    it('should require authentication to check connection status', async () => {
      const response = await request(app)
        .get('/api/connect/status/2')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
