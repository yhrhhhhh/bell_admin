<template>
  <div class="app-container" :class="{'dark-theme': isDarkTheme}">
    <div class="header-container">
      <div class="filter-container">
        <el-input v-model="listQuery.name" placeholder="名称搜索" style="width: 200px;" class="filter-item"/>
        <el-select v-model="listQuery.status" placeholder="状态搜索" clearable style="width: 120px" class="filter-item">
          <el-option v-for="item in statusOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
        <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>
        <el-button class="filter-item" type="success" icon="el-icon-refresh" @click="handleBatchControl">批量操作</el-button>
      </div>
      <el-switch
        v-model="isDarkTheme"
        active-text="深色主题"
        inactive-text="浅色主题"
        class="theme-switch"
      />
    </div>

    <el-row :gutter="20">
      <!-- 左侧楼层树 -->
      <el-col :span="4">
        <el-card class="tree-card" :class="{'dark': isDarkTheme}">
          <template #header>
            <div class="tree-header">
              <span><i class="el-icon-office-building"></i> 楼层导航</span>
              <el-button type="text" @click="refreshTree">
                <i class="el-icon-refresh"></i>
              </el-button>
            </div>
          </template>
          <el-tree
            :data="floorData"
            :props="defaultProps"
            @node-click="handleNodeClick"
            default-expand-all
            node-key="id"
            highlight-current
            :expand-on-click-node="false"
            class="custom-tree"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span class="node-icon">
                  <i v-if="data.type === 'building'" class="el-icon-office-building"></i>
                  <i v-else-if="data.type === 'floor'" class="el-icon-house"></i>
                </span>
                <span class="node-label">{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧设备卡片 -->
      <el-col :span="20">
        <el-row :gutter="20">
          <el-col :span="8" v-for="device in deviceList" :key="device.id">
            <el-card class="device-card" :class="{'running': device.status === 'running'}">
              <div class="device-header">
                <span class="device-name">{{ device.name }}</span>
                <el-dropdown trigger="click" @command="command => handleCommand(command, device)">
                  <i class="el-icon-more"></i>
                  <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item command="control">控制</el-dropdown-item>
                    <el-dropdown-item command="detail">详情</el-dropdown-item>
                  </el-dropdown-menu>
                </el-dropdown>
              </div>
              <div class="device-content">
                <div class="temp-display">
                  <i class="el-icon-house"></i>
                  <span class="temp-value">{{ device.current_temp }}°C</span>
                </div>
                <div class="device-info">
                  <div class="info-item">
                    <span class="label">设置温度：</span>
                    <span class="value">{{ device.set_temp }}°C</span>
                  </div>
                  <div class="info-item">
                    <span class="label">运行时间：</span>
                    <span class="value">{{ device.running_time }}H</span>
                  </div>
                </div>
                <div class="device-status">
                  <el-tag :type="getStatusType(device.status)" size="small">
                    {{ getStatusText(device.status) }}
                  </el-tag>
                  <div class="mode-icons">
                    <i :class="getModeIcon(device.mode)" :title="getModeText(device.mode)"></i>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <!-- 控制弹窗 -->
    <el-dialog title="设备控制" :visible.sync="dialogVisible" width="30%" custom-class="control-dialog">
      <el-form :model="controlForm" label-width="100px">
        <el-form-item label="运行状态">
          <el-switch v-model="controlForm.running"/>
        </el-form-item>
        <el-form-item label="设置温度">
          <el-input-number v-model="controlForm.temp" :min="16" :max="30" :step="0.5"/>
        </el-form-item>
        <el-form-item label="运行模式">
          <el-radio-group v-model="controlForm.mode">
            <el-radio label="cooling">制冷</el-radio>
            <el-radio label="heating">制热</el-radio>
            <el-radio label="fan">送风</el-radio>
            <el-radio label="dehumidify">除湿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleControlSubmit">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { get } from '@/util/request'

export default {
  name: 'Department',
  data() {
    return {
      isDarkTheme: true,
      listQuery: {
        name: '',
        status: ''
      },
      statusOptions: [
        { key: 'running', label: '运行' },
        { key: 'stopped', label: '停止' },
        { key: 'fault', label: '故障' }
      ],
      floorData: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      deviceList: [],
      dialogVisible: false,
      controlForm: {
        running: true,
        temp: 25,
        mode: 'cooling'
      },
      currentDevice: null
    }
  },
  created() {
    this.fetchBuildingTree()
    this.fetchDeviceList()
  },
  methods: {
    handleFilter() {
      this.fetchDeviceList()
    },
    handleBatchControl() {
      // 实现批量控制逻辑
    },
    handleNodeClick(data) {
      console.log('点击的节点数据:', data)
      if (data && data.type === 'floor') {
        // 直接使用楼层ID，不需要解析
        const floorId = data.id
        console.log('点击的楼层:', {
          id: floorId,
          name: data.label,
          floor_number: data.floor_number,
          building_id: data.building_id
        })
        
        // 调用设备列表接口
        this.fetchDeviceList({
          id: floorId,
          building_id: data.building_id
        })
      } else {
        console.log('非楼层节点，忽略')
      }
    },
    handleCommand(command, device) {
      this.currentDevice = device
      if (command === 'control') {
        this.controlForm = {
          running: device.status === 'running',
          temp: device.set_temp,
          mode: device.mode
        }
        this.dialogVisible = true
      }
    },
    handleControlSubmit() {
      // 发送控制命令到后端
      this.dialogVisible = false
    },
    async fetchBuildingTree() {
      try {
        console.log('正在请求建筑数据...')
        const response = await get('/api/device/building/tree/')
        console.log('建筑数据响应:', response)
        
        // 确保数据是数组
        if (Array.isArray(response.data)) {
          // 确保每个节点都有必要的属性
          const processedData = response.data.map(building => ({
            id: building.id,
            label: building.label || building.name,
            type: building.type || 'building',
            children: Array.isArray(building.children) ? building.children.map(floor => ({
              id: floor.id,
              label: floor.label || floor.name,
              type: floor.type || 'floor',
              floor_number: floor.floor_number
            })) : []
          }))
          console.log('处理后的楼层数据:', processedData)
          this.floorData = processedData
        } else {
          console.error('建筑数据格式错误:', response.data)
          this.$message.error('建筑数据格式错误')
          this.floorData = []
        }
      } catch (error) {
        console.error('获取建筑数据失败:', error)
        this.$message.error('获取建筑数据失败')
        this.floorData = []
      }
    },
    async fetchDeviceList(floor) {
      try {
        let queryParams = new URLSearchParams()
        
        if (this.listQuery.name) queryParams.append('name', this.listQuery.name)
        if (this.listQuery.status) queryParams.append('status', this.listQuery.status)
        
        if (floor) {
          console.log('传入的楼层数据:', floor)
          if (floor.id) {
            queryParams.append('floor_id', floor.id)
            console.log('请求参数 floor_id:', floor.id)
          }
          if (floor.building_id) {
            queryParams.append('building_id', floor.building_id)
          }
        }
        
        const response = await get(`/api/device/list/?${queryParams.toString()}`)
        console.log('设备列表响应详细数据:', response.data)
        
        if (Array.isArray(response.data)) {
          this.deviceList = response.data
          // 打印每个设备的楼层信息
          this.deviceList.forEach(device => {
            console.log(`设备 ${device.name} 的楼层ID:`, device.floor_id)
          })
        } else {
          console.error('设备列表数据格式错误:', response.data)
          this.$message.error('设备列表数据格式错误')
          this.deviceList = []
        }
      } catch (error) {
        console.error('获取设备列表失败:', error)
        this.$message.error('获取设备列表失败')
        this.deviceList = []
      }
    },
    getStatusType(status) {
      const types = {
        running: 'success',
        stopped: 'info',
        fault: 'danger'
      }
      return types[status] || 'info'
    },
    getStatusText(status) {
      const texts = {
        running: '运行中',
        stopped: '已停止',
        fault: '故障'
      }
      return texts[status] || '未知'
    },
    getModeIcon(mode) {
      const icons = {
        cooling: 'el-icon-cold-drink',
        heating: 'el-icon-hot-water',
        fan: 'el-icon-wind-power',
        dehumidify: 'el-icon-water-cup'
      }
      return icons[mode] || 'el-icon-setting'
    },
    getModeText(mode) {
      const texts = {
        cooling: '制冷',
        heating: '制热',
        fan: '送风',
        dehumidify: '除湿'
      }
      return texts[mode] || '未知'
    },
    refreshTree() {
      this.fetchBuildingTree()
    },
    getDeviceCount(data) {
      // 添加调试日志
      console.log('楼层数据:', data)
      console.log('设备列表:', this.deviceList)
      console.log('当前楼层号:', data.floor_number)
      console.log('设备的楼层ID:', this.deviceList.map(d => d.floor_id))
      
      const count = this.deviceList.filter(device => device.floor_id === data.floor_number).length
      console.log('匹配到的设备数量:', count)
      return count
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f0f2f5;
  transition: all 0.3s;

  &.dark-theme {
    background-color: #1a2942;
    color: #fff;

    .el-card {
      background-color: #243656;
      border: none;
      color: #fff;

      ::v-deep .el-card__header {
        border-bottom: 1px solid #334769;
      }
    }
  }
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.theme-switch {
  margin-left: 20px;
}

.tree-card {
  height: calc(100vh - 140px);
  overflow-y: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

  &.dark {
    background-color: #1e1e1e;
    
    .tree-header {
      color: #ffffff;
    }
    
    ::v-deep .el-tree {
      background-color: transparent;
      color: #ffffff;
    }
  }

  .tree-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 16px;
    font-weight: 500;

    i {
      margin-right: 8px;
    }
  }

  ::v-deep .el-tree {
    background: transparent;
    color: inherit;

    .el-tree-node__content {
      height: 40px;
      border-radius: 4px;
      margin: 4px 0;
      transition: all 0.3s;

      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
      }

      &.is-current {
        background-color: #409eff;
        color: #ffffff;
      }
    }
  }
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding-right: 8px;

  .node-icon {
    margin-right: 8px;
    width: 24px;
    text-align: center;

    i {
      font-size: 16px;
    }
  }

  .node-label {
    flex: 1;
  }
}

.device-card {
  margin-bottom: 20px;
  border-radius: 8px;
  transition: all 0.3s;

  &.running {
    border: 1px solid #67c23a;
  }

  .device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .device-name {
      font-size: 16px;
      font-weight: 500;
    }
  }

  .device-content {
    text-align: center;
  }

  .temp-display {
    font-size: 32px;
    margin-bottom: 20px;

    .temp-value {
      color: #f4a261;
      margin-left: 10px;
    }
  }

  .device-info {
    margin-bottom: 20px;

    .info-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: #909399;

      .value {
        font-weight: 500;
        color: inherit;
      }
    }
  }

  .device-status {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 15px;
    border-top: 1px solid #ebeef5;

    .mode-icons {
      font-size: 20px;
      color: #409eff;
    }
  }
}

.filter-container {
  .filter-item {
    margin-right: 10px;
  }
}

.control-dialog {
  ::v-deep .el-dialog__body {
    padding-top: 20px;
  }
}

// 浅色主题样式
:root {
  --primary-color: #67c23a;
  --secondary-color: #409eff;
  --background-color: #f0f2f5;
  --card-background: #fff;
  --text-color: #303133;
  --border-color: #ebeef5;
}

// 深色主题样式
.dark-theme {
  --primary-color: #85ce61;
  --secondary-color: #79bbff;
  --background-color: #1a2942;
  --card-background: #243656;
  --text-color: #fff;
  --border-color: #334769;
}
</style>
