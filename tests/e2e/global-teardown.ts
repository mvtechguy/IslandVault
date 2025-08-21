import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');
  
  try {
    // Clean up test data if needed
    await cleanupTestData();
    
    // Any other cleanup tasks
    console.log('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...');
  
  // You can add test data cleanup here
  // For example, removing test users, posts, etc.
  
  console.log('✅ Test data cleanup completed');
}

export default globalTeardown;