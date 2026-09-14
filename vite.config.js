import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署时需要设置 base 为仓库名
// 本地开发时 base 为 '/'
const base = process.env.GITHUB_PAGES === 'true' ? '/food-ordering/' : '/'

export default defineConfig({
  base,
  plugins: [vue()],
  define: {
    'import.meta.env.GITHUB_PAGES': JSON.stringify(process.env.GITHUB_PAGES || 'false')
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.path = req.url
          })
        }
      }
    }
  }
})
