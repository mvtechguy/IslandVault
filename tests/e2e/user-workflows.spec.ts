import { test, expect, type Page, type BrowserContext } from '@playwright/test';

test.describe('User Registration and Authentication Workflow', () => {
  test('should complete full user registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill registration form
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="phone"]', '7123456');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.fill('[data-testid="confirmPassword"]', 'TestPassword123!');
    await page.fill('[data-testid="fullName"]', 'Test User');
    await page.selectOption('[data-testid="gender"]', 'male');
    await page.fill('[data-testid="dateOfBirth"]', '1990-01-01');
    await page.selectOption('[data-testid="atoll"]', 'Kaafu');
    await page.selectOption('[data-testid="island"]', 'Malé');
    await page.fill('[data-testid="job"]', 'Engineer');
    await page.selectOption('[data-testid="education"]', 'Bachelor');
    await page.fill('[data-testid="shortBio"]', 'Test bio for registration');
    
    // Submit registration
    await page.click('[data-testid="register-submit"]');
    
    // Should redirect to login or show success message
    await expect(page).toHaveURL(/\/(login|dashboard)/);
    
    // If redirected to login, verify success message
    if (page.url().includes('/login')) {
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    }
  });

  test('should handle registration validation errors', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('[data-testid="register-submit"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // Fill invalid data
    await page.fill('[data-testid="username"]', 'a'); // Too short
    await page.fill('[data-testid="phone"]', '123'); // Too short
    await page.fill('[data-testid="password"]', '123'); // Too weak
    await page.fill('[data-testid="confirmPassword"]', '456'); // Doesn't match
    
    await page.click('[data-testid="register-submit"]');
    
    // Should show specific validation errors
    await expect(page.locator('[data-testid="username-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="phone-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    
    // Submit login
    await page.click('[data-testid="login-submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Should show user info
    await expect(page.locator('[data-testid="user-welcome"]')).toBeVisible();
  });

  test('should handle login errors', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid credentials
    await page.fill('[data-testid="username"]', 'wronguser');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    
    await page.click('[data-testid="login-submit"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to home or login
    await expect(page).toHaveURL(/\/(|login)/);
  });
});

test.describe('Post Creation and Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new post', async ({ page }) => {
    // Navigate to create post
    await page.click('[data-testid="create-post-button"]');
    await expect(page).toHaveURL('/posts/create');
    
    // Fill post form
    await page.fill('[data-testid="post-title"]', 'Looking for a life partner');
    await page.fill('[data-testid="post-description"]', 'I am looking for someone who shares my values and interests.');
    
    // Fill preferences
    await page.selectOption('[data-testid="preferred-gender"]', 'female');
    await page.fill('[data-testid="preferred-age-min"]', '25');
    await page.fill('[data-testid="preferred-age-max"]', '35');
    await page.selectOption('[data-testid="preferred-education"]', 'Bachelor');
    await page.selectOption('[data-testid="relationship-type"]', 'marriage');
    
    // Submit post
    await page.click('[data-testid="create-post-submit"]');
    
    // Should redirect to posts list or show success
    await expect(page).toHaveURL(/\/posts/);
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should view and edit own posts', async ({ page }) => {
    // Navigate to my posts
    await page.click('[data-testid="my-posts-link"]');
    await expect(page).toHaveURL('/posts/my');
    
    // Should show user's posts
    await expect(page.locator('[data-testid="post-item"]')).toBeVisible();
    
    // Click edit on first post
    await page.locator('[data-testid="edit-post-button"]').first().click();
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/posts\/\d+\/edit/);
    
    // Edit post
    await page.fill('[data-testid="post-title"]', 'Updated post title');
    await page.click('[data-testid="update-post-submit"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should delete own post', async ({ page }) => {
    await page.goto('/posts/my');
    
    // Click delete on first post
    await page.locator('[data-testid="delete-post-button"]').first().click();
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('deleted');
  });

  test('should like and unlike posts', async ({ page }) => {
    await page.goto('/posts');
    
    // Click like on first post
    const likeButton = page.locator('[data-testid="like-button"]').first();
    await likeButton.click();
    
    // Should show liked state
    await expect(likeButton).toHaveClass(/liked/);
    
    // Click again to unlike
    await likeButton.click();
    
    // Should show unliked state
    await expect(likeButton).not.toHaveClass(/liked/);
  });
});

test.describe('Connection Request Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should send connection request', async ({ page }) => {
    // Navigate to posts
    await page.goto('/posts');
    
    // Click on a post to view details
    await page.locator('[data-testid="post-item"]').first().click();
    
    // Click connect button
    await page.click('[data-testid="connect-button"]');
    
    // Fill connection message
    await page.fill('[data-testid="connection-message"]', 'Hi, I would like to connect with you.');
    
    // Submit connection request
    await page.click('[data-testid="send-connection-request"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Connection request sent');
  });

  test('should view sent connection requests', async ({ page }) => {
    await page.goto('/connections/sent');
    
    // Should show sent requests
    await expect(page.locator('[data-testid="connection-request"]')).toBeVisible();
    
    // Should show request status
    await expect(page.locator('[data-testid="request-status"]')).toBeVisible();
  });

  test('should view and respond to received requests', async ({ page }) => {
    await page.goto('/connections/received');
    
    // Should show received requests
    await expect(page.locator('[data-testid="connection-request"]')).toBeVisible();
    
    // Approve first request
    await page.locator('[data-testid="approve-request"]').first().click();
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('approved');
  });
});

