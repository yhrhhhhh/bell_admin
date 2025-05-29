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
        
        <!-- 添加设备按钮 -->
        <el-button class="filter-item" type="success" icon="el-icon-plus" @click="handleAdd">添加设备</el-button>
        <el-button
          class="filter-item"
          type="success"
          icon="el-icon-download"
          @click="handleExport"
        >
        导出所有设备信息
        </el-button>
      </div>
      <el-switch
        v-model="isDarkTheme"
        active-text="深色主题"
        inactive-text="浅色主题"
        class="theme-switch"
      />
    </div>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧树形菜单 -->
      <el-col :span="4">
        <div class="org-structure">
          <div class="org-tabs">
            <div 
              class="org-tab" 
              :class="{ active: currentTreeType === 'building' }"
              @click="currentTreeType = 'building'"
            >
              <i class="el-icon-office-building"></i>
              楼栋
            </div>
            <div 
              class="org-tab" 
              :class="{ active: currentTreeType === 'gateway' }"
              @click="currentTreeType = 'gateway'"
            >
              <i class="el-icon-connection"></i>
              网关
            </div>
            <div 
              class="org-tab" 
              :class="{ active: currentTreeType === 'company' }"
              @click="currentTreeType = 'company'"
            >
              <i class="el-icon-suitcase"></i>
              公司
            </div>
          </div>

          <div class="tree-container">
            <el-tree
              v-show="currentTreeType === 'building'"
              :data="buildingTreeData"
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
                    <i v-if="data.type === 'building'" class="el-icon-office-building" style="color: #dcb67a;"></i>
                    <i v-else-if="data.type === 'floor'" class="el-icon-office-building" style="color: #dcb67a;"></i>
                    <i v-else-if="data.type === 'device'" class="el-icon-monitor" style="color: #7ab0dc;"></i>
                  </span>
                  <span class="node-label">{{ node.label }}</span>
                  <span v-if="data.type === 'device'" class="node-status" :class="data.status">
                    <el-tag size="mini" :type="getStatusType(data.status)">
                      {{ getStatusText(data.status) }}
                    </el-tag>
                  </span>
                </span>
              </template>
            </el-tree>

            <el-tree
              v-show="currentTreeType === 'gateway'"
              :data="gatewayTreeData"
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
                    <i v-if="data.type === 'gateway'" class="el-icon-connection" style="color: #7adcb6;"></i>
                    <i v-else-if="data.type === 'device'" class="el-icon-monitor" style="color: #7ab0dc;"></i>
                  </span>
                  <span class="node-label">{{ node.label }}</span>
                  <span v-if="data.type === 'device'" class="node-status" :class="data.status">
                    <el-tag size="mini" :type="getStatusType(data.status)">
                      {{ getStatusText(data.status) }}
                    </el-tag>
                  </span>
                </span>
              </template>
            </el-tree>

            <el-tree
              v-show="currentTreeType === 'company'"
              :data="companyTreeData"
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
                    <i v-if="data.type === 'company'" class="el-icon-suitcase" style="color: #dcb67a;"></i>
                    <i v-else-if="data.type === 'department'" class="el-icon-suitcase" style="color: #dcb67a;"></i>
                    <i v-else-if="data.type === 'device'" class="el-icon-monitor" style="color: #7ab0dc;"></i>
                  </span>
                  <span class="node-label">{{ node.label }}</span>
                  <span v-if="data.type === 'device'" class="node-status" :class="data.status">
                    <el-tag size="mini" :type="getStatusType(data.status)">
                      {{ getStatusText(data.status) }}
                    </el-tag>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
      </el-col>

      <!-- 右侧设备卡片 -->
      <el-col :span="20">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="device in deviceList" :key="device.id">
            <el-card class="device-card" :class="{'running': device.status === 'running'}">
              <div class="device-header">
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
                  <div class="info-item">
                    <span class="label">风速：</span>
                    <span class="value">{{ getFanSpeedText(device.fan_speed) }}</span>
                  </div>
                </div>
                <div class="device-status">
                  <el-tag :type="getStatusType(device.status)" size="small">
                    {{ getStatusText(device.status) }}
                  </el-tag>
                  <div class="mode-icons">
                    <el-icon :class="['mode-icon', device.mode]" :title="getModeText(device.mode)">
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
      custom-class="single-device-control-dialog"
    >
      <el-form :model="controlForm" label-width="100px">
        <el-form-item label="运行状态">
          <el-switch v-model="controlForm.running" @change="handleRunningChange"/>
        </el-form-item>
        <el-form-item label="设置温度" class="temp-control">
          <div style="display: flex; align-items: center; width: 100%;">
            <el-input-number v-model="controlForm.temp" :min="16" :max="30" :step="0.5" style="margin-right: 60px;"/>
            <el-button type="primary" size="small" @click="handleTempSubmit">确定</el-button>
          </div>
        </el-form-item>
        <el-form-item label="运行模式">
          <el-radio-group v-model="controlForm.mode" @change="handleModeChange">
            <el-radio label="auto">自动</el-radio>
            <el-radio label="cooling">制冷</el-radio>
            <el-radio label="heating">制热</el-radio>
            <el-radio label="fan">送风</el-radio>
            <el-radio label="dehumidify">除湿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="风速">
          <el-radio-group v-model="controlForm.fan_speed" @change="handleFanSpeedChange">
            <el-radio :label="0">自动</el-radio>
            <el-radio :label="1">高速</el-radio>
            <el-radio :label="2">中速</el-radio>
            <el-radio :label="4">低速</el-radio>
            <el-radio :label="6">微风</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
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
            <el-radio label="auto">自动</el-radio>
            <el-radio label="cooling">制冷</el-radio>
            <el-radio label="heating">制热</el-radio>
            <el-radio label="fan">送风</el-radio>
            <el-radio label="dehumidify">除湿</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="风速">
          <el-radio-group v-model="batchControlForm.fan_speed">
            <el-radio :label="0">自动</el-radio>
            <el-radio :label="1">高速</el-radio>
            <el-radio :label="2">中速</el-radio>
            <el-radio :label="4">低速</el-radio>
            <el-radio :label="6">微风</el-radio>
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
      width="40%"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入设备名称"/>
        </el-form-item>
        <el-form-item label="设备编号" prop="code">
          <el-input v-model="editForm.code" :placeholder="editForm.code"/>
        </el-form-item>
        <el-form-item label="设备UUID" prop="uuid_value">
          <el-select v-model="editForm.uuid_value" @change="handleUuidChangeInEdit">
            <el-option
              v-for="item in uuidOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="订阅主题" prop="subscribe_topic">
          <el-input v-model="editForm.subscribe_topic" placeholder="请输入订阅主题" disabled/>
        </el-form-item>
        <el-form-item label="发布主题" prop="publish_topic">
          <el-input v-model="editForm.publish_topic" placeholder="请输入发布主题" disabled/>
        </el-form-item>
        <el-form-item label="所属公司" prop="company_id">
          <el-select 
            v-model="editForm.company_id" 
            placeholder="请选择公司"
            @change="handleCompanyChangeInEdit"
          >
            <el-option
              v-for="company in companyTreeData"
              :key="company.id"
              :label="company.label"
              :value="company.id"
            >
              <span>{{ company.label }}</span>
            </el-option>
          </el-select>
          <span class="current-value" v-if="currentDevice && currentDevice.company_name">
            当前值: {{ currentDevice.company_name }}
          </span>
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select 
            v-model="editForm.department_id" 
            placeholder="请选择部门"
            :disabled="!editForm.company_id"
          >
            <el-option
              v-for="department in currentDepartments"
              :key="department.id"
              :label="department.label"
              :value="department.id"
            >
              <span>{{ department.label }}</span>
            </el-option>
          </el-select>
          <span class="current-value" v-if="currentDevice && currentDevice.department_name">
            当前值: {{ currentDevice.department_name }}
          </span>
        </el-form-item>
        <el-form-item label="所在楼层" prop="floor_id">
          <el-cascader
            v-model="editForm.floor_id"
            :options="buildingTreeData"
            :props="{
              checkStrictly: true,
              label: 'label',
              value: 'id',
              children: 'children'
            }"
            placeholder="请选择楼层"
            clearable
          />
          <span class="current-value" v-if="currentDevice">
            当前值: {{ currentDevice.building_name }} - {{ currentDevice.floor_name }}
          </span>
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

    <!-- 添加设备弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加设备"
      width="40%"
    >
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入设备名称"/>
        </el-form-item>
        <el-form-item label="设备编号" prop="code">
          <el-input v-model="addForm.code" placeholder="请输入设备编号"/>
        </el-form-item>
        <el-form-item label="设备UUID" prop="uuid_value">
          <el-select v-model="addForm.uuid_value" @change="handleUuidChangeInAdd">
            <el-option
              v-for="item in uuidOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="订阅主题" prop="subscribe_topic">
          <el-input v-model="addForm.subscribe_topic" placeholder="请输入订阅主题" disabled/>
        </el-form-item>
        <el-form-item label="发布主题" prop="publish_topic">
          <el-input v-model="addForm.publish_topic" placeholder="请输入发布主题" disabled/>
        </el-form-item>
        <el-form-item label="所属公司" prop="company_id">
          <el-select 
            v-model="addForm.company_id" 
            placeholder="请选择公司"
            @change="handleCompanyChangeInAdd"
            clearable
          >
            <el-option
              v-for="item in companyTreeData"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门" prop="department_id">
          <el-select 
            v-model="addForm.department_id" 
            placeholder="请选择部门"
            :disabled="!addForm.company_id"
            clearable
          >
            <el-option
              v-for="dept in currentDepartments"
              :key="dept.id"
              :label="dept.label"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所在楼层" prop="floor_id">
          <el-cascader
            v-model="addForm.floor_id"
            :options="buildingTreeData"
            :props="{
              checkStrictly: true,
              label: 'label',
              value: 'id',
              children: 'children'
            }"
            placeholder="请选择楼层"
            clearable
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleAddSubmit">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { get, post, put, del } from '@/util/request'
import { More } from '@element-plus/icons-vue'
import { sendControlCommand } from '@/api/device'
import { ElMessage } from 'element-plus'
import requestUtil from '@/util/request'

