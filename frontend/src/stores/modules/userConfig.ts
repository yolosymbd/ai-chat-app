import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ModelOptions,ModelType } from '@/types/chat'

export const useUserConfigStore = defineStore('userConfig', () => {
  // 模型选择：初始化读取本地
  const modelType = ref<ModelType>(
    (localStorage.getItem('ai-model-type') as ModelType) || 'glm'
  )

  // ====================== 核心修复：切换模型自动持久化 ======================
  watch(
    modelType,
    (newVal) => {
      localStorage.setItem('ai-model-type', newVal)
    },
    { deep: true }
  )
  // ==========================================================================

  // 模型中文标签
  const modelLabel = computed(() => {
    const map: Record<ModelType, string> = {
      glm: '智谱 GLM',
      doubao: '字节 豆包 Doubao-Seed-1.8'
    }
    return map[modelType.value]
  })

  // 模型参数初始化
  const localConfig = JSON.parse(localStorage.getItem('ai-model-config') || '{}')
  const modelOptions = ref<ModelOptions>({
    temperature: localConfig.temperature ?? 0.3,
    top_p: localConfig.top_p ?? 0.5,
    max_tokens: 1024,
    stream: true,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  })

  // 参数变动自动保存本地
  watch(
    [() => modelOptions.value.temperature, () => modelOptions.value.top_p],
    () => {
      localStorage.setItem('ai-model-config', JSON.stringify({
        temperature: modelOptions.value.temperature,
        top_p: modelOptions.value.top_p
      }))
    },
    { deep: true }
  )

  // 参数持久化方法
  const saveModelConfig = () => {
    localStorage.setItem('ai-model-config', JSON.stringify({
      temperature: modelOptions.value.temperature,
      top_p: modelOptions.value.top_p
    }))
  }

  // 折叠面板状态
  const paramActive = ref<string[]>([])

  return {
    modelType,
    modelLabel,
    modelOptions,
    paramActive,
    saveModelConfig
  }
})