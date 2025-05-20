<template>
  <div class="app-container" :class="{'dark-theme': isDarkTheme}">
    <div class="header-container">
      <div class="filter-container">
        <el-input v-model="listQuery.name" placeholder="名称搜索" style="width: 200px;" class="filter-item"/>
        <el-select v-model="listQuery.status" placeholder="状态搜索" clearable style="width: 120px" class="filter-item">
          <el-option v-for="item in statusOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
        <el-button class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">搜索</el-button>
        
        <!-- 修改批量操作按钮为下拉菜单 -->
        <el-dropdown class="filter-item" @command="handleBatchCommand">
          <el-button type="primary">
            批量操作
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="batchDelete">批量删除</el-dropdown-item>
              <el-dropdown-item command="batchControl">批量控制</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
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
                <!-- 添加复选框 -->
                <el-checkbox 
                  v-model="device.selected"
                  @change="handleDeviceSelect"
                  class="device-checkbox"
                ></el-checkbox>
                <span class="device-name">{{ device.name }}</span>
                <el-dropdown trigger="click" @command="command => handleCommand(command, device)">
                  <el-icon class="more-icon"><More /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">修改设备</el-dropdown-item>
                      <el-dropdown-item command="delete">删除设备</el-dropdown-item>
                      <el-dropdown-item command="control">控制</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="device-content">
                <div class="temp-display">
                  <div class="temp-label">
                    <el-icon><House /></el-icon>
                    <span>室内温度</span>
                  </div>
                  <div class="temp-value">{{ device.current_temp }}°C</div>
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
                    <el-icon :title="getModeText(device.mode)">
                      <component :is="getModeIcon(device.mode)" />
                    </el-icon>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <!-- 控制弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="设备控制"
      width="30%"
      custom-class="control-dialog"
    >
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
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleControlSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量删除确认对话框 -->
    <el-dialog
      v-model="batchDeleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <span>确定要删除选中的 {{ selectedDeviceCount }} 个设备吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDeleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmBatchDelete">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量控制弹窗 -->
    <el-dialog
      v-model="batchControlDialogVisible"
      title="批量控制"
      width="30%"
      custom-class="control-dialog"
    >
      <el-form :model="batchControlForm" label-width="100px">
        <el-form-item label="运行状态">
          <el-switch v-model="batchControlForm.running"/>
        </el-form-item>
        <el-form-item label="设置温度">
          <el-input-number v-model="batchControlForm.temp" :min="16" :max="30" :step="0.5"/>
        </el-form-item>
        <el-form-item label="运行模式">
          <el-radio-group v-model="batchControlForm.mode">
            <el-radio label="cooling">制冷</el-radio>
            <el-radio label="heating">制热</el-radio>
            <el-radio label="fan">送风</el-radio>
            <el-radio label="dehumidify">除湿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchControlDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="confirmBatchControl">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改设备弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="修改设备"
      width="30%"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入设备名称"/>
        </el-form-item>
        <el-form-item label="设备编号" prop="code">
          <el-input v-model="editForm.code" placeholder="请输入设备编号"/>
        </el-form-item>
        <el-form-item label="所在楼层" prop="floor_id">
          <el-select v-model="editForm.floor_id" placeholder="请选择楼层">
            <el-option
              v-for="building in floorData"
              :key="building.id"
              :label="building.label"
              :value="building.id"
            >
              <template v-for="floor in building.children" :key="floor.id">
                <el-option
                  :label="building.label + ' - ' + floor.label"
                  :value="floor.id"
                />
              </template>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="运行状态" prop="status">
          <el-switch
            v-model="editForm.status"
            :active-value="'running'"
            :inactive-value="'stopped'"
            active-text="运行"
            inactive-text="停止"
          />
        </el-form-item>
        <el-form-item label="设置温度" prop="set_temp">
          <el-input-number
            v-model="editForm.set_temp"
            :min="16"
            :max="30"
            :step="0.5"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="运行模式" prop="mode">
          <el-radio-group v-model="editForm.mode">
            <el-radio label="cooling">制冷</el-radio>
            <el-radio label="heating">制热</el-radio>
            <el-radio label="fan">送风</el-radio>
            <el-radio label="dehumidify">除湿</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleEditSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="deleteDialogVisible"
      title="确认删除"
      width="30%"
    >
      <span>确定要删除该设备吗？</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleDeleteConfirm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { get, post, put, del } from '@/util/request'
