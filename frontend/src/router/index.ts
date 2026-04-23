// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
// 导入 Chat 页面组件
import Chat from '@/views/Chat.vue'

// 定义路由规则
const routes = [
  {
    path: '/', // 访问根路径（http://127.0.0.1:5173/）
    name: 'Chat',
    component: Chat // 加载 Chat.vue 页面
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(), // HTML5 历史模式（无 # 号）
  routes
})

export default router