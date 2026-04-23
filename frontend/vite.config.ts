import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@c': resolve(__dirname, './src/components'),
      '@api': resolve(__dirname, './src/api')
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, '') 
      }
    }
  }
})