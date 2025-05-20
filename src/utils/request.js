import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API || 'http://localhost:8000', // API 的基础URL
  timeout: 5000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 获取服务器基础URL
function getServerUrl() {
  return process.env.VUE_APP_BASE_API || 'http://localhost:8000/'
}

// 不需要token的白名单路径
const whiteList = ['/user/login/']

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 打印请求信息
    console.log('发送请求:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    })
    
    // 判断请求是否在白名单中
    const isWhiteList = whiteList.some(path => config.url.includes(path))
    
    if (!isWhiteList) {
      // 从 localStorage 获取 token
      const token = localStorage.getItem('token')
      if (token) {
        // 移除Bearer前缀后发送Token
        config.headers['Authorization'] = token.replace('Bearer ', '')
      } else {
        // 如果不是白名单且没有token，拒绝请求
        return Promise.reject('未登录或 token 已失效')
      }
    }
    
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 打印响应信息
    console.log('收到响应:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    })
    
    const res = response.data
    
    // 如果响应成功且有数据，直接返回数据
    if (response.status === 200) {
      return res
    }
    
    // 处理其他状态码
    ElMessage({
      message: res.message || '请求失败',
      type: 'error',
      duration: 5 * 1000
    })
    
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  error => {
    console.error('响应错误:', error)
    console.error('错误详情:', {
      response: error.response,
      message: error.message,
      data: error.response?.data
    })
    
    // 处理 401 错误（未授权）
    if (error.response && error.response.status === 401) {
      ElMessage({
        message: 'Token已过期，请重新登录',
        type: 'error',
        duration: 5 * 1000
      })
      // 清除token并跳转登录页
      localStorage.removeItem('token')
      router.push('/login')
      return Promise.reject(new Error('Token已过期'))
    }
    
    // 处理其他错误
    ElMessage({
      message: error.response?.data?.message || error.message || '请求失败',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

// 封装GET请求
function get(url, params) {
  return service({
    url,
    method: 'get',
    params
  })
}

// 封装POST请求
function post(url, data) {
  return service({
    url,
    method: 'post',
    data
  })
}

// 封装PUT请求
function put(url, data) {
  return service({
    url,
    method: 'put',
    data
  })
}

// 封装DELETE请求
function del(url, params) {
  return service({
    url,
    method: 'delete',
    params
  })
}

// 导出所有方法
const requestUtil = {
  get,
  post,
  put,
  del,
  getServerUrl
}

export default requestUtil
export { getServerUrl } 