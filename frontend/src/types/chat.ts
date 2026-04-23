// 聊天消息实体定义
export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  id?: number
  // 核心：必填！严格限定取值，永远没有 undefined
  userRate?: "" | "good" | "bad"
  created_at?: string
}
// 工具调用结构化数据（用于函数调用/插件调用）
export interface ToolCallData {
  tool_name: string
  tool_params: Record<string, any>
  tool_result: Record<string, any>
}

// 消息回复类型：普通文本 / 工具调用 / 工具数据
export type ReplyType = 'normal' | 'tool' | 'tool_data' | ''

// 大模型类型（与前端下拉框 value 保持一致）
export type ModelType = 'glm' | 'doubao'

// 大模型推理参数配置（已添加 model_type）
export interface ModelOptions {
  model_type?: ModelType      // 👈 新增：模型类型（智谱/GPT/DeepSeek/通义千问）
  temperature?: number       // 温度值：控制随机性
  top_p?: number             // 核采样：控制输出多样性
  max_tokens?: number        // 最大生成长度
  stream?: boolean           // 是否开启流式输出
  frequency_penalty?: number // 频率惩罚：减少重复内容
  presence_penalty?: number  // 存在惩罚：提升话题新鲜度
}
