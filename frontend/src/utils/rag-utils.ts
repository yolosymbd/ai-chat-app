/**
 * 判断是否展示有效的RAG引用来源
 * 过滤空、无、无效片段标注
 */
export const hasValidRagSource = (content: string): boolean => {
  const match = content.match(/(?:【引用来源】|引用来源：)(.+)/)
  if (!match) return false

  const s = match[1].trim()
  return !!(s && s !== '无' && s !== '无相关知识库资料' && !/^(参考\d+、?)*$/.test(s))
}

/**
 * 格式化返回RAG来源展示文本
 * 无效内容直接返回空字符串，前端不渲染
 */
export const getRagSourceText = (content: string): string => {
  const match = content.match(/(?:【引用来源】|引用来源：)(.+)/)
  if (!match) return ''
  const s = match[1].trim()

  if (s === '无' || s === '无相关知识库资料' || /^(参考\d+、?)*$/.test(s)) {
    return ''
  }
  return `来源：${s}`
}
