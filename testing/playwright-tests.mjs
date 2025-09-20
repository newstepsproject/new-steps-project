#!/usr/bin/env node
import { execSync } from 'node:child_process';

const tests = [
  'npx playwright test testing/visitor-cart.spec.ts',
  'npx playwright test testing/run-verify-banner.spec.ts',
  'npx playwright test testing/run-donation-visibility.spec.ts',
  'npx playwright test testing/run-admin-search.spec.ts',
  'npx playwright test testing/admin-analytics.spec.ts',
  'npx playwright test testing/admin-manual-entry.spec.ts',
  'npx playwright test testing/admin-users.spec.ts',
  'npx playwright test testing/admin-volunteer-actions.spec.ts',
  'npx playwright test testing/admin-settings.spec.ts',
  'npx playwright test testing/accessibility-home.spec.ts'
];

for (const cmd of tests) {
  console.log(`\n>>> Running: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}
