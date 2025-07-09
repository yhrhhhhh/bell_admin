import { createApp } from 'vue'
import SvgIcon from '@/icons'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
// 引入Element Plus图标
import * as ElementPlusIcons from '@element-plus/icons-vue'
// 国际化中文
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import '@/assets/styles/border.css'
import '@/assets/styles/reset.css'
import '@/styles/index.scss'


const app = createApp(App)
SvgIcon(app)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIcons)) {
  app.component(key, component)
}

app.use(store)
app.use(router)
app.use(ElementPlus, {
    locale: zhCn,
})
app.mount('#app')
