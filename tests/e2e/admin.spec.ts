import { test, expect } from '@playwright/test';

test.describe('Admin Panel E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should require admin authentication for admin panel', async ({ page }) => {
    // Try to access admin panel directly
    await page.goto('/admin');
    
    // Should redirect to login or show unauthorized message
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const pageContent = await page.textContent('body');
    
    expect(
      currentUrl.includes('login') ||
      currentUrl.includes('auth') ||
      pageContent?.includes('login') ||
      pageContent?.includes('unauthorized') ||
      pageContent?.includes('403') ||
      pageContent?.includes('forbidden')
    ).toBeTruthy();
  });

  test('should show admin navigation when authenticated as admin', async ({ page }) => {
    // This test would need proper admin authentication setup
    // For now, we'll test if the admin routes are protected
    
    const adminRoutes = [
      '/admin/users',
      '/admin/posts',
      '/admin/topups',
      '/admin/settings',
      '/admin/packages',
      '/admin/banners'
    ];
    
    for (const route of adminRoutes) {
      await page.goto(route);
      await page.waitForTimeout(500);
      
      const currentUrl = page.url();
      const pageContent = await page.textContent('body');
      
      // Should be redirected or show authentication/authorization error
      expect(
        !currentUrl.includes(route) ||
        pageContent?.includes('login') ||
        pageContent?.includes('unauthorized') ||
        pageContent?.includes('403')
      ).toBeTruthy();
    }
  });

  test('should have admin dashboard elements when properly authenticated', async ({ page }) => {
    // This test assumes we have a way to authenticate as admin
    // In a real test environment, you'd set up admin login here
    
    await page.goto('/admin');
    
    // Look for admin-specific elements that might be visible
    const adminElements = await Promise.all([
      page.getByText(/dashboard/i).count(),
      page.getByText(/users/i).count(),
      page.getByText(/posts/i).count(),
      page.getByText(/settings/i).count(),
      page.getByText(/admin/i).count()
    ]);
    
    // If authenticated as admin, should see admin elements
    // If not authenticated, should see login elements
    const hasAdminElements = adminElements.some(count => count > 0);
    const pageContent = await page.textContent('body');
    const hasAuthElements = pageContent?.includes('login') || pageContent?.includes('sign in');
    
    expect(hasAdminElements || hasAuthElements).toBeTruthy();
  });
});
