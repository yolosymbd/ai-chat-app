/**
 * 消息时间人性化格式化
 * @param timeStr 后端返回的时间字符串
 */
export const formatTime = (timeStr: string | undefined | null): string => {
  if (!timeStr) return ""
  const d = new Date(timeStr)
  const now = Date.now()
  const diff = (now - d.getTime()) / 1000
  if (diff < 60) return "刚刚"
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return d.toLocaleDateString()
}