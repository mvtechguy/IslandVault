#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Comprehensive Test Report Generator for Kaiveni Application
 * Generates detailed test reports with coverage metrics, execution times, and recommendations
 */

class TestReportGenerator {
  constructor() {
    this.reportDir = path.join(process.cwd(), 'test-reports');
    this.coverageDir = path.join(process.cwd(), 'coverage');
    this.performanceDir = path.join(process.cwd(), 'performance-results');
    this.e2eDir = path.join(process.cwd(), 'test-results');
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.reportDir, this.coverageDir, this.performanceDir, this.e2eDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateComprehensiveReport() {
    console.log('🧪 Generating comprehensive test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: await this.generateSummary(),
      coverage: await this.parseCoverageReport(),
      unitTests: await this.parseUnitTestResults(),
      integrationTests: await this.parseIntegrationTestResults(),
      e2eTests: await this.parseE2ETestResults(),
      performanceTests: await this.parsePerformanceResults(),
      recommendations: await this.generateRecommendations(),
      metrics: await this.calculateMetrics()
    };

    // Generate different report formats
    await this.generateJSONReport(report);
    await this.generateMarkdownReport(report);
    await this.generateHTMLReport(report);
    await this.generateSummaryJSON(report);

    console.log('✅ Test report generation completed!');
    console.log(`📊 Reports available in: ${this.reportDir}`);
    
    return report;
  }

  async generateSummary() {
    return {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      overallCoverage: 0,
      executionTime: 0,
      status: 'unknown'
    };
  }

  async parseCoverageReport() {
    const coverageFile = path.join(this.coverageDir, 'coverage-summary.json');
    
    if (!fs.existsSync(coverageFile)) {
      return {
        lines: { pct: 0 },
        statements: { pct: 0 },
        functions: { pct: 0 },
        branches: { pct: 0 }
      };
    }

    try {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      return coverage.total || coverage;
    } catch (error) {
      console.warn('⚠️ Could not parse coverage report:', error.message);
      return { lines: { pct: 0 }, statements: { pct: 0 }, functions: { pct: 0 }, branches: { pct: 0 } };
    }
  }

  async parseUnitTestResults() {
    const resultsFile = path.join(this.reportDir, 'unit-test-results.json');
    
    if (!fs.existsSync(resultsFile)) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        suites: []
      };
    }

