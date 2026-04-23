// 后端基础地址统一配置
const BASE_API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:9000'

/** GET 请求通用封装 */
export const httpGet = async <T = any>(url: string) => {
  const res = await fetch(`${BASE_API}${url}`)
  if (!res.ok) throw new Error(`请求失败 ${res.status}`)
  return res.json() as Promise<T>
}

/** POST 请求通用封装 */
export const httpPost = async <T = any>(url: string, data: unknown) => {
  const res = await fetch(`${BASE_API}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error(`请求失败 ${res.status}`)
  return res.json() as Promise<T>
}

/** DELETE 请求通用封装 */
export const httpDelete = async <T = any>(url: string) => {
  const res = await fetch(`${BASE_API}${url}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`请求失败 ${res.status}`)
  return res.json() as Promise<T>
}