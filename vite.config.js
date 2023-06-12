import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteJsconfigPaths from 'vite-jsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';
import contentTypePlugin from './content-type-plugin';


import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      plugins: [NodeModulesPolyfillPlugin()],
    },
  },
  plugins: [
    NodeModulesPolyfillPlugin(),
    react(),
    viteJsconfigPaths(),
    svgrPlugin(),
    contentTypePlugin({
      include: ['**/*.css', '**/*.jsx'],
    }),
  ],
});