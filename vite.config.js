// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import PluginCritical from 'rollup-plugin-critical'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProd = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'      // ★ Vercel のビルド環境では "1" になる
const enableCritical = isProd && !isVercel      // ★ 本番かつローカルのときだけ有効

export default defineConfig({
  plugins: [
    react(),
    // クリティカルCSSは「ローカル本番ビルドのときだけ」
    enableCritical &&
      PluginCritical({
        criticalUrl: 'dist/',
        criticalBase: 'dist/',
        criticalPages: [{ uri: 'index.html', template: 'index' }],
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
