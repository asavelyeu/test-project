import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

/**
 * Cross-framework Data Table e2e config.
 *
 * One suite, three targets: the same specs in ./src run under the `web`
 * (React), `angular`, and `vue` Playwright projects. Specs use relative
 * navigation (page.goto('/')) so they resolve against each project's baseURL.
 *
 * Dedicated TEST ports keep e2e isolated from local dev servers:
 *   - web (React / Vite):       4301   (dev runs on 4300)
 *   - angular (dev-server):     4201   (dev runs on 4200)
 *   - vue (Vite):               4401   (dev runs on 4400)
 *
 * Playwright's `webServer` is the SINGLE owner of the dev-server lifecycle: it
 * boots each app on its test port and polls the url until ready before running.
 * The Nx `e2e` target deliberately drops the plugin-inferred `dependsOn: serve`
 * (see project.json) so Nx does not also start the apps and race Playwright on
 * the ports. reuseExistingServer is true locally (reuse a test server already
 * up) and false in CI (always start fresh).
 */
const WEB_PORT = 4301;
const ANGULAR_PORT = 4201;
const VUE_PORT = 4401;

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  use: {
    /* Collect a trace when retrying a failed test. https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: `npx nx serve web-client --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
    {
      command: `npx nx serve angular-client --port ${ANGULAR_PORT}`,
      url: `http://localhost:${ANGULAR_PORT}`,
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
    {
      command: `npx nx serve vue-client --port ${VUE_PORT}`,
      url: `http://localhost:${VUE_PORT}`,
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'web',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${WEB_PORT}` },
    },
    {
      name: 'angular',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${ANGULAR_PORT}` },
    },
    {
      name: 'vue',
      use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${VUE_PORT}` },
    },
  ],
});
