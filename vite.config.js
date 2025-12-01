// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import PluginCritical from 'rollup-plugin-critical'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM で __dirname を再現
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [
    react(),
    // クリティカルCSSは本番ビルド時のみ
    isProd &&
      PluginCritical({
        // ★ dist/ のように末尾に / を付ける
        criticalUrl: 'dist/',
        criticalBase: 'dist/',
        // => dist/ + 'index.html' = dist/index.html を読む
        criticalPages: [
          { uri: 'index.html', template: 'index' },
        ],
        criticalConfig: {
          inline: true,
          extract: false,
          width: 412,
          height: 780,
          include: ['.navbar', '.page-header', '.collapse-title'],
          penthouse: { blockJSRequests: false },
        },
      }),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
