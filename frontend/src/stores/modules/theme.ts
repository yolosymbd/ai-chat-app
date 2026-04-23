// 主题 ThemeStore
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 读取本地存储初始化
  const theme = ref(localStorage.getItem('ai-theme') || 'light')

  // 修改主题 + 自动存本地
  const setTheme = (val: 'light' | 'dark' | 'tech') => {
    theme.value = val

    localStorage.setItem('ai-theme', val)
  }

  // 主题class
  const themeClass = computed(() => `theme-${theme.value}`)

  // 空状态图片
  const emptyImgSrc = computed(() => {
    switch (theme.value) {
      case 'light':
        return new URL('@/assets/empty-light.png', import.meta.url).href
      case 'dark':
        return new URL('@/assets/empty-dark.png', import.meta.url).href
      case 'tech':
        return new URL('@/assets/empty-tech.png', import.meta.url).href
      default:
        return new URL('@/assets/empty-light.png', import.meta.url).href
    }
  })

  return {
    theme,
    themeClass,
    setTheme,
    emptyImgSrc
  }
})