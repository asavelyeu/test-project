import { dirname } from 'node:path';
import { createRequire } from 'node:module';

import type { StorybookConfig } from '@storybook/react-vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { mergeConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: [
    '../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../input/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../hover-card/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../menubar/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
  ],
  addons: [],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  viteFinal: async (config) =>
    mergeConfig(config, {
      plugins: [tailwindcss(), react(), nxViteTsPaths()],
      resolve: {
        alias: {
          'react-native': 'react-native-web',
        },
      },
    }),
};

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(`${value}/package.json`));
}

export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
