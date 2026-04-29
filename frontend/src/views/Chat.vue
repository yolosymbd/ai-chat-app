<template>
  <div class="chat-page" :class="themeClass">
    <div class="sidebar">
      <!-- 主题切换 -->
      <div class="theme-switch">
        <el-button size="small" @click="setTheme('light')" :type="theme === 'light' ? 'primary' : 'default'">
          <div style="height: 30px;width: 40px;background-color:#fff;"></div>
        </el-button>
        <el-button size="small" @click="setTheme('dark')" :type="theme === 'dark' ? 'primary' : 'default'">
          <div style="height: 30px;width: 40px;background-color:#1df1d8;"></div>
        </el-button>
        <el-button size="small" @click="setTheme('tech')" :type="theme === 'tech' ? 'primary' : 'default'">
          <div style="height: 30px;width: 40px;background-color:#3b82f6;"></div>
        </el-button>
      </div>

      <el-button type="primary" block @click="newChat">+ 新建对话</el-button>
      <div class="conv-list" ref="convListRef">
        <div v-for="conv in convList" :key="conv.conv_id" class="conv-item"
          :class="{ active: currentConvId === conv.conv_id }" @click="switchConv(conv.conv_id)">
          <span class="conv-title" :title="conv.title">{{ conv.title }}</span>
          <span class="time">{{ formatTime(conv.created_at) }}</span>
          <el-icon class="del-icon" @click.stop="delConv(conv.conv_id)">
            <Close style="color:var(--bg-color)" />
          </el-icon>
        </div>
      </div>
    </div>

    <div class="main-box">
      <div class="chat-header">
        <img src="@/assets/image.png" alt="" class="logo" />
        <div class="title-group">
          <h2>智能聊天助手</h2>
          <div class="current-model">当前模型：{{ modelLabel }}</div>
        </div>
        <el-button text bg-color="#fff" class="clear-btn" @click="clearAllChat">清空当前对话记录</el-button>
      </div>

      <div v-if="convList.length === 0" class="empty-box">
        <img :src="emptyImgSrc" alt="暂无对话" class="empty-img" />
        <p class="empty-text">暂无对话，点击左侧新建对话开始聊天吧</p>
        <p class="empty-text">或 点击以下文本 快速生成对话</p>
        <div class="quick-questions">
          <div class="item" @click="inputText = '帮我写一段Vue3代码'; sendMessage()">
            ✍️ 写一段Vue3代码
          </div>
          <div class="item" @click="inputText = '北京今天天气'; sendMessage()">
            🌤 查北京天气
          </div>
          <div class="item" @click="inputText = '现在几点了'; sendMessage()">
            ⏰ 现在时间
          </div>
          <div class="item" @click="inputText = '计算1+2*3'; sendMessage()">
            🧮 数学计算
          </div>
        </div>
      </div>

      <template v-else>
        <div class="model-param-wrap">
          <el-collapse v-model="paramActive">
            <el-collapse-item title="⚙️ 模型参数配置" name="1">
              <div class="param-item">
                <label>温度 [越小 → 回答越严谨、固定、准确][越大 → 回答越创意、随机]：{{ modelOptions.temperature }}</label>
                <el-slider v-model.number="modelOptions.temperature" :min="0" :max="1" :step="0.01" />
              </div>
              <div class="param-item">
                <label>核采样 [越小保守聚焦 | 越大丰富发散]：{{ modelOptions.top_p }}</label>
                <el-slider v-model.number="modelOptions.top_p" :min="0" :max="1" :step="0.01" />
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>

        <div class="message-container" ref="msgContainer">
          <div v-for="(msg, index) in messageList" :key="index" class="message-item"
            :class="msg.role === 'user' ? 'mine' : 'ai'">
            <div v-if="msg.role === 'assistant'" class="avatar ai-avatar">
              <el-icon>
                <Service />
              </el-icon>
            </div>

            <div class="bubble-box">
              <div class="bubble">
                <span v-html="renderMarkdown(msg.content)"></span>
                <span v-if="loading && index === messageList.length - 1" class="type-cursor"></span>
              </div>

              <div class="msg-rate" v-if="msg.role === 'assistant'">
                <el-icon @click.stop="rateMsg(index, 'good', reGenerate)"
                  :class="msg.userRate === 'good' ? 'green' : ''">
                  <img src="@/assets/like.svg" style="width: 20px;height: 20px;" />
                </el-icon>
                <el-icon @click.stop="rateMsg(index, 'bad', reGenerate)" :class="msg.userRate === 'bad' ? 'red' : ''">
                  <img src="@/assets/no-like.svg" style="width: 20px;height: 20px;" />
                </el-icon>
              </div>

              <div class="msg-time">{{ formatTime(msg.created_at) }}</div>

              <div
                v-if="currentToolData && loading && index === messageList.length - 1 && (replyType === 'tool' || replyType === 'tool_data')"
                class="tool-card">
                <div class="tool-header">
                  <el-icon>
                    <Service />
                  </el-icon>
                  <span>正在调用 {{ getToolName(currentToolData.tool_name) }}</span>
                </div>
              </div>

              <div v-if="hasValidRagSource(msg.content)" class="rag-source">
                <el-icon>
                  <Document />
                </el-icon>
                <span>{{ getRagSourceText(msg.content) }}</span>
              </div>

              <div v-if="replyType === 'tool' && loading && index === messageList.length - 1" class="tool-tip">
                ⏳ 正在调用工具，请稍候…
              </div>
              <div v-if="replyType === 'normal' && loading && index === messageList.length - 1" class="tool-tip">
                🧠 正在生成回答，请稍候…
              </div>

              <div class="msg-tool" v-if="!loading">
                <span @click="copyMsg(msg.content)">
                  <el-icon>
                    <DocumentCopy />
                  </el-icon>复制
                </span>
                <span @click="speakMsg(msg.content)">
                  <el-icon>
                    <VideoPlay />
                  </el-icon>语音
                </span>
                <span @click="reSend(index)" v-if="msg.role === 'assistant' && index !== 0">
                  <el-icon>
                    <Refresh />
                  </el-icon>重发
                </span>
                <span @click="reGenerate(index)" v-if="msg.role === 'assistant' && index !== 0">
                  <el-icon>
                    <ArrowLeft />
                  </el-icon>重新生成
                </span>
              </div>
            </div>

            <div v-if="msg.role === 'user'" class="avatar user-avatar">
              <el-icon>
                <User />
              </el-icon>
            </div>
          </div>

          <div v-if="loading" class="loading-text">
            <el-icon class="loading-icon" :size="20">
              <Loading />
            </el-icon>
            <span>AI 思考中...</span>
          </div>
        </div>

        <div class="rag-upload" v-if="!loading">
          <el-upload class="file-upload" :show-file-list="false" :before-upload="beforeUpload"
            :http-request="handleUpload" action="#" accept=".txt,.pdf,.docx" multiple>
            <el-button size="small" plain class="choose-file">选择文档（TXT/PDF/DOCX）</el-button>
            <span class="upload-tip">{{ fileInfo || '📁 上传后AI将按文档回答' }}</span>
          </el-upload>
        </div>

        <div class="chat-footer">
          <div v-if="tokenTip" class="token-warning">{{ tokenTip }}</div>
          <el-input ref="inputRef" v-model="inputText" placeholder="请输入内容，按回车发送" @keyup.enter="sendMessage" clearable
            :disabled="loading" class="chat-input" :rows="4" type="textarea" :autosize="{ minRows: 1, maxRows: 4 }" />
          <div class="footer-btns">
            <div class="model-select-wrap">
              <div class="model-left">
                <span class="model-label">🤖</span>
                <el-select v-model="modelType" placeholder="请选择模型" class="model-select">
                  <el-option label="智谱 GLM" value="glm" />
                  <el-option label="字节 豆包 Doubao" value="doubao" />
                </el-select>
                <!-- <button @click="checkHealth">检查后端状态</button> -->
              </div>
              <el-button type="default" v-if="loading" @click="abortStream" class="stop-btn">停止</el-button>
              <el-button type="primary" @click="sendMessage" :loading="loading" v-else class="send-btn">发送</el-button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import {
  Service, User, Loading, DocumentCopy,
  Close, VideoPlay, Document, Refresh, ArrowLeft
} from '@element-plus/icons-vue'

