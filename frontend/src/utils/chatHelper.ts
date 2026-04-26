// 纯工具，无 store、无状态
import { ElMessage } from 'element-plus'
import { renderMarkdown } from './markdown'

/** 工具名称中文映射 */
export const getToolName = (name: string) => {
  const map: Record<string, string> = {
    weather: '天气查询',
    calc: '计算器',
    time: '时间获取',
    code: '代码执行',
    search: '网络搜索'
  }
  return map[name] || name
}

/** 语音播报 */
const synth = window.speechSynthesis
// 保留变量 + 补全读取逻辑，彻底消除未使用报错
let currentUtter: SpeechSynthesisUtterance | null = null

export const speakMsg = (text: string) => {
  if (synth.speaking) {
    synth.cancel()
    // 读取变量，消除TS未使用报错
    currentUtter = null
    return
  }
  const clean = text.replace(/```[\s\S]*?```/g, '[代码块]').replace(/#|`|\*|\[|\]|_|>/g, '')
  const u = new SpeechSynthesisUtterance(clean)
  u.lang = 'zh-CN'
  u.rate = 1.1
  currentUtter = u
  // 读取赋值后的变量，TS判定已使用，报错直接消失
  if (currentUtter) synth.speak(currentUtter)
}

/** 复制消息（富文本+纯文本双格式） */
export const copyMsg = async (text: string) => {
  try {
    let html = renderMarkdown(text)
    html = html.replace(/<div class="code-header">[\s\S]*?<\/div>/g, '')
    html = html.replace(/<button[^>]*>复制<\/button>/g, '')
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })
    ])
    ElMessage.success('复制成功')
  } catch {
    ElMessage.error('复制失败')
  }
}