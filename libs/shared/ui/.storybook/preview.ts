import './tailwind.css';

/**
 * @storybook/addon-a11y surfaces axe-core violations live in the
 * Storybook panel. The same ruleset is enforced as a CI gate by
 * `pnpm nx test-storybook shared-ui` (see `.storybook/test-runner.ts`
 * and `.github/workflows/storybook-a11y.yml`). Deeper WCAG checks
 * (forced-colors, reduced-motion, text-spacing, 400% reflow, contrast
 * tokens) run from the wcag-auditor subagent in Phase 4 — see
 * `.github/prompts/07b-wcag-auditor.prompt.md`.
 */
const preview = {
  parameters: {
    a11y: {
      element: '#storybook-root',
      manual: false,
      config: { rules: [] },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    },
  },
};

export default preview;