// ========== 原生工具 ==========
import { formatTime } from '@/utils/time'
import { renderMarkdown } from '@/utils/markdown'
import { hasValidRagSource, getRagSourceText } from '@/utils/rag-utils'

// ========== 通用纯函数工具 ==========
import { getToolName, speakMsg, copyMsg } from '@/utils/chatHelper'
import { scrollToBottom, saveScroll } from '@/utils/scrollStorage'

// ========== 业务 Hooks 全拆分 ==========
import { useChatUpload } from './chat/useChatUpload'
import { useChatRate } from './chat/useChatRate'
import { useConversation } from './chat/useConversation'
import { useChat } from './chat/useChat'

// ========== Store ==========
import { useThemeStore } from '@/stores/modules/theme'
import { useUserConfigStore } from '@/stores/modules/userConfig'
import { useGlobalStore } from '@/stores/modules/global'
import { useChatStore } from '@/stores/modules/chat'

//==============API============
import { checkKnowledgeBaseApi } from "@/api"
// 前后端连通性 “心跳检测”
// import { API_BASE_URL } from '@/config/env'

// const checkHealth = async () => {
//   try {
//     const res = await fetch(`${API_BASE_URL}/health`)
//     const data = await res.json()
//     alert(`后端状态：${data.status} - ${data.message}`)
//   } catch (err) {
//     alert('后端服务不可用！')
//     console.error(err)
//   }
// }

