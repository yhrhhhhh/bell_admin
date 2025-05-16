<template>
  <div class="app-container">
    <div class="filter-container">
      <el-input v-model="listQuery.name" placeholder="名称搜索" style="width: 200px;" class="filter-item"/>
      <el-select v-model="listQuery.status" placeholder="状态搜索" clearable style="width: 120px" class="filter-item">
        <el-option v-for="item in statusOptions" :key="item.key" :label="item.label" :value="item.key"/>
      </el-select>
      <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>
      <el-button class="filter-item" type="success" icon="el-icon-refresh" @click="handleBatchControl">批量操作</el-button>
    </div>

    <el-row :gutter="20">
      <!-- 左侧楼层树 -->
      <el-col :span="4">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>楼层列表</span>
          </div>
          <el-tree
            :data="floorData"
            :props="defaultProps"
            @node-click="handleNodeClick"
            default-expand-all
          />
        </el-card>
      </el-col>

      <!-- 右侧设备卡片 -->
      <el-col :span="20">
        <el-row :gutter="20">
          <el-col :span="8" v-for="device in deviceList" :key="device.id">
            <el-card class="device-card">
              <div class="device-header">
                <span>{{ device.name }}</span>
                <el-dropdown trigger="click" @command="handleCommand">
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
                  <span class="temp-value">{{ device.currentTemp }}°C</span>
                </div>
                <div class="device-info">
                  <div>设置温度：{{ device.setTemp }}°C</div>
                  <div>运行时间：{{ device.runTime }}H</div>
                </div>
                <div class="device-status">
                  <el-tag :type="device.status === 'running' ? 'success' : 'info'">
                    {{ device.status === 'running' ? '运行中' : '已停止' }}
                  </el-tag>
                  <div class="mode-icons">
                    <i class="el-icon-cold" v-if="device.mode === 'cold'"></i>
                    <i class="el-icon-wind-power" v-if="device.mode === 'fan'"></i>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <!-- 控制弹窗 -->
    <el-dialog title="设备控制" :visible.sync="dialogVisible" width="30%">
      <el-form :model="controlForm" label-width="100px">
        <el-form-item label="运行状态">
          <el-switch v-model="controlForm.running"/>
        </el-form-item>
        <el-form-item label="设置温度">
          <el-input-number v-model="controlForm.temp" :min="16" :max="30"/>
        </el-form-item>
        <el-form-item label="运行模式">
          <el-radio-group v-model="controlForm.mode">
            <el-radio label="cold">制冷</el-radio>
            <el-radio label="fan">送风</el-radio>
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
export default {
  name: 'Department',
  data() {
    return {
      listQuery: {
        name: '',
        status: ''
      },
      statusOptions: [
        { key: 'running', label: '运行' },
        { key: 'stopped', label: '停止' },
        { key: 'fault', label: '故障' }
      ],
      floorData: [{
        label: '克拉大楼',
        children: [
          { label: '1F' },
          { label: '2F' },
          { label: '3F' }
        ]
      }],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      deviceList: [],
      dialogVisible: false,
      controlForm: {
        running: true,
        temp: 25,
        mode: 'cold'
      },
      currentDevice: null
    }
  },
  created() {
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
      // 根据选中的楼层获取设备列表
      this.fetchDeviceList(data.label)
    },
    handleCommand(command) {
      if (command === 'control') {
        this.dialogVisible = true
      }
    },
    handleControlSubmit() {
      // 发送控制命令到后端
      this.dialogVisible = false
    },
    async fetchDeviceList(floor) {
      try {
        // 调用后端 API 获取设备列表
        const response = await this.$http.get('/api/device/list', {
          params: {
            floor,
            ...this.listQuery
          }
        })
        this.deviceList = response.data
      } catch (error) {
        console.error('获取设备列表失败:', error)
        this.$message.error('获取设备列表失败')
      }
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.filter-item {
  margin-right: 10px;
}

.device-card {
  margin-bottom: 20px;
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.device-content {
  text-align: center;
}

.temp-display {
  font-size: 24px;
  margin-bottom: 15px;
}

.temp-value {
  color: #f4a261;
  margin-left: 10px;
}

.device-info {
  margin-bottom: 15px;
  color: #666;
}

.device-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mode-icons {
  font-size: 20px;
}
</style>
