import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'


const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)


// src/stores/index.ts
export * from './modules/chat'
export * from './modules/userConfig'
export * from './modules/global'
export * from './modules/theme'

export default pinia
