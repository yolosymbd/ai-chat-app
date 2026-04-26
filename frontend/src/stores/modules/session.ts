
// import { defineStore } from 'pinia'
// import { ref } from 'vue'
// import storage from '@/utils/storage'

// // 会话状态TS接口，全程强类型
// export interface SessionState {
//   token: string
//   userId: string | number
//   roles: string[]
//   isLogin: boolean
// }

// // Pinia Setup 标准写法，无任何持久化插件配置，抛弃报错的persist配置
// export const useSessionStore = defineStore('session', () => {
//   // 状态初始化：启动时从本地storage读取，自带默认值兜底
//   const token = ref<SessionState['token']>(storage.get('TOKEN', ''))
//   const userId = ref<SessionState['userId']>('')
//   const roles = ref<SessionState['roles']>([])
//   const isLogin = ref<SessionState['isLogin']>(false)

//   // ====================== Actions 业务方法 ======================
//   // 登录：更新状态 + 手动持久化到本地
//   const login = (userInfo: {
//     token: string
//     userId: string | number
//     roles?: string[]
//   }) => {
//     token.value = userInfo.token
//     userId.value = userInfo.userId
//     roles.value = userInfo.roles ?? []
//     isLogin.value = true
//     // 手动持久化，完全接管存储逻辑，不再依赖插件
//     storage.set('TOKEN', token.value)
//   }

//   // 登出：重置所有状态 + 清空本地存储
//   const logout = () => {
//     token.value = ''
//     userId.value = ''
//     roles.value = []
//     isLogin.value = false
//     storage.clear()
//   }

//   // 更新角色权限
//   const setRoles = (newRoles: string[]) => {
//     roles.value = newRoles
//   }

//   // ====================== 导出状态&方法 ======================
//   return {
//     token,
//     userId,
//     roles,
//     isLogin,
//     login,
//     logout,
//     setRoles
//   }
// })