// ========== Store 解构 ==========
const themeStore = useThemeStore()
const { theme, themeClass, emptyImgSrc } = storeToRefs(themeStore)
const { setTheme } = themeStore

const userConfigStore = useUserConfigStore()
const { modelType, modelLabel, modelOptions, paramActive } = storeToRefs(userConfigStore)
const { saveModelConfig } = userConfigStore

const globalStore = useGlobalStore()
const { loading, tokenTip } = storeToRefs(globalStore)

const chatStore = useChatStore()
const { messageList, currentConvId } = storeToRefs(chatStore)

// ========== 页面基础状态 ==========
const inputText = ref('')
const msgContainer = ref<HTMLElement | null>(null)
const inputRef = ref<any>(null)
const convList = ref<any[]>([])
const convListRef = ref<HTMLElement | null>(null)
const replyType = ref<'normal' | 'tool' | 'tool_data'>('normal')
const currentToolData = ref<any>(null)

// ========== 注入拆分后的所有方法 ==========
// 上传
const { fileInfo, beforeUpload, handleUpload, checkKnowledgeBase } = useChatUpload()
// 点赞反馈
const { loadRateFromLocal, loadFeedbackFromBackend, rateMsg } = useChatRate()
// 对话管理
const { loadConvs, newChat, switchConv, delConv, clearAllChat } = useConversation(
  convList, convListRef, msgContainer, loadFeedbackFromBackend, loadRateFromLocal
)
// 核心聊天发送逻辑
const { sendMessage, reGenerate, abortStream, reSend } = useChat(
  inputText, msgContainer, replyType, currentToolData, loadRateFromLocal, loadFeedbackFromBackend, loadConvs,newChat
)

// ========== 页面生命周期 ==========
onMounted(async () => {
  ElMessage.closeAll()
  await checkKnowledgeBase()
  await loadConvs()

  // 恢复上次对话
  const lastId = localStorage.getItem('last_conv_id')
  if (lastId) {
    const existConv = convList.value.find(c => c.conv_id === Number(lastId))
    if (existConv) {
      await switchConv(Number(lastId))
    } else if (convList.value.length > 0) {
      await switchConv(convList.value[0].conv_id)
    } else {
      await newChat()
    }
  } else if (convList.value.length > 0) {
    await switchConv(convList.value[0].conv_id)
  } else {
    await newChat()
  }

  scrollToBottom(msgContainer)
  inputRef.value?.focus()

  nextTick(() => {
    const activeEl = convListRef.value?.querySelector('.conv-item.active')
    if (activeEl) activeEl.scrollIntoView({ block: 'center', behavior: 'auto' })
    saveScroll(convListRef)
  })
})

// ========== 模型切换监听 ==========
watch(
  modelType,
  async (newVal) => {
    const modelMap: Record<string, string> = {
      glm: '智谱 GLM',
      doubao: '字节 豆包 Doubao-Seed-1.8'
    }
    const modelName = modelMap[newVal] || '未知模型'
    try {
      // 接口调用本身不报错 = 请求连通成功
      const res = await checkKnowledgeBaseApi()
      if (!res.ok) throw new Error('后端未连接')
      ElMessage.success(`模型切换成功：${modelName}`)

    } catch (err) {
      ElMessage.warning(`模型已切换为【${modelName}】，请发送消息生效；若调用失败请检查后端API Key`)
    }
  },
  { immediate: true }
)

// ========== 参数修改自动保存配置 ==========
watch(
  [() => modelOptions.value.temperature, () => modelOptions.value.top_p],
  () => saveModelConfig(),
  { deep: true }
)
</script>

<style lang="scss" scoped src="@/styles/chat.scss"></style>