/**
 * Master Test Runner - Uyarvom Ecommerce Platform
 * Runs all unit, integration, and E2E tests in sequence.
 * Outputs structured logs to test.log
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'test.log');
const START_TIME = new Date();

// ─── Logging Utilities ────────────────────────────────────────────────────────

function log(msg) {
  const line = `${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

function logSection(title) {
  const divider = '═'.repeat(60);
  log(`\n${divider}`);
  log(`  ${title}`);
  log(divider);
}

function logResult(suiteName, passed, durationMs, errorOutput = '') {
  const status = passed ? '✓ PASSED' : '✗ FAILED';
  const duration = `(${(durationMs / 1000).toFixed(2)}s)`;
  log(`  ${status}  ${suiteName} ${duration}`);
  if (!passed && errorOutput) {
    log('\n  --- Error Output ---');
    // Trim to avoid noise, show last 40 lines
    const lines = errorOutput.trim().split('\n').slice(-40);
    lines.forEach(l => log(`  ${l}`));
    log('  --- End Error Output ---\n');
  }
}

// ─── Test Suite Runner ────────────────────────────────────────────────────────

const results = [];

function runSuite(command, suiteName) {
  log(`\n  Running: ${suiteName}...`);
  const suiteStart = Date.now();
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: path.join(__dirname, '..'),
    });
    const duration = Date.now() - suiteStart;
    logResult(suiteName, true, duration);
    results.push({ suite: suiteName, passed: true, duration });
  } catch (err) {
    const duration = Date.now() - suiteStart;
    const errorOutput = (err.stdout || '') + '\n' + (err.stderr || '');
    logResult(suiteName, false, duration, errorOutput);
    results.push({ suite: suiteName, passed: false, duration, error: errorOutput });
  }
}

// ─── Main Execution ───────────────────────────────────────────────────────────

// Initialize log file
fs.writeFileSync(LOG_FILE, '');

log('╔══════════════════════════════════════════════════════════╗');
log('║       UYARVOM ECOMMERCE - FULL TEST SUITE RUNNER         ║');
log('╚══════════════════════════════════════════════════════════╝');
log(`  Start Time : ${START_TIME.toLocaleString()}`);
log(`  Log File   : ${LOG_FILE}`);

// ─── Phase 1: Unit & Integration Tests (Vitest) ───────────────────────────────
logSection('PHASE 1: Unit & Integration Tests (Vitest)');

const unitSuites = [
  { cmd: 'npx vitest run __tests__/auth-middleware.test.ts',         name: 'auth-middleware' },
  { cmd: 'npx vitest run __tests__/user-sync.test.ts',               name: 'user-sync' },
  { cmd: 'npx vitest run __tests__/settings.test.ts',                name: 'settings' },
  { cmd: 'npx vitest run __tests__/support.test.ts',                 name: 'support-actions' },
  { cmd: 'npx vitest run __tests__/admin-support.test.ts',           name: 'admin-support-actions' },
  { cmd: 'npx vitest run __tests__/orders-actions.test.ts',          name: 'orders-actions' },
  { cmd: 'npx vitest run __tests__/api/cart.test.ts',                name: 'api/cart' },
  { cmd: 'npx vitest run __tests__/api/orders.test.ts',              name: 'api/orders (checkout)' },
  { cmd: 'npx vitest run __tests__/api/products.test.ts',            name: 'api/products' },
  { cmd: 'npx vitest run __tests__/api/reviews.test.ts',             name: 'api/reviews' },
  { cmd: 'npx vitest run __tests__/api/health-ping.test.ts',         name: 'api/health-ping' },
  { cmd: 'npx vitest run __tests__/api/admin/products.test.ts',      name: 'api/admin/products' },
  { cmd: 'npx vitest run __tests__/api/admin/categories.test.ts',    name: 'api/admin/categories' },
  { cmd: 'npx vitest run __tests__/api/admin/staff.test.ts',         name: 'api/admin/staff' },
];

for (const suite of unitSuites) {
  runSuite(suite.cmd, suite.name);
}

// ─── Phase 2: E2E Tests (Playwright) ─────────────────────────────────────────
logSection('PHASE 2: End-to-End Tests (Playwright)');

const e2eSuites = [
  { cmd: 'npx playwright test e2e/customer-checkout.spec.ts --reporter=line', name: 'e2e/customer-checkout' },
  { cmd: 'npx playwright test e2e/admin-dashboard.spec.ts --reporter=line',   name: 'e2e/admin-dashboard' },
  { cmd: 'npx playwright test e2e/support-admin.spec.ts --reporter=line',     name: 'e2e/support-admin' },
];

for (const suite of e2eSuites) {
  runSuite(suite.cmd, suite.name);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
const END_TIME = new Date();
const totalDuration = (END_TIME - START_TIME) / 1000;
const passed = results.filter(r => r.passed);
const failed = results.filter(r => !r.passed);

logSection('TEST EXECUTION SUMMARY');
log(`  Total Suites : ${results.length}`);
log(`  Passed       : ${passed.length}`);
log(`  Failed       : ${failed.length}`);
log(`  Duration     : ${totalDuration.toFixed(2)}s`);
log(`  End Time     : ${END_TIME.toLocaleString()}`);

if (failed.length > 0) {
  log('\n  Failed Suites:');
  failed.forEach(r => log(`    ✗ ${r.suite}`));
}

log('\n  Coverage Map:');
const coverageMap = [
  { module: 'auth-middleware',        covered: true },
  { module: 'user-sync',              covered: true },
  { module: 'settings',               covered: true },
  { module: 'support-actions',        covered: true },
  { module: 'admin-support-actions',  covered: true },
  { module: 'orders-actions',         covered: true },
  { module: 'api/cart',               covered: true },
  { module: 'api/orders (checkout)',  covered: true },
  { module: 'api/products',           covered: true },
  { module: 'api/reviews',            covered: true },
  { module: 'api/health',             covered: true },
  { module: 'api/ping',               covered: true },
  { module: 'api/admin/products',     covered: true },
  { module: 'api/admin/categories',   covered: true },
  { module: 'api/admin/staff',        covered: true },
  { module: 'e2e/customer-checkout',  covered: true },
  { module: 'e2e/admin-dashboard',    covered: true },
  { module: 'e2e/support-admin',      covered: true },
  // Modules that require live browser/DB session - cannot be unit tested
  { module: 'razorpay-integration',   covered: false, reason: 'Requires live Razorpay sandbox credentials' },
  { module: 'cloudflare-r2',          covered: false, reason: 'Requires live R2 bucket credentials' },
  { module: 'supabase-resilience',    covered: false, reason: 'Requires live Supabase connection for timeout simulation' },
  { module: 'merchandising-actions',  covered: false, reason: 'No public API surface exposed for unit testing' },
  { module: 'prisma-seed',            covered: false, reason: 'Seed scripts require live DB; validated via db:seed command' },
];

coverageMap.forEach(m => {
  if (m.covered) {
    log(`    ✓ ${m.module}`);
  } else {
    log(`    - UNTESTED: ${m.module} — ${m.reason}`);
  }
});

log('\n══════════════════════════════════════════════════════════');
log(failed.length === 0 ? '  ALL SUITES PASSED' : `  ${failed.length} SUITE(S) FAILED — review test.log for details`);
log('══════════════════════════════════════════════════════════\n');

process.exit(failed.length > 0 ? 1 : 0);
