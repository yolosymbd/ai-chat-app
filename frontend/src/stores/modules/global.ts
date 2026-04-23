// 全局 GlobalStore
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalStore = defineStore('global', () => {
  // 全局加载状态
  const loading = ref(false)

  // token 提示信息
  const tokenTip = ref('')

  // 开启 loading
  const startLoading = () => {
    loading.value = true
  }

  // 关闭 loading
  const stopLoading = () => {
    loading.value = false
  }

  // 设置 token 提示
  const setTokenTip = (msg: string) => {
    tokenTip.value = msg
  }

  return {
    loading,
    tokenTip,
    startLoading,
    stopLoading,
    setTokenTip
  }
})
