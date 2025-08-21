#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Kaiveni App
 * This script runs different types of tests based on the provided arguments
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = '') {
  console.log(`${color}${message}${COLORS.reset}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`\n${COLORS.blue}Running: ${command} ${args.join(' ')}${COLORS.reset}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runApiTests() {
  log('\n🧪 Running API Tests with Vitest...', COLORS.cyan);
  try {
    await runCommand('npx', ['vitest', 'run', 'tests/api']);
    log('✅ API tests completed successfully', COLORS.green);
  } catch (error) {
    log('❌ API tests failed', COLORS.red);
    throw error;
  }
}

async function runDatabaseTests() {
  log('\n🗄️  Running Database Tests...', COLORS.cyan);
  try {
    await runCommand('npx', ['vitest', 'run', 'tests/database']);
    log('✅ Database tests completed successfully', COLORS.green);
  } catch (error) {
    log('❌ Database tests failed', COLORS.red);
    throw error;
  }
}

async function runIntegrationTests() {
  log('\n🔧 Running Integration Tests...', COLORS.cyan);
  try {
    await runCommand('npx', ['vitest', 'run', 'tests/integration']);
    log('✅ Integration tests completed successfully', COLORS.green);
  } catch (error) {
    log('❌ Integration tests failed', COLORS.red);
    throw error;
  }
}

async function runE2ETests() {
  log('\n🌐 Running E2E Tests with Playwright...', COLORS.cyan);
  try {
    await runCommand('npx', ['playwright', 'test']);
    log('✅ E2E tests completed successfully', COLORS.green);
  } catch (error) {
    log('❌ E2E tests failed', COLORS.red);
    throw error;
  }
}

async function runAllTests() {
  log('\n🚀 Running Full Test Suite...', COLORS.magenta);
  
  const testSuites = [
    { name: 'API Tests', fn: runApiTests },
    { name: 'Database Tests', fn: runDatabaseTests },
    { name: 'Integration Tests', fn: runIntegrationTests },
    { name: 'E2E Tests', fn: runE2ETests }
  ];
  
  const results = [];
  
  for (const suite of testSuites) {
    try {
      await suite.fn();
      results.push({ name: suite.name, status: 'PASSED' });
    } catch (error) {
      results.push({ name: suite.name, status: 'FAILED', error });
      log(`⚠️  ${suite.name} failed, continuing with next suite...`, COLORS.yellow);
    }
  }
  
  // Print summary
  log('\n📊 Test Results Summary:', COLORS.bright);
  log('========================', COLORS.bright);
  
  results.forEach(result => {
    const status = result.status === 'PASSED' 
      ? `${COLORS.green}✅ PASSED${COLORS.reset}`
      : `${COLORS.red}❌ FAILED${COLORS.reset}`;
    log(`${result.name}: ${status}`);
  });
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  
  log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`, COLORS.bright);
  
  if (failed > 0) {
    log('\n❌ Some tests failed. Please check the output above.', COLORS.red);
    process.exit(1);
  } else {
    log('\n🎉 All test suites completed successfully!', COLORS.green);
  }
}

async function runLinting() {
  log('\n🔍 Running Linter...', COLORS.cyan);
  try {
    await runCommand('npx', ['eslint', 'tests/', '--fix']);
    log('✅ Linting completed', COLORS.green);
  } catch (error) {
    log('⚠️  Linting found issues (non-blocking)', COLORS.yellow);
  }
}

async function runTypeChecking() {
  log('\n🔧 Running Type Checking...', COLORS.cyan);
  try {
    await runCommand('npx', ['tsc', '--noEmit']);
    log('✅ Type checking passed', COLORS.green);
  } catch (error) {
    log('❌ Type checking failed', COLORS.red);
    throw error;
  }
}

function showHelp() {
  log('\n🧪 Kaiveni Test Runner', COLORS.bright);
  log('Usage: node test-runner.js [command]', COLORS.bright);
  log('\nCommands:', COLORS.bright);
  log('  api           Run API tests only', COLORS.cyan);
  log('  database      Run database tests only', COLORS.cyan);
  log('  integration   Run integration tests only', COLORS.cyan);
  log('  e2e           Run E2E tests only', COLORS.cyan);
  log('  all           Run all test suites (default)', COLORS.cyan);
  log('  lint          Run linting', COLORS.cyan);
  log('  types         Run type checking', COLORS.cyan);
  log('  help          Show this help message', COLORS.cyan);
  log('\nExamples:', COLORS.bright);
  log('  node test-runner.js api', COLORS.yellow);
  log('  node test-runner.js all', COLORS.yellow);
  log('  npm test', COLORS.yellow);
}

async function main() {
  const command = process.argv[2] || 'all';
  
  try {
    switch (command) {
      case 'api':
        await runApiTests();
        break;
      case 'database':
        await runDatabaseTests();
        break;
      case 'integration':
        await runIntegrationTests();
        break;
      case 'e2e':
        await runE2ETests();
        break;
      case 'all':
        await runAllTests();
        break;
      case 'lint':
        await runLinting();
        break;
      case 'types':
        await runTypeChecking();
        break;
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
      default:
        log(`❌ Unknown command: ${command}`, COLORS.red);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Test runner failed: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

// Check if required dependencies exist
function checkDependencies() {
  const requiredDeps = ['vitest', '@playwright/test'];
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  for (const dep of requiredDeps) {
    if (!packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]) {
      log(`⚠️  Warning: ${dep} is not installed`, COLORS.yellow);
    }
  }
}

// Run the main function
if (require.main === module) {
  checkDependencies();
  main();
}

module.exports = {
  runApiTests,
  runDatabaseTests,
  runIntegrationTests,
  runE2ETests,
  runAllTests
};
