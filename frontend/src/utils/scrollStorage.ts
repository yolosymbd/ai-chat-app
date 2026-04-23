import { nextTick } from 'vue'
import type { Ref } from 'vue'

// 明确类型：定时器ID | null，不再用 Ref，去掉多余 .value
let scrollTimer: number | null = null

/** 消息区域自动滚动到底部 */
export const scrollToBottom = (msgContainer: Ref<HTMLElement | null>) => {
  // 先清空旧定时器，判断非null再清除
  if (scrollTimer !== null) {
    clearTimeout(scrollTimer)
  }
  // 赋值新定时器
  scrollTimer = window.setTimeout(() => {
    nextTick(() => {
      const el = msgContainer.value
      if (!el) return
      el.scrollTop = el.scrollHeight
    })
  }, 50)
}

/** 保存左侧对话列表滚动位置 */
export const saveScroll = (convListRef: Ref<HTMLElement | null>) => {
  if (convListRef.value) {
    localStorage.setItem('convScroll', convListRef.value.scrollTop.toString())
  }
}

/** 恢复左侧对话列表滚动位置 */
export const restoreScroll = (convListRef: Ref<HTMLElement | null>) => {
  const pos = localStorage.getItem('convScroll')
  if (pos && convListRef.value) {
    convListRef.value.scrollTop = Number(pos)
  }
}

/** 保存聊天记录到本地缓存 */
export const saveHistory = <T>(messageList: Ref<T[]>) => {
  localStorage.setItem('chat_history', JSON.stringify(messageList.value))
}