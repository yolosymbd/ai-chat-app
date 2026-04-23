import { marked } from "marked"
import hljs from "highlight.js"
import { markedHighlight } from "marked-highlight"
import "highlight.js/styles/vs2015.css"

// marked基础全局配置
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false,
})

// 代码高亮插件注册
marked.use(markedHighlight({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
    }
    return hljs.highlightAuto(code).value
  }
}))

/**
 * AI返回文本统一清洗：过滤RAG来源、多余换行、无效字符
 */
const cleanMarkdownSource = (text: string): string => {
  return text
    .replace(/\n*引用来源：.*$/gm, '')
    .replace(/【引用来源】.*$/gm, '')
    .replace(/\n*(参考\d+、?)*$/gm, '')
    .replace(/^\s*---\s*$/gm, '')
    .replace(/^\s*无\s*$/gm, '')
    .replace(/\n\s*\n/g, '\n')
    .trim()
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

/**
 * Markdown主渲染函数
 * @param text AI原始返回内容
 */
export const renderMarkdown = (text: string): string => {
  if (!text) return ''

  let fixedText = cleanMarkdownSource(text)
  let html = marked.parse(fixedText) as string

  // 过滤空代码块
  html = html.replace(/<pre><code class="language-[^"]+"><\/code><\/pre>/g, '')
  // 代码块增加语言标签+复制按钮
  html = html.replace(/<pre><code class="language-([^"]+)">/g,
    (_match, lang) => `<pre><div class="code-header"><span class="lang">${lang.toUpperCase()}</span><button class="copy-btn" onclick="copyCode(this)">复制</button></div><code class="language-${lang}">`)

  return html
}

/**
 * 工具调用JSON前缀清洗
 */
export const cleanJsonPrefix = (str: string): string => {
  if (!str) return ''
  let clean = str.replace(/^json\s*/i, '')
  clean = clean.replace(/[`\s]+$/, '')
  return clean
}

/**
 * 判断字符串是否为合法JSON
 */
export const isValidJson = (str: string): boolean => {
  if (!str) return false
  const cleanStr = cleanJsonPrefix(str)
  if (!cleanStr.startsWith('{') || !cleanStr.endsWith('}')) return false
  try { JSON.parse(cleanStr); return true } catch { return false }
}

/**
 * 代码块富文本剪贴板复制
 */
export const copyCodeToClipboard = async (markdownText: string, htmlText: string) => {
  try {
    const clipboardItem = new ClipboardItem({
      'text/html': new Blob([htmlText], { type: 'text/html' }),
      'text/plain': new Blob([markdownText], { type: 'text/plain' })
    })
    await navigator.clipboard.write([clipboardItem])
    return true
  } catch (err) {
    console.error('代码复制失败', err)
    return false
  }
}