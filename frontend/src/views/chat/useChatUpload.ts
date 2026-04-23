import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadKnowledgeFiles, checkKnowledgeBaseApi } from '@/api'

export const useChatUpload = () => {
  const fileInfo = ref('')

  /** 上传文件格式&大小校验 */
  const beforeUpload = (file: File) => {
    const allowedExts = ['.txt', '.pdf', '.docx']
    const fileName = file.name.toLowerCase()
    const isValid = allowedExts.some(ext => fileName.endsWith(ext))

    if (!isValid) {
      ElMessage.error('❌ 仅支持 TXT/PDF/DOCX 格式！')
      return false
    }
    if (file.size / 1024 / 1024 >= 10) {
      ElMessage.error('❌ 文件不能超过10MB！')
      return false
    }
    return true
  }

  /** 文件上传请求 */
  const handleUpload = async (file: any) => {
    const formData = new FormData()
    formData.append('files', file.file)
    try {
      const res = await uploadKnowledgeFiles(formData)
      const data = await res.json()
      if (data.success) {
        fileInfo.value = `✅ 上传成功：${data.msg}`
        ElMessage.success('知识库已生效！')
      } else {
        fileInfo.value = '❌ 上传失败'
        ElMessage.error('上传失败')
      }
    } catch (err) {
      fileInfo.value = '⚠️ 后端未启动'
      ElMessage.error('请先启动后端服务')
    }
  }

  /** 检查知识库是否已有内容 */
  const checkKnowledgeBase = async () => {
    try {
      const res = await checkKnowledgeBaseApi()
      const data = await res.json()
      if (!data.has_content) {
        fileInfo.value = '未选择任何文件'
      }
    } catch (e) {
      fileInfo.value = '未选择任何文件'
    }
  }

  return {
    fileInfo,
    beforeUpload,
    handleUpload,
    checkKnowledgeBase
  }
}