test.describe('Chat and Messaging Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should access chat inbox', async ({ page }) => {
    await page.goto('/chat');
    
    // Should show conversations list
    await expect(page.locator('[data-testid="conversations-list"]')).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    await page.goto('/chat');
    
    // Click on first conversation
    await page.locator('[data-testid="conversation-item"]').first().click();
    
    // Should show chat interface
    await expect(page.locator('[data-testid="chat-messages"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    
    // Send a message
    await page.fill('[data-testid="message-input"]', 'Hello, how are you?');
    await page.click('[data-testid="send-message"]');
    
    // Should show the sent message
    await expect(page.locator('[data-testid="message-item"]').last()).toContainText('Hello, how are you?');
  });
});

test.describe('Coin System Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should view coin balance', async ({ page }) => {
    await page.goto('/coins');
    
    // Should show current balance
    await expect(page.locator('[data-testid="coin-balance"]')).toBeVisible();
    
    // Should show coin packages
    await expect(page.locator('[data-testid="coin-packages"]')).toBeVisible();
  });

  test('should purchase coins', async ({ page }) => {
    await page.goto('/coins');
    
    // Select a coin package
    await page.locator('[data-testid="select-package"]').first().click();
    
    // Should show bank details
    await expect(page.locator('[data-testid="bank-details"]')).toBeVisible();
    
    // Upload payment slip (mock file upload)
    const fileInput = page.locator('[data-testid="slip-upload"]');
    await fileInput.setInputFiles({
      name: 'payment-slip.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Submit topup request
    await page.click('[data-testid="submit-topup"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Topup request submitted');
  });

  test('should view coin transaction history', async ({ page }) => {
    await page.goto('/coins/history');
    
    // Should show transaction ledger
    await expect(page.locator('[data-testid="coin-ledger"]')).toBeVisible();
    
    // Should show transaction items
    await expect(page.locator('[data-testid="transaction-item"]')).toBeVisible();
  });
});

test.describe('Profile Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should view and edit profile', async ({ page }) => {
    await page.goto('/profile');
    
    // Should show profile information
    await expect(page.locator('[data-testid="profile-info"]')).toBeVisible();
    
    // Click edit profile
    await page.click('[data-testid="edit-profile"]');
    
    // Should show edit form
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
    
    // Update profile information
    await page.fill('[data-testid="short-bio"]', 'Updated bio information');
    await page.click('[data-testid="save-profile"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  test('should manage privacy settings', async ({ page }) => {
    await page.goto('/profile/privacy');
    
    // Should show privacy options
    await expect(page.locator('[data-testid="privacy-settings"]')).toBeVisible();
    
    // Toggle real identity setting
    await page.click('[data-testid="use-real-identity"]');
    
    // Fill fake profile data
    await page.fill('[data-testid="fake-name"]', 'Anonymous User');
    await page.fill('[data-testid="fake-age"]', '30');
    
    // Save privacy settings
    await page.click('[data-testid="save-privacy"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });
});

test.describe('Search and Filter Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser123');
    await page.fill('[data-testid="password"]', 'TestPassword123!');
    await page.click('[data-testid="login-submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should search posts with filters', async ({ page }) => {
    await page.goto('/posts');
    
    // Open search filters
    await page.click('[data-testid="search-filters"]');
    
    // Apply filters
    await page.selectOption('[data-testid="filter-gender"]', 'female');
    await page.fill('[data-testid="filter-age-min"]', '25');
    await page.fill('[data-testid="filter-age-max"]', '35');
    await page.selectOption('[data-testid="filter-atoll"]', 'Kaafu');
    
    // Apply search
    await page.click('[data-testid="apply-filters"]');
    
    // Should show filtered results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Should show filter indicators
    await expect(page.locator('[data-testid="active-filters"]')).toBeVisible();
  });

  test('should search with text query', async ({ page }) => {
    await page.goto('/posts');
    
    // Enter search query
    await page.fill('[data-testid="search-input"]', 'engineer');
    await page.click('[data-testid="search-button"]');
    
    // Should show search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // Results should contain search term
    await expect(page.locator('[data-testid="post-item"]').first()).toContainText('engineer');
  });
});

test.describe('Responsive Design and Mobile Workflow', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Should hide desktop navigation
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    // Should adapt layout for tablet
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    
    // Navigation should be appropriate for tablet
    const nav = page.locator('[data-testid="navigation"]');
    await expect(nav).toBeVisible();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    await page.goto('/posts');
    
    // Should show offline message
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible();
    
    // Restore online mode
    await page.context().setOffline(false);
    
    // Should recover when back online
    await page.reload();
    await expect(page.locator('[data-testid="posts-list"]')).toBeVisible();
  });

  test('should handle 404 errors', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page
    await expect(page.locator('[data-testid="not-found"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('404');
  });

  test('should handle unauthorized access', async ({ page }) => {
    // Try to access protected page without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Should show login required message
    await expect(page.locator('[data-testid="login-required"]')).toBeVisible();
  });
});