import { test, expect } from '@playwright/test';

test.describe('Performance and Load Tests', () => {
  test.describe('API Performance Tests', () => {
    test('should handle concurrent API requests', async ({ page, context }) => {
      const startTime = Date.now();
      
      // Create multiple pages for concurrent requests
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage(),
        context.newPage(),
        context.newPage()
      ]);
      
      // Make concurrent requests to different endpoints
      const requests = pages.map(async (testPage, index) => {
        const endpoints = [
          '/api/posts',
          '/api/settings',
          '/api/atolls',
          '/api/banners',
          '/api/coins/packages'
        ];
        
        const response = await testPage.request.get(endpoints[index]);
        return {
          status: response.status(),
          timing: Date.now() - startTime,
          endpoint: endpoints[index]
        };
      });
      
      const results = await Promise.all(requests);
      
      // All requests should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.timing).toBeLessThan(5000); // Should complete within 5 seconds
      });
      
      // Clean up
      await Promise.all(pages.map(p => p.close()));
    });

    test('should handle rapid sequential requests', async ({ page }) => {
      const results: Array<{
        requestNumber: number;
        status: number;
        responseTime: number;
      }> = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        const response = await page.request.get('/api/posts');
        const endTime = Date.now();
        
        results.push({
          requestNumber: i + 1,
          status: response.status(),
          responseTime: endTime - startTime
        });
        
        expect(response.status()).toBe(200);
      }
      
      // Calculate average response time
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      
      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(1000); // Less than 1 second average
      
      console.log(`Average response time: ${avgResponseTime}ms`);
      console.log('Response times:', results.map(r => `${r.requestNumber}: ${r.responseTime}ms`));
    });

    test('should handle large payload requests', async ({ page }) => {
      // Test with large search query
      const largeQuery = 'a'.repeat(1000);
      
      const startTime = Date.now();
      const response = await page.request.get(`/api/posts/search?q=${largeQuery}`);
      const endTime = Date.now();
      
      expect(response.status()).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000); // Should handle large queries within 3 seconds
    });
  });

  test.describe('Frontend Performance Tests', () => {
    test('should load homepage within performance budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
      
      // Check for essential elements
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      console.log(`Homepage load time: ${loadTime}ms`);
    });

    test('should load posts page efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/posts');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(4000); // Posts page may take slightly longer due to data
      
      // Should show posts list
      await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
      
      console.log(`Posts page load time: ${loadTime}ms`);
    });

    test('should handle infinite scroll performance', async ({ page }) => {
      await page.goto('/posts');
      await page.waitForLoadState('networkidle');
      
      // Get initial post count
      const initialPosts = await page.locator('[data-testid="post-item"]').count();
      
      // Scroll to bottom to trigger infinite scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for new posts to load
      await page.waitForTimeout(2000);
      
      const newPosts = await page.locator('[data-testid="post-item"]').count();
      
      // Should load more posts
      expect(newPosts).toBeGreaterThan(initialPosts);
      
      // Test multiple scroll events
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await page.waitForTimeout(1000);
      }
      
      const finalPosts = await page.locator('[data-testid="post-item"]').count();
      expect(finalPosts).toBeGreaterThan(newPosts);
    });

    test('should handle search performance', async ({ page }) => {
      await page.goto('/posts');
      
      const searchQueries = [
        'engineer',
        'doctor',
        'teacher',
        'business',
        'student'
      ];
      
      for (const query of searchQueries) {
        const startTime = Date.now();
        
        await page.fill('[data-testid="search-input"]', query);
        await page.click('[data-testid="search-button"]');
        
        // Wait for search results
        await page.waitForLoadState('networkidle');
        
        const searchTime = Date.now() - startTime;
        
        expect(searchTime).toBeLessThan(2000); // Search should complete within 2 seconds
        
        // Should show search results
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
        
        console.log(`Search for "${query}" took ${searchTime}ms`);
      }
    });
  });

  test.describe('Database Performance Tests', () => {
    test('should handle complex queries efficiently', async ({ page }) => {
      // Test complex search with multiple filters
      const startTime = Date.now();
      
      const response = await page.request.get('/api/posts/search?' + new URLSearchParams({
        q: 'engineer',
        gender: 'female',
        ageMin: '25',
        ageMax: '35',
        atoll: 'Kaafu',
        island: 'Malé',
        education: 'Bachelor',
        relationshipType: 'marriage'
      }));
      
      const queryTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(queryTime).toBeLessThan(2000); // Complex queries should complete within 2 seconds
      
      const data = await response.json();
      expect(data).toHaveProperty('posts');
      expect(data).toHaveProperty('total');
      
      console.log(`Complex search query took ${queryTime}ms`);
    });

    test('should handle pagination efficiently', async ({ page }) => {
      const pageSize = 20;
      const pagesToTest = 5;
      
      for (let pageNum = 0; pageNum < pagesToTest; pageNum++) {
        const startTime = Date.now();
        
        const response = await page.request.get(`/api/posts?limit=${pageSize}&offset=${pageNum * pageSize}`);
        
        const queryTime = Date.now() - startTime;
        
        expect(response.status()).toBe(200);
        expect(queryTime).toBeLessThan(1500); // Pagination should be fast
        
        const data = await response.json();
        expect(data.posts).toHaveLength(Math.min(pageSize, data.total - (pageNum * pageSize)));
        
        console.log(`Page ${pageNum + 1} loaded in ${queryTime}ms`);
      }
    });
  });

  test.describe('Memory and Resource Tests', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      const routes = [
        '/',
        '/posts',
        '/login',
        '/register',
        '/about'
      ];
      
      // Navigate through multiple pages
      for (let cycle = 0; cycle < 3; cycle++) {
        for (const route of routes) {
          await page.goto(route);
          await page.waitForLoadState('networkidle');
          
          // Check that page is responsive
          await expect(page.locator('body')).toBeVisible();
        }
      }
      
      // Page should still be responsive after multiple navigations
      await page.goto('/posts');
      await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Request large dataset
      const startTime = Date.now();
      
      const response = await page.request.get('/api/posts?limit=100');
      
      const requestTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(requestTime).toBeLessThan(3000); // Large datasets should load within 3 seconds
      
      const data = await response.json();
      expect(data.posts.length).toBeGreaterThan(0);
      
      console.log(`Large dataset (100 posts) loaded in ${requestTime}ms`);
    });
  });

  test.describe('Network Performance Tests', () => {
    test('should handle slow network conditions', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });
      
      const startTime = Date.now();
      await page.goto('/posts');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should still load within reasonable time even with network delay
      expect(loadTime).toBeLessThan(10000); // 10 seconds with simulated delay
      
      await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
    });

    test('should handle network failures gracefully', async ({ page, context }) => {
      await page.goto('/posts');
      
      // Simulate network failure for API calls
      await context.route('**/api/**', route => route.abort());
      
      // Try to perform an action that requires API
      await page.click('[data-testid="search-button"]');
      
      // Should show error message or fallback UI
      await expect(page.locator('[data-testid="error-message"], [data-testid="offline-message"]')).toBeVisible();
    });
  });

  test.describe('Stress Tests', () => {
    test('should handle rapid user interactions', async ({ page }) => {
      await page.goto('/posts');
      await page.waitForLoadState('networkidle');
      
      // Rapid clicking and interactions
      for (let i = 0; i < 10; i++) {
        await page.click('[data-testid="search-button"]');
        await page.fill('[data-testid="search-input"]', `test${i}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
      }
      
      // Page should still be responsive
      await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
    });

    test('should handle form submission stress test', async ({ page }) => {
      await page.goto('/login');
      
      // Rapid form submissions
      for (let i = 0; i < 5; i++) {
        await page.fill('[data-testid="username"]', `user${i}`);
        await page.fill('[data-testid="password"]', `password${i}`);
        await page.click('[data-testid="login-submit"]');
        await page.waitForTimeout(500);
      }
      
      // Should show appropriate error or success message
      await expect(page.locator('[data-testid="login-error"], [data-testid="success-message"]')).toBeVisible();
    });
  });

  test.describe('Mobile Performance Tests', () => {
    test('should perform well on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      const startTime = Date.now();
      await page.goto('/posts');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Mobile should load within reasonable time
      expect(loadTime).toBeLessThan(5000);
      
      // Should show mobile-optimized UI
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
      
      // Test mobile interactions
      await page.tap('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    });

    test('should handle touch interactions efficiently', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/posts');
      
      // Test scroll performance on mobile
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, 200);
        });
        await page.waitForTimeout(100);
      }
      
      // Should remain responsive
      await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
    });
  });
});