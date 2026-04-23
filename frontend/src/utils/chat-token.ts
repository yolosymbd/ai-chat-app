import type { ChatMessage } from "@/types/chat"

// 模型Token上限常量
export const MODEL_MAX_TOKEN = 1800
export const TOKEN_WARN_RATE = 0.85

/**
 * 中文对话真实Token估算算法
 * @param text 待计算文本
 */
export const estimateToken = (text: string): number => {
  if (!text) return 0
  const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const other = text.replace(/[\u4e00-\u9fa5]/g, '').length
  return Math.ceil(cn * 1.3 + other * 0.5)
}

/**
 * 计算整个对话上下文总Token
 * @param msgs 聊天消息数组
 */
export const getTotalChatToken = (msgs: ChatMessage[]): number => {
  return msgs.reduce((sum, m) => sum + estimateToken(m.content), 0)
}