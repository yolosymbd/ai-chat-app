import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import viteCompression from 'vite-plugin-compression'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    // ======================
    // 按需引入 ElementPlus
    // ======================
    AutoImport({
       // 👇 加上这一行！自动导入 Vue + ElMessage 等方法
      imports: ['vue'],
      resolvers: [ElementPlusResolver(), IconsResolver({ prefix: 'Icon' })],
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
         // 图标自动按需解析
        IconsResolver({
          prefix: 'Icon',
          enabledCollections: ['ep']
        })
      ],
    }),
    // 图片：按需引入配置
    Icons({ autoInstall: true }),
   // ✅ 推荐（完整版）
   // gzip压缩
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
   // 新增：打包分析插件，只在 build 时生效
    visualizer({ open: true, filename: 'stats.html' }),
  ],
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // if (id.includes('node_modules')) {
          //   return 'vendor'
          // }
            if (id.includes('vue')) return 'vue'
            if (id.includes('element-plus')) return 'element-plus'
            if (id.includes('node_modules')) return 'vendor'
        },
      // 下面这三行就是【优化文件名】
      chunkFileNames: 'js/[name]-[hash].js',
      entryFileNames: 'js/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@c': resolve(__dirname, './src/components'),
      '@api': resolve(__dirname, './src/api')
    }
  },

  server: {
    proxy: {
      //   // 代理你的 AI 后端接口
      // '/ai-chat-fast-api': {
      //   target: 'https://ai-chat-vue-front-d8d2jy6c43054c-1314889124.tcloudbaseapp.com',
      //   changeOrigin: true,
      //   secure: false,
      //   rewrite: (path) => path.replace(/^\/ai-chat-fast-api/, '')
      // },
      '/api': {
        target: 'https://open.bigmodel.cn',
        changeOrigin: true,
        secure: false
      }
    }
  }
})