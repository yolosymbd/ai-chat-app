// ========== 对话滚动位置 ==========
export const saveConvScroll = (scrollTop: number) => {
  localStorage.setItem('convScroll', scrollTop.toString())
}
export const getConvScroll = (): number => {
  const pos = localStorage.getItem('convScroll')
  return pos ? Number(pos) : 0
}

// ========== 聊天历史本地缓存 ==========
export const saveChatHistory = (data: unknown) => {
  localStorage.setItem('chat_history', JSON.stringify(data))
}

// ========== 最后打开的对话ID ==========
export const saveLastConvId = (convId: number) => {
  localStorage.setItem('last_conv_id', convId.toString())
}
export const getLastConvId = (): number | null => {
  const id = localStorage.getItem('last_conv_id')
  return id ? Number(id) : null
}

// ========== 消息点赞本地降级缓存 ==========
export const saveMsgRate = (convId: number, msgIndex: number, rate: string) => {
  const key = `chat_rate_${convId}`
  const rates = JSON.parse(localStorage.getItem(key) || '{}')
  rates[msgIndex] = rate
  localStorage.setItem(key, JSON.stringify(rates))
}
export const getMsgRateMap = (convId: number) => {
  const key = `chat_rate_${convId}`
  return JSON.parse(localStorage.getItem(key) || '{}')
}
export const clearConvRateCache = (convId: number) => {
  localStorage.removeItem(`chat_rate_${convId}`)
}