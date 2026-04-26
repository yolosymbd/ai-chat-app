// 对话管理 Hook：新建 / 切换 / 删除
import { nextTick, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/modules/chat'
import {
  getConversations,
  createConversation,
  deleteConversation,
  clearConversationMessages,
  saveMessage,
  getMessagesByConv
} from '@/api'
import type { ChatMessage } from '@/types/chat'
import { isValidJson } from '@/utils/markdown'
import { scrollToBottom,saveHistory, saveScroll, restoreScroll } from '@/utils/scrollStorage'


export const useConversation = (
  convList: Ref<any[]>,
  convListRef: Ref<HTMLElement | null>,
  msgContainer: Ref<HTMLElement | null>,
  loadFeedbackFromBackend: Function,
  loadRateFromLocal: Function
) => {
  const chatStore = useChatStore()
  const { messageList, currentConvId } = storeToRefs(chatStore)
  const { clearMessage } = chatStore

  /** 加载对话列表 */
  const loadConvs = async () => {
    convList.value = await getConversations()
  }

  /** 新建对话 */
  const newChat = async () => {
    const res = await createConversation()
    currentConvId.value = res.conv_id
    localStorage.setItem('last_conv_id', res.conv_id)
    const initContent = '你好！我是智能助手'
    await saveMessage(currentConvId.value!, 'assistant', initContent)
    const msgs = await getMessagesByConv(currentConvId.value!)
    messageList.value = msgs.length
      ? msgs.map((m: ChatMessage) => ({ ...m, id: m.id || 0 }))
      : [{ role: 'assistant', content: initContent, id: 0, userRate: '' }]

    await loadConvs()
    nextTick(() => document.querySelector('.conv-list')?.scrollTo(0, 0))
    scrollToBottom(msgContainer)
  }

  /** 切换对话（自带消息去重过滤原版逻辑完整保留） */
  const switchConv = async (id: number) => {
    currentConvId.value = id
    localStorage.setItem('last_conv_id', id.toString())
    const msgs = await getMessagesByConv(id)

    // 过滤工具调用脏消息
    const filteredMsgs = msgs.filter((msg: ChatMessage) => {
      const cleanContent = msg.content.replace(/```json/g, '').replace(/```/g, '').trim()
      if (msg.role === 'assistant' && isValidJson(cleanContent)) {
        try {
          const json = JSON.parse(cleanContent)
          return !['calc', 'weather', 'time'].includes(json.name)
        } catch {
          return true
        }
      }
      return true
    })

    // 相同用户提问只保留最后一条AI回复
    const userContentMap = new Map<string, number[]>()
    filteredMsgs.forEach((msg: ChatMessage, idx: number) => {
      if (msg.role === 'user') {
        userContentMap.set(msg.content, [])
      } else if (msg.role === 'assistant') {
        let lastUserContent = ''
        for (let i = idx - 1; i >= 0; i--) {
          if (filteredMsgs[i].role === 'user') {
            lastUserContent = filteredMsgs[i].content
            break
          }
        }
        if (lastUserContent) {
          const arr = userContentMap.get(lastUserContent) || []
          arr.push(idx)
          userContentMap.set(lastUserContent, arr)
        }
      }
    })

    const keepIndexSet = new Set<number>()
    filteredMsgs.forEach((_:ChatMessage, idx:number) => keepIndexSet.add(idx))
    userContentMap.forEach((aiIndexList) => {
      if (aiIndexList.length > 1) {
        aiIndexList.at(-1)!
        aiIndexList.slice(0, -1).forEach(delIdx => keepIndexSet.delete(delIdx))
      }
    })

    // 相同用户提问去重
    const userSelfMap = new Map<string, number[]>()
    filteredMsgs.forEach((msg: ChatMessage, idx: number) => {
      if (msg.role === 'user') {
        if (!userSelfMap.has(msg.content)) userSelfMap.set(msg.content, [])
        userSelfMap.get(msg.content)!.push(idx)
      }
    })
    userSelfMap.forEach((userIndexList) => {
      if (userIndexList.length > 1) {
        userIndexList.at(-1)!
        userIndexList.slice(0, -1).forEach(delIdx => keepIndexSet.delete(delIdx))
      }
    })

    const finalMsgs = filteredMsgs.filter((_:ChatMessage, idx:number) => keepIndexSet.has(idx))
    messageList.value = finalMsgs.length
      ? finalMsgs.map((m: ChatMessage) => ({ ...m, id: m.id || 0 }))
      : []
      

    scrollToBottom(msgContainer)

    nextTick(() => {
      const activeEl = convListRef.value?.querySelector('.conv-item.active')
      if (activeEl) activeEl.scrollIntoView({ block: 'center', behavior: 'auto' })
      saveScroll(convListRef)
    })

    // 加载前后端评分
    for (const msg of messageList.value) {
      if (msg.id) await loadFeedbackFromBackend(msg.id, msg)
    }
    loadRateFromLocal(id)

    // 空对话兜底初始消息
    if (messageList.value.length === 0) {
      const initContent = '你好！我是智能助手'
      await saveMessage(id, 'assistant', initContent)
      const resetMsgs = await getMessagesByConv(id)
      messageList.value = resetMsgs.map((m: ChatMessage) => ({ ...m, id: m.id || 0 }))
    }
  }

  /** 删除对话 */
  const delConv = async (id: number) => {
    try {
      const oldList = await getConversations()
      const oldIndex = oldList.findIndex((c: { conv_id: number }) => c.conv_id === id)
      await deleteConversation(id)
      await loadConvs()

      if (currentConvId.value === id) {
        const total = convList.value.length
        if (total === 0) {
          currentConvId.value = null
          messageList.value = []
          localStorage.removeItem('last_conv_id')
        } else {
          const targetConv = oldIndex > 0 ? convList.value[oldIndex - 1] : convList.value[0]
          await switchConv(targetConv.conv_id)
        }
      }

      nextTick(() => restoreScroll(convListRef))
      ElMessage.success('对话删除成功')
    } catch (err) {
      ElMessage.error('删除失败，请重试')
    }
  }

  /** 清空当前对话所有消息 */
  const clearAllChat = async () => {
    if (!currentConvId.value) return
    await clearConversationMessages(currentConvId.value)
    clearMessage()
    const initContent = '你好！我是智能助手'
    await saveMessage(currentConvId.value!, 'assistant', initContent)
    const msgs = await getMessagesByConv(currentConvId.value!)
    messageList.value = msgs.length
      ? msgs.map((m: ChatMessage) => ({ ...m, id: m.id || 0 }))
      : [{ role: 'assistant', content: initContent, id: 0 }]

    localStorage.removeItem(`chat_rate_${currentConvId.value}`)
    saveHistory(messageList)
    scrollToBottom(msgContainer)
    ElMessage.success('聊天记录已清空')
  }

  /** 快捷发送 */
  const quickSend = async (text: string) => {
    if (currentConvId.value === null) await newChat()
    return text
  }

  return {
    loadConvs,
    newChat,
    switchConv,
    delConv,
    clearAllChat,
    quickSend
  }
}