import { defineStore } from 'pinia'
import { ref } from 'vue'

// 消息类型（完整匹配你页面消息所有字段）
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  id?: number
  // 【核心修复】把空字符串 "" 加入允许的类型集合
  userRate?: "" | "good" | "bad"
  created_at?: string
}
export const useChatStore = defineStore('chat', () => {
  // 消息列表
  const messageList = ref<ChatMessage[]>([])
  // 当前对话ID
  const currentConvId = ref<number | null>(null)

  // 仅保留你真实调用过的【清空消息】方法
  const clearMessage = () => {
    messageList.value = []
  }

  // 只return页面在用的变量&方法，无任何冗余
  return {
    messageList,
    currentConvId,
    clearMessage
  }
})