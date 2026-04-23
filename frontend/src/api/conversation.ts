import { API_BASE_URL} from '@/config/env'

// 获取会话列表
export const getConversations = () => {
  return fetch(`${API_BASE_URL}/conversations`).then(res => res.json())
}

// 新建会话
export const createConversation = () => {
  return fetch(`${API_BASE_URL}/conversation`, { method: "POST" }).then(res => res.json())
}

// 删除会话
export const deleteConversation = (convId: number) => {
  return fetch(`${API_BASE_URL}/conversation/${convId}`, { method: "DELETE" })
}

// 清空会话消息
export const clearConversationMessages = (convId: number) => {
  return fetch(`${API_BASE_URL}/conversation/${convId}/clear_messages`, { method: "DELETE" })
}

// 获取会话消息
export const getMessagesByConv = (convId: number) => {
  return fetch(`${API_BASE_URL}/conversation/${convId}/messages`).then(res => res.json())
}