    try {
      return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not parse unit test results:', error.message);
      return { total: 0, passed: 0, failed: 0, duration: 0, suites: [] };
    }
  }

  async parseIntegrationTestResults() {
    const resultsFile = path.join(this.reportDir, 'integration-test-results.json');
    
    if (!fs.existsSync(resultsFile)) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        suites: []
      };
    }

    try {
      return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not parse integration test results:', error.message);
      return { total: 0, passed: 0, failed: 0, duration: 0, suites: [] };
    }
  }

  async parseE2ETestResults() {
    const resultsFile = path.join(this.e2eDir, 'results.json');
    
    if (!fs.existsSync(resultsFile)) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        duration: 0,
        browsers: []
      };
    }

    try {
      return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not parse E2E test results:', error.message);
      return { total: 0, passed: 0, failed: 0, duration: 0, browsers: [] };
    }
  }

  async parsePerformanceResults() {
    const resultsFile = path.join(this.performanceDir, 'performance-summary.json');
    
    if (!fs.existsSync(resultsFile)) {
      return {
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        tests: []
      };
    }

    try {
      return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️ Could not parse performance results:', error.message);
      return { averageResponseTime: 0, maxResponseTime: 0, minResponseTime: 0, throughput: 0, errorRate: 0, tests: [] };
    }
  }

  async generateRecommendations() {
    const recommendations = [];

    // Coverage-based recommendations
    const coverage = await this.parseCoverageReport();
    if (coverage.lines.pct < 80) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        title: 'Improve Test Coverage',
        description: `Line coverage is ${coverage.lines.pct}%. Aim for at least 80% coverage.`,
        action: 'Add more unit tests for uncovered code paths'
      });
    }

    if (coverage.branches.pct < 70) {
      recommendations.push({
        type: 'coverage',
        priority: 'medium',
        title: 'Improve Branch Coverage',
        description: `Branch coverage is ${coverage.branches.pct}%. Add tests for conditional logic.`,
        action: 'Write tests that cover all conditional branches'
      });
    }

    // Performance-based recommendations
    const performance = await this.parsePerformanceResults();
    if (performance.averageResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize API Response Times',
        description: `Average response time is ${performance.averageResponseTime}ms. Consider optimization.`,
        action: 'Review database queries and add caching where appropriate'
      });
    }

    // Test quality recommendations
    const unitTests = await this.parseUnitTestResults();
    if (unitTests.total < 50) {
      recommendations.push({
        type: 'test-quality',
        priority: 'medium',
        title: 'Increase Unit Test Count',
        description: `Only ${unitTests.total} unit tests found. Consider adding more comprehensive tests.`,
        action: 'Add unit tests for all utility functions and business logic'
      });
    }

    // Security recommendations
    recommendations.push({
      type: 'security',
      priority: 'high',
      title: 'Regular Security Audits',
      description: 'Ensure regular security testing and dependency audits.',
      action: 'Run npm audit and security scans regularly'
    });

    return recommendations;
  }

  async calculateMetrics() {
    const coverage = await this.parseCoverageReport();
    const unitTests = await this.parseUnitTestResults();
    const integrationTests = await this.parseIntegrationTestResults();
    const e2eTests = await this.parseE2ETestResults();
    const performance = await this.parsePerformanceResults();

    return {
      testDensity: (unitTests.total + integrationTests.total) / 1000, // tests per 1000 lines of code (estimated)
      coverageScore: (coverage.lines.pct + coverage.branches.pct + coverage.functions.pct) / 3,
      reliabilityScore: this.calculateReliabilityScore(unitTests, integrationTests, e2eTests),
      performanceScore: this.calculatePerformanceScore(performance),
      overallQualityScore: 0 // Will be calculated based on other scores
    };
  }

  calculateReliabilityScore(unit, integration, e2e) {
    const totalTests = unit.total + integration.total + e2e.total;
    const totalPassed = unit.passed + integration.passed + e2e.passed;
    
    if (totalTests === 0) return 0;
    return (totalPassed / totalTests) * 100;
  }

  calculatePerformanceScore(performance) {
    if (performance.averageResponseTime === 0) return 100;
    
    // Score based on response time (lower is better)
    if (performance.averageResponseTime < 200) return 100;
    if (performance.averageResponseTime < 500) return 80;
    if (performance.averageResponseTime < 1000) return 60;
    if (performance.averageResponseTime < 2000) return 40;
    return 20;
  }

  async generateJSONReport(report) {
    const filePath = path.join(this.reportDir, 'comprehensive-report.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report: ${filePath}`);
  }

  async generateSummaryJSON(report) {
    const summary = {
      timestamp: report.timestamp,
      unit: {
        status: report.unitTests.failed === 0 ? 'passed' : 'failed',
        coverage: report.coverage.lines.pct,
        duration: `${report.unitTests.duration}ms`
      },
      integration: {
        status: report.integrationTests.failed === 0 ? 'passed' : 'failed',
        coverage: report.coverage.statements.pct,
        duration: `${report.integrationTests.duration}ms`
      },
      e2e: {
        status: report.e2eTests.failed === 0 ? 'passed' : 'failed',
        duration: `${report.e2eTests.duration}ms`
      },
      performance: {
        status: report.performanceTests.errorRate < 5 ? 'passed' : 'failed',
        duration: `${report.performanceTests.tests.length * 1000}ms`
      },
      overall: {
        coverage: report.metrics.coverageScore,
        duration: `${report.unitTests.duration + report.integrationTests.duration + report.e2eTests.duration}ms`,
        status: report.summary.failedTests === 0 ? 'passed' : 'failed'
      }
    };

    const filePath = path.join(this.reportDir, 'summary.json');
    fs.writeFileSync(filePath, JSON.stringify(summary, null, 2));
    console.log(`📊 Summary JSON: ${filePath}`);
  }

  async generateMarkdownReport(report) {
    const markdown = `
# 🧪 Kaiveni Test Report

**Generated:** ${new Date(report.timestamp).toLocaleString()}

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Total Tests | ${report.summary.totalTests} | ${report.summary.status === 'passed' ? '✅' : '❌'} |
| Passed | ${report.summary.passedTests} | - |
| Failed | ${report.summary.failedTests} | - |
| Coverage | ${report.metrics.coverageScore.toFixed(1)}% | ${report.metrics.coverageScore >= 80 ? '✅' : '⚠️'} |
| Performance Score | ${report.metrics.performanceScore}/100 | ${report.metrics.performanceScore >= 80 ? '✅' : '⚠️'} |

## 🎯 Test Results by Category

### Unit Tests
- **Total:** ${report.unitTests.total}
- **Passed:** ${report.unitTests.passed}
- **Failed:** ${report.unitTests.failed}
- **Duration:** ${report.unitTests.duration}ms

### Integration Tests
- **Total:** ${report.integrationTests.total}
- **Passed:** ${report.integrationTests.passed}
- **Failed:** ${report.integrationTests.failed}
- **Duration:** ${report.integrationTests.duration}ms

### End-to-End Tests
- **Total:** ${report.e2eTests.total}
- **Passed:** ${report.e2eTests.passed}
- **Failed:** ${report.e2eTests.failed}
- **Duration:** ${report.e2eTests.duration}ms

## 📈 Coverage Report

| Type | Coverage | Target | Status |
|------|----------|--------|--------|
| Lines | ${report.coverage.lines.pct}% | 80% | ${report.coverage.lines.pct >= 80 ? '✅' : '❌'} |
| Statements | ${report.coverage.statements.pct}% | 80% | ${report.coverage.statements.pct >= 80 ? '✅' : '❌'} |
| Functions | ${report.coverage.functions.pct}% | 80% | ${report.coverage.functions.pct >= 80 ? '✅' : '❌'} |
| Branches | ${report.coverage.branches.pct}% | 70% | ${report.coverage.branches.pct >= 70 ? '✅' : '❌'} |

## ⚡ Performance Metrics

- **Average Response Time:** ${report.performanceTests.averageResponseTime}ms
- **Max Response Time:** ${report.performanceTests.maxResponseTime}ms
- **Min Response Time:** ${report.performanceTests.minResponseTime}ms
- **Error Rate:** ${report.performanceTests.errorRate}%

## 💡 Recommendations

${report.recommendations.map(rec => `
### ${rec.title} (${rec.priority.toUpperCase()} Priority)
**Type:** ${rec.type}
**Description:** ${rec.description}
**Action:** ${rec.action}
`).join('\n')}

## 📋 Quality Metrics

- **Test Density:** ${report.metrics.testDensity.toFixed(2)} tests per 1000 lines
- **Reliability Score:** ${report.metrics.reliabilityScore.toFixed(1)}%
- **Performance Score:** ${report.metrics.performanceScore}/100
- **Overall Quality Score:** ${report.metrics.overallQualityScore}/100

---
*Report generated by Kaiveni Test Suite*
`;

    const filePath = path.join(this.reportDir, 'test-report.md');
    fs.writeFileSync(filePath, markdown);
    console.log(`📝 Markdown report: ${filePath}`);
  }

  async generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kaiveni Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #3498db; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .metric-label { color: #7f8c8d; font-size: 0.9em; }
        .status-pass { color: #27ae60; }
        .status-fail { color: #e74c3c; }
        .status-warn { color: #f39c12; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 10px 0; }
        .priority-high { border-left: 4px solid #e74c3c; }
        .priority-medium { border-left: 4px solid #f39c12; }
        .priority-low { border-left: 4px solid #27ae60; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Kaiveni Test Report</h1>
        <p><strong>Generated:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        
        <h2>📊 Executive Summary</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value ${report.summary.failedTests === 0 ? 'status-pass' : 'status-fail'}">${report.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value status-pass">${report.summary.passedTests}</div>
                <div class="metric-label">Passed Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${report.summary.failedTests > 0 ? 'status-fail' : 'status-pass'}">${report.summary.failedTests}</div>
                <div class="metric-label">Failed Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value ${report.metrics.coverageScore >= 80 ? 'status-pass' : 'status-warn'}">${report.metrics.coverageScore.toFixed(1)}%</div>
                <div class="metric-label">Coverage Score</div>
            </div>
        </div>

        <h2>📈 Coverage Details</h2>
        <table>
            <thead>
                <tr><th>Type</th><th>Coverage</th><th>Target</th><th>Status</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>Lines</td>
                    <td>${report.coverage.lines.pct}%</td>
                    <td>80%</td>
                    <td class="${report.coverage.lines.pct >= 80 ? 'status-pass' : 'status-fail'}">${report.coverage.lines.pct >= 80 ? '✅ Pass' : '❌ Fail'}</td>
                </tr>
                <tr>
                    <td>Statements</td>
                    <td>${report.coverage.statements.pct}%</td>
                    <td>80%</td>
                    <td class="${report.coverage.statements.pct >= 80 ? 'status-pass' : 'status-fail'}">${report.coverage.statements.pct >= 80 ? '✅ Pass' : '❌ Fail'}</td>
                </tr>
                <tr>
                    <td>Functions</td>
                    <td>${report.coverage.functions.pct}%</td>
                    <td>80%</td>
                    <td class="${report.coverage.functions.pct >= 80 ? 'status-pass' : 'status-fail'}">${report.coverage.functions.pct >= 80 ? '✅ Pass' : '❌ Fail'}</td>
                </tr>
                <tr>
                    <td>Branches</td>
                    <td>${report.coverage.branches.pct}%</td>
                    <td>70%</td>
                    <td class="${report.coverage.branches.pct >= 70 ? 'status-pass' : 'status-fail'}">${report.coverage.branches.pct >= 70 ? '✅ Pass' : '❌ Fail'}</td>
                </tr>
            </tbody>
        </table>

        <h2>💡 Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation priority-${rec.priority}">
                <h3>${rec.title}</h3>
                <p><strong>Priority:</strong> ${rec.priority.toUpperCase()}</p>
                <p><strong>Description:</strong> ${rec.description}</p>
                <p><strong>Action:</strong> ${rec.action}</p>
            </div>
        `).join('')}

        <h2>⚡ Performance Summary</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${report.performanceTests.averageResponseTime}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${report.performanceTests.errorRate}%</div>
                <div class="metric-label">Error Rate</div>
            </div>
        </div>
    </div>
</body>
</html>
`;

    const filePath = path.join(this.reportDir, 'test-report.html');
    fs.writeFileSync(filePath, html);
    console.log(`🌐 HTML report: ${filePath}`);
  }
}

// Run the report generator
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new TestReportGenerator();
  generator.generateComprehensiveReport()
    .then(() => {
      console.log('🎉 Test report generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test report generation failed:', error);
      process.exit(1);
    });
}

export default TestReportGenerator;