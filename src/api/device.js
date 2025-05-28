import { get, post, put, del } from '@/util/request'

// 获取设备列表
export function getDeviceList(params) {
  return get('/api/devices/', params)
}

// 获取设备树形结构
export function getDeviceTree() {
  return get('/api/devices/tree/')
}

// 获取设备状态
export function getDeviceStatus(deviceId) {
  return get(`/api/devices/${deviceId}/status/`)
}

// 发送控制命令
export function sendControlCommand(data) {
  return post('/api/device/send/', data)
}

// 批量控制设备
export function batchControlDevices(data) {
  return post('/api/device/batch-control/', data)
}

// 获取设备状态历史
export function getDeviceStatusHistory(deviceId, params) {
  return get(`/api/devices/${deviceId}/status_history/`, params)
}

// 更新设备信息
export function updateDevice(deviceId, data) {
  return put(`/api/devices/${deviceId}/`, data)
}

// 创建或更新Topic
export function createOrUpdateTopic(data) {
  return post('/api/device/topic/create_or_update/', data)
}

// 搜索Topic
export function searchTopic(uuid) {
  return get('/api/device/topic/search/', { uuid })
} 