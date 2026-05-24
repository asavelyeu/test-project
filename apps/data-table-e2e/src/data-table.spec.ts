import { test, expect } from '@playwright/test';

/**
 * Smoke test for the Data Table demo. Runs under both the `web` and `angular`
 * Playwright projects via relative navigation (baseURL is set per project).
 *
 * Intentionally thin: this proves the harness boots, serves each app, loads the
 * page, and renders a Data Table with rows. It is NOT the full suite.
 */
test('renders a Data Table with body rows', async ({ page }) => {
  await page.goto('/');

  // Both apps render the Data Table as a native <table> (role="table").
  const firstTable = page.getByRole('table').first();
  await expect(firstTable).toBeVisible();

  // role="row" counts the header row plus body rows, so a populated table has > 1.
  const rowCount = await firstTable.getByRole('row').count();
  expect(rowCount).toBeGreaterThan(1);
});
