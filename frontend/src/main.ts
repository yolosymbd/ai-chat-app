import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
// import ElementPlus from 'element-plus'//对象、插件，直接用
// import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'//createPinia是函数，函数调用需要加（）
import router from './router/index.ts' // 导入路由
import 'element-plus/theme-chalk/el-message.css'
import 'element-plus/theme-chalk/el-notification.css'
// import cloudbase from "@cloudbase/js-sdk";
// // 1. Pinia：是函数 → 必须执行
// typeof createPinia === 'function'

// // 2. ElementPlus：是对象 → 直接用
// typeof ElementPlus === 'object'

// 别人源码里是这样写的
// export default ElementPlus
// 别人源码里是这样写的
// export const createPinia = ...
// export const someOtherFunc = ...

// ======================
// 👇 只加这一段解决 INVALID_ENV
// ======================
// const cbApp = cloudbase.init({
//   env: "ai-chat-vue-front-d8d2jy6c43054c" // 你的环境ID
// });
// cbApp.auth().anonymousAuthProvider().signIn().then(() => {
//   console.log("✅ CloudBase 登录成功");
// });


const app = createApp(App)
app.use(createPinia())
// app.use(ElementPlus)
app.use(router) // 挂载路由
app.mount('#app')
