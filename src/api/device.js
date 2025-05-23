import request from '@/utils/request'

// 获取设备列表
export function getDeviceList(params) {
  return request({
    url: '/api/devices/',
    method: 'get',
    params
  })
}

// 获取设备树形结构
export function getDeviceTree() {
  return request({
    url: '/api/devices/tree/',
    method: 'get'
  })
}

// 获取设备状态
export function getDeviceStatus(deviceId) {
  return request({
    url: `/api/devices/${deviceId}/status/`,
    method: 'get'
  })
}

// 发送控制命令
export function sendControlCommand(data) {
  return request({
    url: '/api/control/send_command/',
    method: 'post',
    data
  })
}

// 批量控制设备
export function batchControlDevices(data) {
  return request({
    url: '/api/control/batch_control/',
    method: 'post',
    data
  })
}

// 获取设备状态历史
export function getDeviceStatusHistory(deviceId, params) {
  return request({
    url: `/api/devices/${deviceId}/status_history/`,
    method: 'get',
    params
  })
}

// 更新设备信息
export function updateDevice(deviceId, data) {
  return request({
    url: `/api/devices/${deviceId}/`,
    method: 'put',
    data
  })
}

// 创建或更新Topic
export function createOrUpdateTopic(data) {
  return request({
    url: '/api/device/topic/create_or_update/',
    method: 'post',
    data
  })
}

// 搜索Topic
export function searchTopic(uuid) {
  return request({
    url: `/api/device/topic/search/`,
    method: 'get',
    params: { uuid }
  })
} 