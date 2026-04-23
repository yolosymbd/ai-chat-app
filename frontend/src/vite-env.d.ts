/// <reference types="vite/client" />

declare module '@/*'
declare module '@c/*'
declare module '@api/*'

// 👇 只需要声明 Vue 单文件组件，不需要声明路径别名！
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 👇 补充 CSS 类型声明（解决你之前的 highlight.js 报错）
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}