export default {
  name: 'Department',
  components: {
    More
  },
  data() {
    return {
      isDarkTheme: true,
      currentTreeType: 'building',
      buildingTreeData: [],
      gatewayTreeData: [],
      companyTreeData: [],
      listQuery: {
        name: '',
        status: ''
      },
      statusOptions: [
        { key: 'running', label: '运行' },
        { key: 'stopped', label: '停止' },
        { key: 'fault', label: '故障' }
      ],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      deviceList: [],
      dialogVisible: false,
      controlForm: {
        running: true,
        temp: 25,
        mode: 'cooling',
        fan_speed: 0
      },
      currentDevice: null,
      batchDeleteDialogVisible: false,
      batchControlDialogVisible: false,
      batchControlForm: {
        running: true,
        temp: 25,
        mode: 'cooling',
        fan_speed: 0
      },
      editDialogVisible: false,
      deleteDialogVisible: false,
      editForm: {
        id: '',
        name: '',
        code: '',
        floor_id: '',
        company_id: '',
        department_id: '',
        uuid_value: '',
        subscribe_topic: '',
        publish_topic: ''
      },
      editRules: {
        name: [
          { required: true, message: '请输入设备名称', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入设备编号', trigger: 'blur' }
        ],
        uuid_value: [
          { required: true, message: '请输入设备UUID', trigger: 'blur' }
        ],
        floor_id: [
          { required: true, message: '请选择所在楼层', trigger: 'blur' }
        ],
        company_id: [
          { required: true, message: '请选择所属公司', trigger: 'blur' }
        ],
        department_id: [
          { required: true, message: '请选择所属部门', trigger: 'blur' }
        ]
      },
      fanSpeedMap: {
        0: '自动',
        1: '高速',
        2: '中速',
        4: '低速',
        6: '微风'
      },
      selectedBuilding: null,
      selectedFloor: null,
      selectedGateway: null,
      selectedCompany: null,
      selectedDepartment: null,
      currentFloors: [],
      currentDepartments: [],
      topicOptions: [],
      addForm: {
        name: '',
        code: '',
        uuid_value: '',
        subscribe_topic: '',
        publish_topic: '',
        floor_id: null,
        company_id: null,
        department_id: null,
        current_temp: 25,
        set_temp: 25,
        status: 'stopped',
        mode: 'auto',
        fan_speed: 0,
        room_id: 1
      },
      addDialogVisible: false,
      addRules: {
        name: [
          { required: true, message: '请输入设备名称', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入设备编号', trigger: 'blur' }
        ],
        uuid_value: [
          { required: true, message: '请输入设备UUID', trigger: 'blur' }
        ],
        floor_id: [
          { required: true, message: '请选择所在楼层', trigger: 'change' }
        ],
        company_id: [
          { required: true, message: '请选择所属公司', trigger: 'change' }
        ],
        department_id: [
          { required: true, message: '请选择所属部门', trigger: 'change' }
        ]
      },
      uuidOptions: [],
    }
  },
  computed: {
    selectedDeviceCount() {
      return this.deviceList.filter(device => device.selected).length
    },
    currentTreeData() {
      switch (this.currentTreeType) {
        case 'building':
          return this.buildingTreeData
        case 'gateway':
          return this.gatewayTreeData
        case 'company':
          return this.companyTreeData
        default:
          return []
      }
    }
  },
  created() {
    this.fetchAllTrees()
    this.fetchDeviceList()
  },
  methods: {
    handleFilter() {
      // 重置其他查询条件
      this.selectedBuilding = null;
      this.selectedFloor = null;
      this.selectedGateway = null;
      this.selectedCompany = null;
      this.selectedDepartment = null;
      
      this.fetchDeviceList({
        name: this.listQuery.name,
        status: this.listQuery.status
      })
    },

    handleDeviceSelect() {
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
        
        await post('/api/device/devices/batch-delete/', { device_ids: deviceIds })
        this.$message.success('批量删除成功')
        this.batchDeleteDialogVisible = false
        await this.fetchDeviceList()
      } catch (error) {
        this.$message.error('批量删除失败：' + (error.response?.data?.error || error.message))
      }
    },

    handleNodeClick(data) {
      console.log('Node clicked:', data)  // 添加调试日志
      let queryParams = {}
      
      switch (data.type) {
        case 'floor':
          queryParams = {
            floor_id: data.id,
            building_id: data.building_id
          }
          break
        case 'device':
          if (data.uuid) {  // 如果是从网关树点击的设备
            queryParams = {
              uuid: data.uuid,
              device_id: data.device_id
            }
          } else {  // 如果是从建筑树点击的设备
            queryParams = {
              device_id: data.id
            }
          }
          break
        case 'department':
          queryParams = {
            department_id: data.id,
            company_id: data.company_id
          }
          break
        case 'gateway':
          queryParams = {
            uuid: data.id  // 网关节点的id就是uuid
          }
          break
      }
      
      console.log('Query params:', queryParams)  // 添加调试日志
      
      if (Object.keys(queryParams).length > 0) {
        this.fetchDeviceList(queryParams)
      }
    },
    handleCommand(command, device) {
      this.currentDevice = device
      if (command === 'edit') {
        this.fetchUuidOptions()
        
        // 从uuid_info中获取uuid和topic信息
        const uuid = device.uuid_info ? device.uuid_info.uuid : ''
        const subscribe_topic = device.uuid_info && device.uuid_info.topic ? device.uuid_info.topic.subscribe : ''
        const publish_topic = device.uuid_info && device.uuid_info.topic ? device.uuid_info.topic.publish : ''
        
        console.log('编辑设备:', {
          device,
          uuid_info: device.uuid_info,
          uuid,
          subscribe_topic,
          publish_topic
        })
        
        this.editForm = {
          id: device.id,
          name: device.name,
          code: device.device_id,
          floor_id: device.floor_id,
          company_id: device.company_id,
          department_id: device.department_id,
          uuid_value: uuid,
          subscribe_topic: subscribe_topic,
          publish_topic: publish_topic
        }
        
        if (device.company_id) {
          const company = this.companyTreeData.find(c => c.id === device.company_id)
          if (company) {
            this.currentDepartments = company.children || []
          }
        }
        this.editDialogVisible = true
      } else if (command === 'delete') {
        this.deleteDialogVisible = true
      } else if (command === 'control') {
        this.controlForm = {
          running: device.status === 'running',
          temp: device.set_temp,
          mode: device.mode,
          fan_speed: device.fan_speed
        }
        this.dialogVisible = true
      }
    },
    async handleControlSubmit() {
      try {
        const response = await post('/api/device/devices/batch-control/', {
          device_ids: [this.currentDevice.id],
          control: {
            running: this.controlForm.running,
            temp: this.controlForm.temp,
            mode: this.controlForm.mode,
            fan_speed: this.controlForm.fan_speed
          }
        })
        
        if (response.data.message) {
          this.$message.success('控制命令发送成功')
          this.dialogVisible = false
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
    async fetchAllTrees() {
      try {
        const response = await get('/api/device/all/trees/')
        this.buildingTreeData = response.data.building_tree
        this.gatewayTreeData = response.data.gateway_tree
        this.companyTreeData = response.data.company_tree
        
        // 临时调试日志
        console.log('Gateway Tree Data:', this.gatewayTreeData)
      } catch (error) {
        console.error('获取组织架构数据失败:', error)
        this.$message.error('获取组织架构数据失败')
      }
    },
    async fetchDeviceList(params = {}) {
      try {
        let queryParams = new URLSearchParams()
        
        // 合并传入的参数
        Object.entries(params).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value)
          }
        })
        
        const response = await get(`/api/device/filter/?${queryParams.toString()}`)
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
        cooling: 'Sunny',
        heating: 'Sunrise',
        fan: 'WindPower',
        dehumidify: 'Cloudy',
        auto: 'Setting'
      }
      return icons[mode] || 'Setting'
    },
    getModeText(mode) {
      const texts = {
        cooling: '制冷',
        heating: '制热',
        fan: '送风',
        dehumidify: '除湿',
        auto: '自动'
      }
      return texts[mode] || '自动'
    },
    refreshTree() {
      this.fetchAllTrees()
    },
    getDeviceCount(data) {
      return this.deviceList.filter(device => device.floor_id === data.floor_number).length
    },
    async confirmBatchControl() {
      try {
        const selectedDevices = this.deviceList.filter(device => device.selected)
        if (selectedDevices.length === 0) {
          this.$message.warning('请选择要控制的设备')
          return
        }

        const response = await post('/api/device/batch-control/', {
          device_ids: selectedDevices.map(device => device.id),
          control: this.batchControlForm
        })

        if (response.data.message) {
          this.$message.success('批量控制成功')
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
          this.batchControlDialogVisible = false
        } else {
          this.$message.error(response.data.error || '批量控制失败')
        }
      } catch (error) {
        this.$message.error('批量控制失败：' + error.message)
      }
    },
    async handleEditSubmit() {
      try {
        await this.$refs.editFormRef.validate()
        
        console.log('提交编辑表单:', this.editForm)
        
        // 处理楼层和建筑ID
        let floorId = null;
        let buildingId = null;
        if (Array.isArray(this.editForm.floor_id) && this.editForm.floor_id.length > 0) {
          // 级联选择器返回的是[buildingId, floorId]
          buildingId = parseInt(this.editForm.floor_id[0]);
          floorId = parseInt(this.editForm.floor_id[1]);
        } else if (this.editForm.floor_id) {
          floorId = parseInt(this.editForm.floor_id);
        }
        
        // 更新设备信息
        const deviceData = {
          name: this.editForm.name,
          device_id: this.editForm.code,
          building: buildingId,  // 建筑外键
          floor: floorId,      // 楼层外键
          company: parseInt(this.editForm.company_id),  // 公司外键
          department: parseInt(this.editForm.department_id),  // 部门外键
          uuid: this.editForm.uuid_value  // 只修改UUID外键
        }
        
        // 验证必填字段
        const requiredFields = ['name', 'device_id', 'uuid', 'company', 'department']
        for (const field of requiredFields) {
          if (!deviceData[field] && deviceData[field] !== 0) {
            this.$message.error(`请填写${field}字段`)
            return
          }
        }
        
        console.log('更新设备:', deviceData)
        
        const response = await put(`/api/device/devices/${this.editForm.id}/`, deviceData)
        
        if (response.status === 200 || response.data.code === 200) {
          this.$message.success('修改成功')
          this.editDialogVisible = false
          await this.fetchDeviceList()
          await this.fetchAllTrees()  // 刷新树形结构
        } else {
          this.$message.error(response.data.message || '修改失败')
        }
      } catch (error) {
        console.error('修改设备失败:', error)
        this.$message.error(`修改失败：${error.response?.data?.message || error.response?.data?.error || error.message}`)
      }
    },
    async handleDeleteConfirm() {
      try {
        await del(`/api/device/devices/${this.currentDevice.id}/`)
        
        this.$message.success('删除成功')
        this.deleteDialogVisible = false
        await this.fetchDeviceList()
      } catch (error) {
        this.$message.error('删除失败：' + (error.response?.data?.message || error.message))
      }
    },
    getFanSpeedText(fanSpeed) {
      return this.fanSpeedMap[fanSpeed] || '未知'
    },
    getModeType(mode) {
      const typeMap = {
        'auto': 'info',
        'cooling': 'primary',
        'heating': 'danger',
        'fan': 'success',
        'dehumidify': 'warning'
      }
      return typeMap[mode] || ''
    },
    handleBuildingChange(buildingId) {
      this.selectedFloor = null;
      const building = this.buildingTreeData.find(b => b.id === buildingId);
      this.currentFloors = building ? building.children : [];
      this.fetchDeviceList({ building_id: buildingId });
    },
    handleFloorChange(floorId) {
      this.fetchDeviceList({ floor_id: floorId });
    },
    handleGatewayChange(gatewayId) {
      const gateway = this.gatewayTreeData.find(g => g.id === gatewayId);
      if (gateway) {
        this.fetchDeviceList({ uuid: gateway.label });
      }
    },
    handleCompanyChange(companyId) {
      this.selectedDepartment = null;
      const company = this.companyTreeData.find(c => c.id === companyId);
      this.currentDepartments = company ? company.children : [];
      this.fetchDeviceList({ company_id: companyId });
    },
    handleDepartmentChange(departmentId) {
      this.fetchDeviceList({ department_id: departmentId });
    },
    handleCompanyChangeInEdit(value) {
      if (!value && value !== 0) {
        this.editForm.company_id = null
        this.editForm.department_id = null
        this.currentDepartments = []
        return
      }
      
      // 确保是数字类型
      const companyId = parseInt(value)
      if (isNaN(companyId)) {
        this.$message.error('公司ID无效')
        return
      }
      
      this.editForm.company_id = companyId
      
      // 重置部门选择
      this.editForm.department_id = null
      
      // 更新部门列表
      const company = this.companyTreeData.find(c => c.id === companyId)
      if (company) {
        this.currentDepartments = company.children || []
      } else {
        this.currentDepartments = []
      }
    },
    async handleRunningChange(value) {
      try {
        const response = await sendControlCommand({
          uuid: this.currentDevice.uuid_info.uuid,
          device_id: this.currentDevice.device_id,
          property: 'onOff',
          value: value ? 'running' : 'stopped'
        })
        
        if (response.data.status === 'Command has been issued to the device.') {
          this.$message.success('运行状态修改成功')
        } else {
          this.$message.error(response.data.message || '修改失败')
          this.controlForm.running = !value // 恢复原值
        }
      } catch (error) {
        this.$message.error('修改失败：' + error.message)
        this.controlForm.running = !value // 恢复原值
      }
    },
    async handleTempSubmit() {
      try {
        const response = await sendControlCommand({
          uuid: this.currentDevice.uuid_info.uuid,
          device_id: this.currentDevice.device_id,
          property: 'tempSet',
          value: this.controlForm.temp
        })
        
        if (response.data.status === 'Command has been issued to the device.') {
          this.$message.success('温度设置成功')
        } else {
          this.$message.error(response.data.message || '设置失败')
        }
      } catch (error) {
        this.$message.error('设置失败：' + error.message)
      }
    },
    async handleModeChange(value) {
      try {
        const response = await sendControlCommand({
          uuid: this.currentDevice.uuid_info.uuid,
          device_id: this.currentDevice.device_id,
          property: 'workMode',
          value: value
        })
        
        if (response.data.status === 'Command has been issued to the device.') {
          this.$message.success('运行模式修改成功')
        } else {
          this.$message.error(response.data.message || '修改失败')
          this.controlForm.mode = this.currentDevice.mode // 恢复原值
        }
      } catch (error) {
        this.$message.error('修改失败：' + error.message)
        this.controlForm.mode = this.currentDevice.mode // 恢复原值
      }
    },
    async handleFanSpeedChange(value) {
      try {
        const response = await sendControlCommand({
          uuid: this.currentDevice.uuid_info.uuid,
          device_id: this.currentDevice.device_id,
          property: 'fanSpeed',
          value: value
        })
        
        if (response.data.status === 'Command has been issued to the device.') {
          this.$message.success('风速修改成功')
        } else {
          this.$message.error(response.data.message || '修改失败')
          this.controlForm.fan_speed = this.currentDevice.fan_speed // 恢复原值
        }
      } catch (error) {
        this.$message.error('修改失败：' + error.message)
        this.controlForm.fan_speed = this.currentDevice.fan_speed // 恢复原值
      }
    },
    async handleSearchTopic() {
      if (!this.editForm.uuid_value) {
        this.$message.warning('请先输入UUID')
        return
      }
      try {
        const response = await get(`/api/device/topic/search/?uuid=${this.editForm.uuid_value}`)
        if (response.data.topic) {
          this.$message.success(`找到对应Topic: ${response.data.topic}`)
        } else {
          this.$message.warning('未找到对应的Topic')
        }
      } catch (error) {
        this.$message.error('查询Topic失败：' + error.message)
      }
    },
    async fetchTopicOptions() {
      try {
        const response = await get('/api/device/topic/list/')
        this.topicOptions = response.data.map(topic => ({
          value: topic,
          label: topic
        }))
      } catch (error) {
        console.error('获取Topic列表失败:', error)
        this.$message.error('获取Topic列表失败')
      }
    },
    handleAdd() {
      this.addForm = {
        name: '',
        code: '',
        uuid_value: '',
        subscribe_topic: '',
        publish_topic: '',
        floor_id: null,
        company_id: null,
        department_id: null,
        current_temp: 25,
        set_temp: 25,
        status: 'stopped',
        mode: 'auto',
        fan_speed: 0,
        room_id: 1
      }
      this.currentDepartments = []
      this.fetchUuidOptions()
      this.addDialogVisible = true
    },
    handleCompanyChangeInAdd(value) {
      if (!value && value !== 0) {
        this.addForm.company_id = null
        this.addForm.department_id = null
        this.currentDepartments = []
        return
      }
      
      // 确保是数字类型
      const companyId = parseInt(value)
      if (isNaN(companyId)) {
        this.$message.error('公司ID无效')
        return
      }
      
      this.addForm.company_id = companyId
      
      // 重置部门选择
      this.addForm.department_id = null
      
      // 更新部门列表
      const company = this.companyTreeData.find(c => c.id === companyId)
      if (company) {
        this.currentDepartments = company.children || []
      } else {
        this.currentDepartments = []
      }
    },
    async handleAddSubmit() {
      try {
        // 表单验证
        await this.$refs.addFormRef.validate()
        
        // 构造提交数据
        const deviceData = {
          name: this.addForm.name,
          device_id: this.addForm.code,
          uuid: this.addForm.uuid_value,  // 这是Topic表的uuid，后端会根据这个找到对应的Topic ID
          floor: Array.isArray(this.addForm.floor_id) ? 
            parseInt(this.addForm.floor_id[this.addForm.floor_id.length - 1]) : 
            parseInt(this.addForm.floor_id),
          company: parseInt(this.addForm.company_id),
          department: parseInt(this.addForm.department_id),
          current_temp: this.addForm.current_temp || 25,
          set_temp: this.addForm.set_temp || 25,
          status: this.addForm.status || 'stopped',
          mode: this.addForm.mode || 'auto',
          fan_speed: this.addForm.fan_speed || 0,
          room_id: 1
        }
        
        // 验证必填字段
        const requiredFields = ['name', 'device_id', 'uuid', 'company', 'department', 'floor']
        for (const field of requiredFields) {
          if (!deviceData[field] && deviceData[field] !== 0) {
            this.$message.error(`请填写${field}字段`)
            return
          }
        }
        
        console.log('提交设备数据:', deviceData)
        
        const response = await post('/api/device/devices/', deviceData)
        
        if (response.status === 201) {
          this.$message.success('设备添加成功')
          this.addDialogVisible = false
          await this.fetchDeviceList()
        } else {
          this.$message.error(response.data.message || '添加失败')
        }
      } catch (error) {
        if (error.response) {
          const errorData = error.response.data
          if (errorData.company) {
            this.$message.error('请选择公司')
          } else {
            this.$message.error(`添加失败：${JSON.stringify(errorData)}`)
          }
        } else if (error.request) {
          this.$message.error('网络请求失败，请检查网络连接')
        } else {
          this.$message.error(`添加失败：${error.message}`)
        }
      }
    },
    async fetchUuidOptions() {
      try {
        const response = await get('/api/device/topic/uuid-list/')
        if (response.data.code === 200) {
          this.uuidOptions = response.data.data.map(item => ({
            value: item.uuid,
            label: item.uuid,
            subscribe_topic: item.subscribe_topic,
            publish_topic: item.publish_topic
          }))
        }
      } catch (error) {
        console.error('获取UUID列表失败:', error)
        this.$message.error('获取UUID列表失败')
      }
    },
    handleUuidChangeInAdd(value) {
      if (!value) {
        this.addForm.uuid_value = null
        this.addForm.subscribe_topic = ''
        this.addForm.publish_topic = ''
        return
      }
      // 只用于展示，不会提交这些值
      const selectedUuid = this.uuidOptions.find(item => item.value === value)
      if (selectedUuid) {
        this.addForm.uuid_value = selectedUuid.value
        // 只用于展示
        this.addForm.subscribe_topic = selectedUuid.subscribe_topic
        this.addForm.publish_topic = selectedUuid.publish_topic
      }
    },
    handleUuidChangeInEdit(value) {
      if (!value) {
        this.editForm.uuid_value = null
        return
      }
      const selectedUuid = this.uuidOptions.find(item => item.value === value)
      if (selectedUuid) {
        this.editForm.uuid_value = selectedUuid.value
      }
    },
    async handleExport() {
      try {
        const response = await get('/api/device/export/', {
          responseType: 'blob'
        })
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.download = 'devices.csv'  // 改为.csv扩展名
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('导出成功')
      } catch (error) {
        ElMessage.error('导出失败：' + error.message)
      }
    },
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding: 20px;
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

.main-content {
  margin-top: 20px;
  min-height: calc(100vh - 120px);
  display: flex;
}

.org-structure {
  background-color: var(--tree-background);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .org-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    
    .org-tab {
      flex: 1;
      padding: 10px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      border-bottom: 2px solid transparent;
      transition: all 0.3s;
      color: var(--text-color);
      font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      
      i {
        font-size: 18px;
      }
      
      &:hover {
        color: var(--primary-color);
        background-color: rgba(103, 194, 58, 0.1);
      }
      
      &.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
        background-color: rgba(103, 194, 58, 0.1);
        font-weight: bold;
      }
    }
  }
  
  .tree-container {
    flex: 1;
    padding: 12px;
    overflow-y: auto;

    .custom-tree {
      background-color: transparent;
      color: var(--text-color);
      font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      
      :deep(.el-tree-node) {
        margin: 4px 0;
        
        .el-tree-node__content {
          height: 36px;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 0 8px;
          transition: all 0.3s;
          font-size: 14px;
          background-color: transparent;
          
          &:hover {
            background-color: transparent;
            border-color: var(--primary-color);
            color: var(--primary-color);
          }
          
          &.is-current {
            background-color: transparent;
            border: 2px solid var(--primary-color);
            color: var(--primary-color);
            font-weight: bold;
            
            .custom-tree-node {
              color: var(--primary-color);
            }
          }
        }
      }
    }
  }
}

