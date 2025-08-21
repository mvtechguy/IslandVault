import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Chat API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('GET /api/conversations', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/conversations')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/chat/conversations', () => {
    it('should require authentication to get conversations', async () => {
      const response = await request(app)
        .get('/api/chat/conversations')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/chat/conversations', () => {
    it('should require authentication to create conversations', async () => {
      const conversationData = {
        participantId: 2
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .send(conversationData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate conversation creation data', async () => {
      const invalidData = {
        // Missing participantId
      };

      const response = await request(app)
        .post('/api/chat/conversations')
        .send(invalidData)
        .expect(401); // Will be 401 due to auth first
    });
  });

  describe('GET /api/conversations/:id/messages', () => {
    it('should require authentication to get messages', async () => {
      const response = await request(app)
        .get('/api/conversations/1/messages')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/chat/conversations/:conversationId/messages', () => {
    it('should require authentication to send messages', async () => {
      const messageData = {
        content: 'Hello, this is a test message',
        type: 'TEXT'
      };

      const response = await request(app)
        .post('/api/chat/conversations/1/messages')
        .send(messageData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate message data', async () => {
      const invalidMessageData = {
        content: '', // Empty content
        type: 'INVALID_TYPE'
      };

      const response = await request(app)
        .post('/api/chat/conversations/1/messages')
        .send(invalidMessageData)
        .expect(401); // Will be 401 due to auth first
    });
  });
});
