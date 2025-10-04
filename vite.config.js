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
    isProd && PluginCritical({
      // ファイルパス or URL。SPAなので dist を基点にする
      criticalUrl: 'dist',
      criticalBase: 'dist',
      // 処理するページ（SPA なら index.html のみでOK）
      criticalPages: [
        { uri: 'index.html', template: 'index' }, // => dist/index.html を処理
      ],
      // critical パッケージに渡す設定
      criticalConfig: {
        inline: true,          // ← 生成したクリティカルCSSを index.html にインライン
        extract: false,        // 非クリティカルCSSの抽出はまず無効で安全運用
        width: 412,            // モバイル計測に合わせたビューポート
        height: 780,
        // Tailwindのクラスが飛びづらいよう “必ず含める” セレクタを軽く指定（任意）
        include: [
          '.navbar', '.page-header', '.collapse-title'
        ],
        // JS ブロックをオフ（SPA では initial HTML のみを対象にする）
        penthouse: { blockJSRequests: false }
      }
    })
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
