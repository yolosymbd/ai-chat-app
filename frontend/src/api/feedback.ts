import { API_BASE_URL } from '@/config/env'

// 保存反馈
export const saveFeedback = (msgId: number, rate: string) => {
  return fetch(`${API_BASE_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msg_id: msgId, rate })
  })
}

// 获取反馈
export const getFeedback = (msgId: number) => {
  return fetch(`${API_BASE_URL}/feedback/${msgId}`).then(res => res.json())
}