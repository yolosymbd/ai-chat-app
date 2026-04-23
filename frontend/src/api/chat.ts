import type { ChatMessage, ReplyType, ModelOptions } from "@/types/chat"

import { API_BASE_URL } from '@/config/env'

// 流式对话
export const chatWithBackendStream = async (
  messages: ChatMessage[],
  signal: AbortSignal,
  onChunk: (content: string) => void,
  onType: (type: ReplyType, data?: any) => void,
  onError: (errMsg: string) => void = () => { },
  options: ModelOptions = {
    temperature: 0.3,
    top_p: 0.5,
    max_tokens: 1024,
    stream: true,
    model_type: 'glm'
  }
): Promise<void> => {
  const maxRetryCount = 3
  const retryDelayMs = 1000
  let currentRetryCount = 0

  const requestWithRetry = async (): Promise<void> => {
    try {
      const validMessages = messages
        .filter(msg => msg.content?.trim())
        .map(msg => ({ role: msg.role, content: msg.content }))

      const timeoutController = new AbortController()
      const mergedSignal = AbortSignal.any([signal, timeoutController.signal])
      const timeoutId = setTimeout(() => {
        console.log("⏰ 流式请求超时，自动熔断")
        timeoutController.abort()
      }, 120000)

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        signal: mergedSignal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: validMessages,
          temperature: options.temperature,
          top_p: options.top_p,
          max_tokens: options.max_tokens,
          stream: options.stream,
          model_type: options.model_type,
          frequency_penalty: options.frequency_penalty,
          presence_penalty: options.presence_penalty,
        }),
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const statusCode = response.status
        if (statusCode === 400) throw new Error('请求参数错误')
        if (statusCode === 401) throw new Error('API Key 无效或权限不足')
        if (statusCode === 403) throw new Error('无访问权限')
        if (statusCode === 422) throw new Error('内容违规 / 参数校验失败')
        if (statusCode === 424) throw new Error('上下文长度超限')
        if (statusCode === 429) throw new Error('请求频率超限，请稍后再试')
        if (statusCode === 500) throw new Error('服务器内部异常')
        if (statusCode === 503) throw new Error('服务不可用')
        if (statusCode === 529) throw new Error('模型繁忙，请重试')
        throw new Error(`请求失败 [${statusCode}]`)
      }

      if (!response.body) throw new Error('服务器无返回流')

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let receiveBuffer = ""
      let contentCache = ""
      let throttleTimer: number | null = null
      const throttleIntervalMs = 40
      const maxCacheThreshold = 500

      let tokenCount = 0
      const tokenWarnLimit = 1900
      let hasWarnedTokenLimit = false

      try {
        while (true) {
          if (mergedSignal.aborted) break
          const { done, value } = await reader.read()
          if (done) break

          receiveBuffer += decoder.decode(value, { stream: true })
          const dataLines = receiveBuffer.split("\n")
          receiveBuffer = dataLines.pop() || ""

          for (const line of dataLines) {
            const trimLine = line.trim()
            if (!trimLine || !trimLine.startsWith("data: ") || trimLine === "data:") continue

            const dataStr = trimLine.replace("data: ", "").trim()
            if (!dataStr || dataStr === "[DONE]") continue

            try {
              const jsonData = JSON.parse(dataStr)
              if (jsonData.type) {
                onType(jsonData.type as ReplyType, jsonData.data)
                continue
              }

              const content = jsonData.content || ""
              if (!content) continue

              tokenCount += Math.ceil(content.length / 2)
              if (tokenCount > tokenWarnLimit && !hasWarnedTokenLimit) {
                onError("⚠️ 即将达到 Token 上限，建议清空历史对话")
                hasWarnedTokenLimit = true
              }

              contentCache += content
              if (contentCache.length > maxCacheThreshold) {
                onChunk(contentCache)
                contentCache = ""
                if (throttleTimer) clearTimeout(throttleTimer)
                throttleTimer = null
              }

              if (!throttleTimer) {
                throttleTimer = window.setTimeout(() => {
                  onChunk(contentCache)
                  contentCache = ""
                  throttleTimer = null
                }, throttleIntervalMs)
              }
            } catch { continue }
          }
        }
      } finally {
        if (throttleTimer) clearTimeout(throttleTimer)
        if (contentCache) onChunk(contentCache)
        try { reader.cancel().catch(() => { }) } catch { }
      }

    } catch (error) {
      if (
        error instanceof Error &&
        error.name !== "AbortError" &&
        currentRetryCount < maxRetryCount
      ) {
        currentRetryCount++
        console.log(`🔄 网络异常，正在自动重连 ${currentRetryCount}/${maxRetryCount}`)
        onError(`⚠️ 网络波动，正在自动重连(${currentRetryCount}/${maxRetryCount})...`)
        await new Promise(resolve => setTimeout(resolve, retryDelayMs))
        await requestWithRetry()
        return
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.log("✅ 流式请求已主动中止")
          return
        }

        if (error.message.includes('超时')) {
          onError("⚠️ 请求超时，请检查网络或稍后重试")
        } else if (error.message.includes('429')) {
          onError("⚠️ 请求过于频繁，请稍后再发送")
        } else if (error.message.includes('API Key')) {
          onError("⚠️ 模型接口授权异常，请联系管理员")
        } else if (error.message.includes('服务器')) {
          onError("⚠️ 后端服务异常，请启动后端程序")
        } else {
          onError(`⚠️ ${error.message}`)
        }
      } else {
        onError("⚠️ 网络连接异常，正在尝试自动重连...")
      }
    }
  }

  await requestWithRetry()
}

// 保存消息
export const saveMessage = (convId: number, role: string, content: string) => {
  return fetch(`${API_BASE_URL}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conv_id: convId, role, content })
  })
}

// 删除单条消息
export const deleteMessage = (msgId: number) => {
  return fetch(`${API_BASE_URL}/message/${msgId}`, { method: "DELETE" })
}

// 生成标题
export const generateTitle = (data: { conv_id: number; model_type: string }) => {
  return fetch(`${API_BASE_URL}/gen_title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(res => res.json())
}