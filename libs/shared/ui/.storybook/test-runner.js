// Storybook test-runner config — enforces WCAG 2.1 AA via axe-core on
// every story as a CI gate. See `.github/workflows/storybook-a11y.yml`.
//
// Plain JS (not TS) on purpose: this file is consumed only by
// `pnpm nx test-storybook`, which loads it in a Node context where
// `axe-playwright` and `@storybook/test-runner` are guaranteed to be
// installed. Keeping it .js avoids cross-cutting TypeScript project
// resolution for a runtime-only config.
//
// Per-story opt-outs are still possible via story parameters:
//   parameters.a11y.disable = true
//   parameters.a11y.config.rules = [{ id: 'color-contrast', enabled: false }]
// — but those must be justified in code review.

const { injectAxe, checkA11y, configureAxe } = require('axe-playwright');

/** @type {import('@storybook/test-runner').TestRunnerConfig} */
const config = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await configureAxe(page, { rules: [] });
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    });
  },
};

module.exports = config;
