// 点赞 / 点踩 / 反馈全 Hook
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import type { ChatMessage } from '@/types/chat'
import { saveFeedback, getFeedback } from '@/api'
import { useChatStore } from '@/stores/modules/chat'
import { useGlobalStore } from '@/stores/modules/global'

export const useChatRate = () => {
  const chatStore = useChatStore()
  const globalStore = useGlobalStore()
  const { messageList, currentConvId } = storeToRefs(chatStore)
  const { loading } = storeToRefs(globalStore)

  /** 加载本地缓存的评分 */
  const loadRateFromLocal = (convId: number | null) => {
    if (convId === null) return
    const key = `chat_rate_${convId}`
    const rates = JSON.parse(localStorage.getItem(key) || '{}')

    messageList.value.forEach((msg, idx) => {
      msg.userRate = rates[idx] ?? ''
    })
  }

  /** 保存评分到本地缓存 */
  const saveRateToLocal = (convId: number, msgIndex: number, rate: string = '') => {
    const key = `chat_rate_${convId}`
    const rates = JSON.parse(localStorage.getItem(key) || '{}')
    rates[msgIndex] = rate
    localStorage.setItem(key, JSON.stringify(rates))
  }

  /** 从后端加载消息反馈 */
  const loadFeedbackFromBackend = async (msgId: number, msg: ChatMessage) => {
    try {
      const data = await getFeedback(msgId)
      msg.userRate = data.rate ?? ''
    } catch (e) {
      msg.userRate = ''
    }
  }

  /** 点赞/点踩主逻辑 */
  const rateMsg = async (clickIndex: number, type: 'good' | 'bad', reGenerate: Function) => {
    const msg = messageList.value[clickIndex]
    if (!msg || currentConvId.value === null) return

    if (loading.value) {
      ElMessage.warning('AI正在生成中，请稍后操作')
      return
    }
    if (!msg.id || msg.id <= 0) {
      ElMessage.warning('消息未保存完成，请稍后再操作')
      return
    }

    if (type === 'good') {
      const isCancel = msg.userRate === type
      msg.userRate = isCancel ? '' : type
    } else if (type === 'bad') {
      msg.userRate = ''
    }

    saveRateToLocal(currentConvId.value, clickIndex, msg.userRate ?? '')

    try {
      await saveFeedback(msg.id, msg.userRate ?? '')
    } catch (err) {
      ElMessage.warning('状态同步失败')
    }

    if (type === 'good') {
      ElMessage.success(msg.userRate === 'good' ? '👍 已收藏为优质回答' : '已取消收藏')
    } else if (type === 'bad') {
      ElMessage.warning('👎 已标记为不满意，正在为您重新生成...')
      await reGenerate(clickIndex)
    }
  }

  return {
    loadRateFromLocal,
    saveRateToLocal,
    loadFeedbackFromBackend,
    rateMsg
  }
}