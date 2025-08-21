import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  // Create a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle' });
    
    // Check if the app is responding
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Application is ready');
    
    // Create test users if needed
    await setupTestData(page);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

async function setupTestData(page: any) {
  console.log('📝 Setting up test data...');
  
  // You can add test data setup here
  // For example, creating test users, posts, etc.
  
  console.log('✅ Test data setup completed');
}

export default globalSetup;