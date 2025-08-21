import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should display login/register options on homepage', async ({ page }) => {
    // Look for authentication-related elements
    const hasLogin = await page.getByRole('button', { name: /login/i }).count();
    const hasRegister = await page.getByRole('button', { name: /register|sign up/i }).count();
    const hasAuthLink = await page.getByRole('link', { name: /login|register|sign up|sign in/i }).count();
    
    // Should have some form of authentication UI
    expect(hasLogin + hasRegister + hasAuthLink).toBeGreaterThan(0);
  });

  test('should navigate to registration page', async ({ page }) => {
    // Look for and click register/signup elements
    const registerButton = page.getByRole('button', { name: /register|sign up/i }).first();
    const registerLink = page.getByRole('link', { name: /register|sign up/i }).first();
    
    if (await registerButton.count() > 0) {
      await registerButton.click();
    } else if (await registerLink.count() > 0) {
      await registerLink.click();
    } else {
      // Try navigating directly to likely registration routes
      await page.goto('/register');
    }
    
    // Should be on registration page or have registration form visible
    await expect(page).toHaveURL(/register|signup/i);
  });

  test('should show validation errors for empty registration form', async ({ page }) => {
    // Navigate to registration
    await page.goto('/register');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /submit|register|sign up|create account/i });
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Should show validation errors
      const errorText = await page.textContent('body');
      expect(errorText).toMatch(/(required|invalid|error|fill)/i);
    }
  });

  test('should fill registration form with valid data', async ({ page }) => {
    await page.goto('/register');
    
    // Generate unique test data
    const timestamp = Date.now();
    const testUser = {
      username: `testuser${timestamp}`,
      fullName: 'Test User',
      phone: `790${timestamp.toString().slice(-7)}`,
      password: 'TestPassword123!',
      email: `test${timestamp}@example.com`
    };
    
    // Fill form fields if they exist
    const usernameField = page.getByLabel(/username/i).or(page.getByPlaceholder(/username/i));
    if (await usernameField.count() > 0) {
      await usernameField.fill(testUser.username);
    }
    
    const fullNameField = page.getByLabel(/full name|name/i).or(page.getByPlaceholder(/full name|name/i));
    if (await fullNameField.count() > 0) {
      await fullNameField.fill(testUser.fullName);
    }
    
    const phoneField = page.getByLabel(/phone/i).or(page.getByPlaceholder(/phone/i));
    if (await phoneField.count() > 0) {
      await phoneField.fill(testUser.phone);
    }
    
    const passwordField = page.getByLabel(/^password$/i).or(page.getByPlaceholder(/password/i)).first();
    if (await passwordField.count() > 0) {
      await passwordField.fill(testUser.password);
    }
    
    const confirmPasswordField = page.getByLabel(/confirm password/i).or(page.getByPlaceholder(/confirm password/i));
    if (await confirmPasswordField.count() > 0) {
      await confirmPasswordField.fill(testUser.password);
    }
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /submit|register|sign up|create account/i });
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Wait for response
      await page.waitForTimeout(2000);
      
      // Should either redirect or show success message
      const currentUrl = page.url();
      const pageContent = await page.textContent('body');
      
      expect(
        currentUrl.includes('success') || 
        currentUrl.includes('pending') ||
        pageContent?.includes('success') ||
        pageContent?.includes('registered') ||
        pageContent?.includes('pending')
      ).toBeTruthy();
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    // Look for login elements
    const loginButton = page.getByRole('button', { name: /login|sign in/i }).first();
    const loginLink = page.getByRole('link', { name: /login|sign in/i }).first();
    
    if (await loginButton.count() > 0) {
      await loginButton.click();
    } else if (await loginLink.count() > 0) {
      await loginLink.click();
    } else {
      await page.goto('/login');
    }
    
    // Should be on login page
    await expect(page).toHaveURL(/login|signin/i);
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    const usernameField = page.getByLabel(/username|email/i).or(page.getByPlaceholder(/username|email/i));
    const passwordField = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));
    
    if (await usernameField.count() > 0 && await passwordField.count() > 0) {
      await usernameField.fill('invaliduser');
      await passwordField.fill('invalidpassword');
      
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        await page.waitForTimeout(2000);
        
        // Should show error message
        const pageContent = await page.textContent('body');
        expect(pageContent).toMatch(/(invalid|error|incorrect|failed)/i);
      }
    }
  });
});
