import { API_BASE_URL } from '@/config/env'

// 上传文件
export const uploadKnowledgeFiles = (formData: FormData) => {
  return fetch(`${API_BASE_URL}/upload_knowledge`, { method: "POST", body: formData })
}

// 检查知识库
export const checkKnowledgeBaseApi = () => {
  return fetch(`${API_BASE_URL}/check_knowledge`)
}