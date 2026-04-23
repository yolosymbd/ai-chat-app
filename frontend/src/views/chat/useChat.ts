// 核心聊天 Hook：发送、流式、重生成、终止
import { ref, reactive, Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import type { ChatMessage, ReplyType, ToolCallData } from '@/types/chat'
import {
  chatWithBackendStream,
  saveMessage,
  getMessagesByConv,
  deleteMessage,
  generateTitle
} from '@/api'
import { useChatStore, useUserConfigStore, useGlobalStore } from '@/stores'
import { getTotalChatToken, MODEL_MAX_TOKEN, TOKEN_WARN_RATE } from '@/utils/chat-token'
import { scrollToBottom, saveHistory } from '@/utils/scrollStorage'

export const useChat = (
  inputText: Ref<string>,
  msgContainer: Ref<HTMLElement | null>,
  replyType: Ref<ReplyType>,
  currentToolData: Ref<ToolCallData | null>,
  loadRateFromLocal: Function,
  loadFeedbackFromBackend: Function,
  loadConvs: Function
) => {
  // store 注入
  const chatStore = useChatStore()
  const userConfigStore = useUserConfigStore()
  const globalStore = useGlobalStore()

  const { messageList, currentConvId } = storeToRefs(chatStore)
  const { modelOptions, modelType } = storeToRefs(userConfigStore)
  const { loading, tokenTip } = storeToRefs(globalStore)
  const { startLoading, stopLoading, setTokenTip } = globalStore

  const controller = ref<AbortController | null>(null)

  /** 发送消息主逻辑（完整原版流式逻辑） */
  const sendMessage = async (reuseId?: number, addUserMsg = true, targetUserIndex?: number) => {
    currentToolData.value = null
    replyType.value = 'normal'

    if (currentConvId.value === null) {
      ElMessage.warning('请先新建对话')
      return
    }

    const val = inputText.value?.trim()
    if (!val || loading.value) return

    // Token超限校验
    const totalToken = getTotalChatToken([
      ...messageList.value,
      { role: 'user', content: val, userRate: '' }
    ])
    if (totalToken > MODEL_MAX_TOKEN * TOKEN_WARN_RATE) {
      setTokenTip(`⚠️ 对话上下文即将超限(${totalToken}/${MODEL_MAX_TOKEN})，请清空对话`)
      ElMessage.warning(tokenTip.value)
      return
    }
    setTokenTip('')

    // 添加用户消息
    if (addUserMsg) {
      messageList.value.push({ role: 'user', content: val, userRate: '' })
      await saveMessage(currentConvId.value!, 'user', val)
    }

    inputText.value = ''
    saveHistory(messageList)
    scrollToBottom(msgContainer)

    try {
      startLoading()
      controller.value = new AbortController()

      const aiMsg = reactive<ChatMessage>({ id: 0, role: 'assistant', content: '', userRate: '' })
      if (targetUserIndex !== undefined) {
        messageList.value.splice(targetUserIndex + 1, 0, aiMsg)
      } else {
        messageList.value.push(aiMsg)
      }
      scrollToBottom(msgContainer)

      // 上下文切片截断
      const sliceEnd = targetUserIndex !== undefined ? targetUserIndex + 1 : messageList.value.length
      const finalMessages = [
        ...messageList.value.slice(0, sliceEnd).filter(msg => msg.content.trim())
      ].slice(-10)

      let buffer = ''

      // 流式请求
      await chatWithBackendStream(
        finalMessages,
        controller.value.signal,
        (chunk) => {
          buffer += chunk
          aiMsg.content = buffer
          scrollToBottom(msgContainer)
          saveHistory(messageList)
        },
        (type, data?: any) => {
          replyType.value = type
          if (type === 'tool' || type === 'tool_data') {
            currentToolData.value = data as ToolCallData
          }
        },
        (errMsg) => {
          stopLoading()
          ElMessage.error(`请求失败：${errMsg}`)
        },
        { ...modelOptions.value, model_type: modelType.value }
      )

      aiMsg.content = buffer
      await saveMessage(currentConvId.value!, 'assistant', buffer)
      const msgs = await getMessagesByConv(currentConvId.value!)
      const lastAi = msgs.filter((m: any) => m.role === 'assistant').at(-1)
      if (lastAi) aiMsg.id = lastAi.id

      // 加载评分
      loadRateFromLocal(currentConvId.value)
      if (aiMsg.id) await loadFeedbackFromBackend(aiMsg.id, aiMsg)

      scrollToBottom(msgContainer)
    } catch (err: unknown) {
      stopLoading()
      ElMessage.error('错误：' + (err instanceof Error ? err.message : '生成失败'))
    } finally {
      stopLoading()
      replyType.value = 'normal'
      currentToolData.value = null

      // 自动生成对话标题
      const hasUserMsg = messageList.value.some(m => m.role === 'user')
      if (hasUserMsg) {
        try {
          await generateTitle({
            conv_id: currentConvId.value!,
            model_type: modelType.value
          })
        } catch (e) {
          console.log('标题生成异常，已静默兜底', e)
        }
        await loadConvs()
      }
    }
  }

  /** 重新生成AI回复 */
  const reGenerate = async (clickAiIndex: number) => {
    if (loading.value) return
    const oldAiMsg = messageList.value[clickAiIndex]
    const oldUserMsg = messageList.value[clickAiIndex - 1]

    if (!oldAiMsg || oldAiMsg.role !== 'assistant' || !oldUserMsg || oldUserMsg.role !== 'user') {
      ElMessage.warning('消息配对异常，无法重生成')
      return
    }

    // 删除后端旧消息
    try {
      if (oldAiMsg.id && oldAiMsg.id > 0) {
        const aiDelRes = await deleteMessage(oldAiMsg.id)
        if (!aiDelRes.ok) throw new Error(`HTTP状态错误: ${aiDelRes.status}`)
      }
    } catch (err) {
      console.error('❌ 删除旧AI消息失败', err)
      ElMessage.error('删除旧AI消息失败')
      return
    }
    try {
      if (oldUserMsg.id && oldUserMsg.id > 0) {
        const userDelRes = await deleteMessage(oldUserMsg.id)
        if (!userDelRes.ok) throw new Error(`HTTP状态错误: ${userDelRes.status}`)
      }
    } catch (err) {
      console.error('❌ 删除旧用户消息异常', err)
      ElMessage.error('删除旧用户消息失败，请重试')
      return
    }

    messageList.value.splice(clickAiIndex - 1, 2)
    inputText.value = oldUserMsg.content.trim()
    await sendMessage(0, true)
  }

  /** 终止流式请求 */
  const abortStream = () => {
    if (controller.value) {
      controller.value.abort()
      controller.value = null
    }
    stopLoading()
    replyType.value = 'normal'
    currentToolData.value = null
    inputText.value = ''
    ElMessage.info('已停止生成')
  }

  /** 重填用户消息到输入框 */
  const reSend = (index: number) => {
    const userMsg = messageList.value[index - 1]
    if (userMsg?.role === 'user') {
      inputText.value = userMsg.content
    }
  }

  return {
    sendMessage,
    reGenerate,
    abortStream,
    reSend
  }
}