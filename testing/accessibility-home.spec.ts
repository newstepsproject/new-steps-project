import { test, expect } from '@playwright/test';
import { injectAxe } from 'axe-playwright';

test('homepage has no critical accessibility violations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await injectAxe(page);
  const violations = await page.evaluate(async () => {
    const axeRun = await (window as any).axe.run({
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });
    return axeRun.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.map((node: any) => ({
        targets: node.target,
        failureSummary: node.failureSummary
      }))
    }));
  });

  if (violations.length) {
    console.table(
      violations.flatMap((violation) =>
        violation.nodes.map((node) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          targets: node.targets.join(' | '),
          failure: node.failureSummary
        }))
      )
    );

    test.info().annotations.push({
      type: 'warning',
      description: `Accessibility issues detected: ${violations.map((v) => `${v.id}:${v.nodes.length}`).join(', ')}`
    });

    for (const violation of violations) {
      test.info().annotations.push({
        type: 'warning',
        description: `${violation.id}: ${violation.nodes.map((node) => node.targets.join(' | ')).join('; ')}`
      });
    }
  }

  await expect(page).toHaveTitle(/Give New Life to Old Kicks/i);
});