import { More } from '@element-plus/icons-vue'

export default {
  name: 'Department',
  components: {
    More
  },
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
      currentDevice: null,
      // 添加批量删除相关的数据
      batchDeleteDialogVisible: false,
      batchControlDialogVisible: false,
      batchControlForm: {
        running: true,
        temp: 25,
        mode: 'cooling'
      },
      editDialogVisible: false,
      deleteDialogVisible: false,
      editForm: {
        id: '',
        name: '',
        code: '',
        floor_id: '',
        status: 'stopped',
        set_temp: 25,
        mode: 'cooling'
      },
      editRules: {
        name: [
          { required: true, message: '请输入设备名称', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入设备编号', trigger: 'blur' }
        ],
        floor_id: [
          { required: true, message: '请选择所在楼层', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    selectedDeviceCount() {
      return this.deviceList.filter(device => device.selected).length
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

    handleDeviceSelect() {
      // 触发视图更新
      this.deviceList = [...this.deviceList]
    },
    
    handleBatchCommand(command) {
      if (command === 'batchDelete') {
        if (this.selectedDeviceCount === 0) {
          this.$message.warning('请先选择要删除的设备')
          return
        }
        this.batchDeleteDialogVisible = true
      } else if (command === 'batchControl') {
        if (this.selectedDeviceCount === 0) {
          this.$message.warning('请先选择要控制的设备')
          return
        }
        this.batchControlDialogVisible = true
      }
    },

    async confirmBatchDelete() {
      try {
        const selectedDevices = this.deviceList.filter(device => device.selected)
        const deviceIds = selectedDevices.map(device => device.id)
        
        await post('/api/device/device/batch-delete/', { device_ids: deviceIds })
        this.$message.success('批量删除成功')
        this.batchDeleteDialogVisible = false
        await this.fetchDeviceList()
      } catch (error) {
        this.$message.error('批量删除失败：' + (error.response?.data?.error || error.message))
      }
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
      if (command === 'edit') {
        this.editForm = {
          id: device.id,
          name: device.name,
          code: device.device_id,
          floor_id: device.floor_id,
          status: device.status,
          set_temp: device.set_temp,
          mode: device.mode
        }
        this.editDialogVisible = true
      } else if (command === 'delete') {
        this.deleteDialogVisible = true
      } else if (command === 'control') {
        this.controlForm = {
          running: device.status === 'running',
          temp: device.set_temp,
          mode: device.mode
        }
        this.dialogVisible = true
      }
    },
    async handleControlSubmit() {
      try {
        const response = await post('/api/device/device/batch-control/', {
          device_ids: [this.currentDevice.id],
          control: {
            running: this.controlForm.running,
            temp: this.controlForm.temp,
            mode: this.controlForm.mode
          }
        })
        
        if (response.data.message) {
          this.$message.success('控制命令发送成功')
          this.dialogVisible = false
          // 更新设备状态
          const updatedDevices = response.data.devices
          if (updatedDevices && updatedDevices.length > 0) {
            this.deviceList = this.deviceList.map(device => {
              const updatedDevice = updatedDevices.find(d => d.id === device.id)
              if (updatedDevice) {
                return { ...device, ...updatedDevice }
              }
              return device
            })
          }
        } else {
          this.$message.error(response.data.error || '控制失败')
        }
      } catch (error) {
        this.$message.error('控制失败：' + error.message)
      }
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
        
        if (floor) {
          queryParams.append('floor_id', floor.id)
          if (floor.building_id) {
            queryParams.append('building_id', floor.building_id)
          }
        }
        
        if (this.listQuery.name) {
          queryParams.append('name', this.listQuery.name)
        }
        if (this.listQuery.status) {
          queryParams.append('status', this.listQuery.status)
        }
        
        const response = await get(`/api/device/filter/?${queryParams.toString()}`)
        // 添加selected属性
        this.deviceList = response.data.map(device => ({
          ...device,
          selected: false
        }))
      } catch (error) {
        console.error('获取设备列表失败:', error)
        this.$message.error('获取设备列表失败')
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
        cooling: 'Sunny',      // 制冷用太阳图标
        heating: 'Sunrise',    // 制热用日出图标
        fan: 'WindPower',      // 送风用风力图标
        dehumidify: 'Cloudy'   // 除湿用多云图标
      }
      return icons[mode] || 'Setting'
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
    },
    async confirmBatchControl() {
      try {
        const selectedDevices = this.deviceList.filter(device => device.selected)
        const deviceIds = selectedDevices.map(device => device.id)
        
        const response = await post('/api/device/device/batch-control/', {
          device_ids: deviceIds,
          control: {
            running: this.batchControlForm.running,
            temp: this.batchControlForm.temp,
            mode: this.batchControlForm.mode
          }
        })
        
        // 更新本地设备状态
        if (response.data.devices) {
          const updatedDevices = response.data.devices
          this.deviceList = this.deviceList.map(device => {
            const updatedDevice = updatedDevices.find(d => d.id === device.id)
            if (updatedDevice) {
              return { ...updatedDevice, selected: false }
            }
            return device
          })
        }
        
        this.$message.success('批量控制成功')
        this.batchControlDialogVisible = false
      } catch (error) {
        this.$message.error('批量控制失败：' + (error.response?.data?.error || error.message))
      }
    },
    async handleEditSubmit() {
      try {
        console.log('准备发送的编辑数据:', this.editForm)
        const response = await put(`/api/device/device/${this.editForm.id}/`, {
          name: this.editForm.name,
          device_id: this.editForm.code,
          location: this.editForm.floor_id,
          set_temp: this.editForm.set_temp,
          mode: this.editForm.mode,
          status: this.editForm.status
        })
        
        console.log('修改设备响应:', response)
        
        if (response.status === 200 || response.data.code === 200) {
          this.$message.success('修改成功')
          this.editDialogVisible = false
          await this.fetchDeviceList()
        } else {
          this.$message.error(response.data.message || '修改失败')
        }
      } catch (error) {
        console.error('修改设备失败:', {
          error: error,
          response: error.response,
          data: error.response?.data,
          status: error.response?.status,
          message: error.message
        })
        this.$message.error(`修改失败：${error.response?.data?.message || error.response?.data?.error || error.message}`)
      }
    },
    async handleDeleteConfirm() {
      try {
        // 使用 DELETE 方法和正确的路径
        await del(`/api/device/device/${this.currentDevice.id}/`)
        
        this.$message.success('删除成功')
        this.deleteDialogVisible = false
        await this.fetchDeviceList()
      } catch (error) {
        this.$message.error('删除失败：' + (error.response?.data?.message || error.message))
      }
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

    .device-card {
      .device-header {
        .device-checkbox {
          ::v-deep .el-checkbox__inner {
            border-color: #79bbff;  /* 使用深色主题的次要颜色 */
            
            &::after {
              border-color: #79bbff;  /* 对勾颜色 */
            }
          }

          ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
            border-color: #79bbff;
          }

          ::v-deep .el-checkbox__inner:hover {
            border-color: #79bbff;
          }
        }
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
  position: relative;
  
  &.running {
    border: 1px solid #67C23A;
  }
  
  .device-header {
    position: relative;
    padding-left: 35px;  /* 为复选框留出空间 */
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .device-checkbox {
      position: absolute;
      top: 5px;  /* 调整位置往上移 */
      left: 5px;
      z-index: 1;

      /* 自定义复选框样式 */
      ::v-deep .el-checkbox__inner {
        width: 20px;  /* 增大复选框大小 */
        height: 20px;
        background-color: transparent;  /* 设置透明背景 */
        border: 2px solid #409EFF;  /* 加粗边框并使用主题色 */
        border-radius: 4px;

        &::after {
          height: 12px;  /* 调整对勾大小 */
          left: 6px;
          width: 5px;
          border-width: 2px;
        }
      }

      /* 选中状态样式 */
      ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner {
        background-color: transparent;
        border-color: #409EFF;
      }

      /* 鼠标悬停状态 */
      ::v-deep .el-checkbox__inner:hover {
        border-color: #409EFF;
      }
    }
    
    .device-name {
      font-size: 16px;
      font-weight: bold;
    }

    .more-icon {
      font-size: 20px;
      color: #909399;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
      transition: all 0.3s;

      &:hover {
        background-color: rgba(144, 147, 153, 0.1);
      }
    }
  }

  .device-content {
    text-align: center;
  }

  .temp-display {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .temp-label {
      display: flex;
      align-items: center;
      gap: 5px;
      color: #909399;
      font-size: 14px;
      margin-bottom: 5px;
      
      .el-icon {
        font-size: 16px;
      }
    }

    .temp-value {
      font-size: 32px;
      color: #f4a261;
      font-weight: 500;
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
