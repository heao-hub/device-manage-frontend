import { CanvasRenderer } from 'echarts/renderers'
import * as echarts from 'echarts'
echarts.use(CanvasRenderer)

import { createApp } from 'vue'
import App from './App.vue'

import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 在应用启动时检查认证状态
const token = localStorage.getItem('app_token');
if (!token) {
  // 如果没有token，确保重定向到登录页
  router.push('/login');
}

const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