.device-card {
  margin-bottom: 16px;
  transition: all 0.3s;
  background-color: var(--card-background);
  border: 1px solid var(--border-color) !important;
  border-radius: 4px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
    border-color: var(--primary-color) !important;
  }
  
  &.running {
    border: 2px solid var(--primary-color) !important;
  }
  
  .device-header {
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    gap: 8px;
    
    .device-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--text-color);
    }
  }
  
  .device-content {
    .temp-display {
      text-align: center;
      margin-bottom: 16px;
      
      .temp-label {
        color: var(--text-color);
        margin-bottom: 8px;
      }
      
      .temp-value {
        font-size: 28px;
        color: #f4a261;
        font-weight: 500;
      }
    }
    
    .device-info {
      margin-bottom: 16px;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        font-size: 13px;
        
        .label {
          color: var(--text-color);
          opacity: 0.7;
        }
        
        .value {
          color: var(--text-color);
        }
      }
    }
    
    .device-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .mode-icons {
        .mode-icon {
          font-size: 26px;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            transform: scale(1.1);
          }
          
          &.cooling {
            color: #409EFF !important;
          }
          
          &.heating {
            color: #F56C6C !important;
          }
          
          &.fan {
            color: #67C23A !important;
          }
          
          &.dehumidify {
            color: #E6A23C !important;
          }
          
          &.auto {
            color: #909399 !important;
          }
        }
      }
    }
  }
}

