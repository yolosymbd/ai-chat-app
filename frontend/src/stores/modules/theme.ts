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

  // 空状态图片 → 百度飞桨静态CDN线上链接，完全不占用项目打包体积
  // const emptyImgSrc = computed(() => {
  //   switch (theme.value) {
  //     case 'light':
  //       return "https://aistudio.baidu.com/app/highcode/199918/files/empty-light.png"
  //     case 'dark':
  //       return "https://aistudio.baidu.com/app/highcode/199918/files/empty-dark.png"
  //     case 'tech':
  //       return "https://aistudio.baidu.com/app/highcode/199918/files/empty-tech.png"
  //     default:
  //       return "https://aistudio.baidu.com/app/highcode/199918/files/empty-light.png"
  //   }
  // })
const emptyImgSrc = computed(() => {
  switch (theme.value) {
    case 'light':
      return "https://ai-chat-vue-front-1314889124.cos.ap-beijing.myqcloud.com/empty-light.png"
    case 'dark':
      return "https://ai-chat-vue-front-1314889124.cos.ap-beijing.myqcloud.com/empty-dark.png"
    case 'tech':
      return "https://ai-chat-vue-front-1314889124.cos.ap-beijing.myqcloud.com/empty-tech.png"
    default:
      return "https://ai-chat-vue-front-1314889124.cos.ap-beijing.myqcloud.com/empty-light.png"
  }
})

  return {
    theme,
    themeClass,
    setTheme,
    emptyImgSrc
  }
})