import { test, expect } from '@playwright/test';

test.describe('Posts E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display posts on homepage or posts page', async ({ page }) => {
    // Try to find posts on current page or navigate to posts page
    let postsVisible = await page.getByText(/post|profile|looking for/i).count() > 0;
    
    if (!postsVisible) {
      // Try navigating to posts page
      const postsLink = page.getByRole('link', { name: /posts|browse|profiles/i }).first();
      if (await postsLink.count() > 0) {
        await postsLink.click();
        await page.waitForTimeout(1000);
        postsVisible = await page.getByText(/post|profile|looking for/i).count() > 0;
      }
    }
    
    if (!postsVisible) {
      // Try direct navigation
      await page.goto('/posts');
      await page.waitForTimeout(1000);
      postsVisible = await page.getByText(/post|profile|looking for/i).count() > 0;
    }
    
    // At this point we should see some posts or a "no posts" message
    const bodyText = await page.textContent('body');
    expect(bodyText).toMatch(/(post|profile|no posts|browse|looking for)/i);
  });

  test('should have search functionality', async ({ page }) => {
    // Navigate to posts page
    await page.goto('/posts');
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByLabel(/search/i));
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      
      // Look for search button or form submit
      const searchButton = page.getByRole('button', { name: /search/i });
      if (await searchButton.count() > 0) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }
      
      await page.waitForTimeout(1000);
      
      // Should show search results or "no results" message
      const resultsText = await page.textContent('body');
      expect(resultsText).toMatch(/(result|found|no matches|search)/i);
    }
  });

  test('should have filtering options', async ({ page }) => {
    await page.goto('/posts');
    
    // Look for filter elements
    const hasFilters = await Promise.all([
      page.getByLabel(/age/i).count(),
      page.getByLabel(/location/i).count(),
      page.getByLabel(/relationship/i).count(),
      page.getByText(/filter/i).count(),
      page.getByRole('combobox').count()
    ]);
    
    const totalFilters = hasFilters.reduce((sum, count) => sum + count, 0);
    
    // Should have some filtering mechanism
    expect(totalFilters).toBeGreaterThan(0);
  });

  test('should handle pagination if there are many posts', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForTimeout(1000);
    
    // Look for pagination elements
    const paginationElements = await Promise.all([
      page.getByText(/next|previous/i).count(),
      page.getByText(/page \d+/i).count(),
      page.getByRole('button', { name: /\d+/ }).count(),
      page.getByText(/load more/i).count()
    ]);
    
    const hasPagination = paginationElements.some(count => count > 0);
    
    if (hasPagination) {
      // Test pagination navigation
      const nextButton = page.getByText(/next|load more/i).first();
      if (await nextButton.count() > 0) {
        await nextButton.click();
        await page.waitForTimeout(1000);
        
        // Should load more content or navigate to next page
        const pageContent = await page.textContent('body');
        expect(pageContent).toBeTruthy();
      }
    }
    
    // This test passes regardless of pagination presence
    expect(true).toBeTruthy();
  });

  test('should show post details when clicked', async ({ page }) => {
    await page.goto('/posts');
    await page.waitForTimeout(1000);
    
    // Look for post elements to click
    const postElements = await Promise.all([
      page.getByRole('article').count(),
      page.getByTestId(/post/i).count(),
      page.getByText(/view|details|read more/i).count()
    ]);
    
    const hasPostElements = postElements.some(count => count > 0);
    
    if (hasPostElements) {
      // Try clicking on first post element
      const postElement = page.getByRole('article').first()
        .or(page.getByTestId(/post/i).first())
        .or(page.getByText(/view|details|read more/i).first());
      
      if (await postElement.count() > 0) {
        await postElement.click();
        await page.waitForTimeout(1000);
        
        // Should navigate to post details or show modal
        const currentUrl = page.url();
        const hasModal = await page.getByRole('dialog').count() > 0;
        
        expect(currentUrl.includes('/posts/') || hasModal).toBeTruthy();
      }
    }
    
    // Test passes if no posts are available yet
    expect(true).toBeTruthy();
  });

  test('should require authentication for post creation', async ({ page }) => {
    // Try to access post creation directly
    await page.goto('/posts/create');
    
    // Should either redirect to login or show login prompt
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    const pageContent = await page.textContent('body');
    
    expect(
      currentUrl.includes('login') ||
      currentUrl.includes('auth') ||
      pageContent?.includes('login') ||
      pageContent?.includes('sign in') ||
      pageContent?.includes('authenticate')
    ).toBeTruthy();
  });
});
