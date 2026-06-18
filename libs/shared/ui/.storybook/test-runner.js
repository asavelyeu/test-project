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

const { injectAxe, getAxeResults, configureAxe } = require('axe-playwright');

/** @type {import('@storybook/test-runner').TestRunnerConfig} */
const config = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await configureAxe(page, { rules: [] });
    const results = await getAxeResults(page, '#storybook-root', {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    });
    if (results.violations.length > 0) {
      const summary = results.violations
        .map((v) => {
          const nodes = v.nodes
            .map((n) => `    - ${n.html}\n      Fix: ${n.failureSummary}`)
            .join('\n');
          return `[${v.id}] ${v.help} (${v.impact})\n  ${v.helpUrl}\n${nodes}`;
        })
        .join('\n\n');
      throw new Error(
        `${results.violations.length} accessibility violation(s):\n\n${summary}`,
      );
    }
  },
};

module.exports = config;