.filter-container {
  .filter-item {
    margin-right: 10px;
  }
}

.control-dialog {
  display: none;
}

:root {
  --primary-color: #67c23a;
  --secondary-color: #409eff;
  --background-color: #f0f2f5;
  --card-background: #fff;
  --text-color: #303133;
  --border-color: #e4e7ed;
  --tree-background: #ffffff;
  --tree-hover-background: transparent;
  --tree-active-background: transparent;
}

.dark-theme {
  --primary-color: #85ce61;
  --secondary-color: #79bbff;
  --background-color: #1a2942;
  --card-background: #243656;
  --text-color: #fff;
  --border-color: #334769;
  --tree-background: #243656;
  --tree-hover-background: transparent;
  --tree-active-background: transparent;
  
  .org-structure {
    .tree-container {
      .custom-tree {
        :deep(.el-tree-node) {
          .el-tree-node__content {
            &:hover {
              background-color: transparent;
              border-color: var(--primary-color);
              color: var(--primary-color);
            }
            
            &.is-current {
              background-color: transparent;
              border: 2px solid var(--primary-color);
              color: var(--primary-color);
            }
          }
        }
      }
    }
  }
}

// 修改选择器的样式以适应深色主题
::v-deep .el-select {
  .el-input {
    .el-input__inner {
      background-color: #2d2d2d;
      border-color: #484848;
      color: #c4c4c4;
      height: 28px;
      line-height: 28px;
      font-size: 12px;

      &:hover, &:focus {
        border-color: #409EFF;
      }
    }
  }
}

