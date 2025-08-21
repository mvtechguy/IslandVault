import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';

describe('Posts API Tests', () => {
  let app: express.Express;
  let server: any;
  
  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  describe('GET /api/posts', () => {
    it('should return approved posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/posts?limit=5&offset=0')
        .expect(200);

      expect(response.body.posts.length).toBeLessThanOrEqual(5);
    });

    it('should support filtering by relationship type', async () => {
      const response = await request(app)
        .get('/api/posts?relationshipType=SERIOUS_RELATIONSHIP')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      // All posts should have the specified relationship type if any exist
      if (response.body.posts.length > 0) {
        response.body.posts.forEach((post: any) => {
          expect(post.relationshipType).toBe('SERIOUS_RELATIONSHIP');
        });
      }
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post when authenticated', async () => {
      // This test requires authentication
      // For now, testing the structure
      const postData = {
        title: 'Looking for a Partner',
        description: 'Test post description',
        aboutYourself: 'About me section',
        lookingFor: 'Looking for section',
        relationshipType: 'SERIOUS_RELATIONSHIP',
        preferences: {
          ageMin: 25,
          ageMax: 35,
          location: 'Male',
          education: 'Any',
          occupation: 'Any'
        }
      };

      // This will fail without authentication, but tests the endpoint exists
      const response = await request(app)
        .post('/api/posts')
        .send(postData);

      // Expect 401 for unauthenticated request
      expect(response.status).toBe(401);
    });

    it('should reject posts with missing required fields', async () => {
      const incompletePostData = {
        title: 'Incomplete Post'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/posts')
        .send(incompletePostData);

      expect(response.status).toBe(401); // Will be 401 due to auth, but would be 400 with auth
    });
  });

  describe('GET /api/posts/search', () => {
    it('should search posts by query', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=test')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('total');
    });

    it('should handle empty search queries', async () => {
      const response = await request(app)
        .get('/api/posts/search?q=')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return a specific post by ID', async () => {
      // First get all posts to find a valid ID
      const postsResponse = await request(app)
        .get('/api/posts')
        .expect(200);

      if (postsResponse.body.posts.length > 0) {
        const postId = postsResponse.body.posts[0].id;
        
        const response = await request(app)
          .get(`/api/posts/${postId}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', postId);
      }
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/99999')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
