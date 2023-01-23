import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteJsconfigPaths from 'vite-jsconfig-paths'
import svgrPlugin from 'vite-plugin-svgr'

import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

// polyfills inject workaround for vite 4 incompatibility
// https://github.com/remorses/esbuild-plugins/issues/24  for solving dev error
// https://stackoverflow.com/questions/72773373/buffer-is-not-exported-by-vite-browser-externalbuffer for solving build error


// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    esbuildOptions: {
      // Enable esbuild polyfill plugins
      plugins: [
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'encoding': ['text-encoding'],
          'util': ['browserify-aes', 'create-hash', 'create-hmac', 'ecurve', 'randombytes', 'bytebuffer'],
          'chain': ['eosjs', 'eosjs-ecc', 'atomicassets', '@eoscafe/hyperion'],
          'tailwind': ['tailwindcss', 'flowbite', '@headlessui/react'],
          'ual-renderer': ['ual-reactjs-renderer'],
          'ual-packages': ['ual-ledger', 'ual-scatter', 'ual-starteos', 'ual-wombat', 'ual-wax'],
          'ual-anchor': ['ual-anchor'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    NodeModulesPolyfillPlugin(),
    react(),
    viteJsconfigPaths(),
    svgrPlugin(),
  ],
})