::v-deep .el-select-dropdown {
  background-color: #252526;
  border: 1px solid #484848;

  .el-select-dropdown__item {
    color: #c4c4c4;
    font-size: 12px;

    &.selected {
      background-color: #37373d;
      color: #409EFF;
    }

    &:hover {
      background-color: #2c2c2c;
    }
  }
}

.org-selector {
  margin: 20px 0;
  display: flex;
  gap: 20px;
  align-items: center;
  
  .view-selector {
    width: 150px;
  }
  
  .org-select {
    width: 200px;
  }
}

.dark-theme {
  .org-selector {
    ::v-deep .el-select {
      .el-input__inner {
        background-color: #243656;
        border-color: #334769;
        color: #fff;
      }
    }
  }
}

.single-device-control-dialog {
  :deep(.el-dialog__body) {
    padding-top: 20px;
  }
  
  :deep(.el-dialog__footer) {
    .dialog-footer {
      display: flex;
      justify-content: center;
      
      .el-button {
        min-width: 100px;
      }
    }
  }
  
  :deep(.temp-control) {
    .temp-control-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .el-input-number {
        width: 60%;
      }
      
      .el-button {
        margin-left: 60px;
        min-width: 80px;
      }
    }
  }
  
  :deep(.el-switch),
  :deep(.el-radio-group) {
    pointer-events: auto;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 22px;
  }
  
  :deep(.el-radio-group) {
    .el-radio {
      margin-right: 20px;
      margin-bottom: 10px;
      
      &.is-checked {
        .el-radio__label {
          color: var(--el-color-primary);
        }
      }
    }
  }
}

.current-value {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  margin-left: 2px;
}
</style>
