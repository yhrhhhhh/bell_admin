import { createRouter, createWebHashHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/',
    name: '主页',
    component: () => import('../layout/index.vue'),
    redirect:'/index',
    children:[
      {
        path: '/index',
        name: '首页',
        component: () => import('../views/index/index.vue')
      },
      {
        path: '/sys/user',
        name: '用户管理',
        component: () => import('../views/sys/user/index.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: '/bsns/department',
        name: '外机控制面板',
        component: () => import('../views/bsns/Department'),
        meta: { requiresAuth: true }
      },
      {
        path: '/userCenter',
        name: '个人中心',
        component: () => import('../views/userCenter/index'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  // 检查目标路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查用户是否已登录
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const userInfo = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser')
    
    if (!token || !userInfo) {
      ElMessage.warning('请先登录')
      // 将用户重定向到登录页面
      next({
        path: '/login',
        // 保存目标路由，登录后可以直接跳转
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    // 不需要认证的路由直接放行
    next()
  }
})

export default router
