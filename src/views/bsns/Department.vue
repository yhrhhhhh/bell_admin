<template>
  <div class="app-container" :class="{'dark-theme': isDarkTheme}">
    <div class="header-container">
      <div class="filter-container">
        <el-input v-model="listQuery.name" placeholder="名称搜索" style="width: 200px;" class="filter-item"/>
        <el-select v-model="listQuery.status" placeholder="状态搜索" clearable style="width: 120px" class="filter-item">
          <el-option v-for="item in statusOptions" :key="item.key" :label="item.label" :value="item.key"/>
        </el-select>
        <el-button class="filter-item" type="primary" @click="handleFilter">搜索</el-button>
        <el-button 
          class="filter-item" 
          type="warning" 
          @click="showDeviceId = !showDeviceId"
        >
          {{ showDeviceId ? '隐藏设备编号' : '显示设备编号' }}
        </el-button>
        
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
        
        <!-- 修改添加设备按钮为设备管理下拉菜单 -->
        <el-dropdown class="filter-item" @command="handleManagementCommand">
          <el-button type="success">
            设备管理
            <i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="addDevice">添加设备</el-dropdown-item>
              <el-dropdown-item command="gatewayManage">网关管理</el-dropdown-item>
              <el-dropdown-item command="buildingManage">建筑和楼层管理</el-dropdown-item>
              <el-dropdown-item command="companyManage">公司和部门管理</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          class="filter-item"
          type="success"
          icon="el-icon-download"
          @click="handleExport"
        >
        导出所有设备信息
        </el-button>
      </div>
      <div class="right-controls">
        <div class="refresh-info">
          <span v-if="lastRefreshTime" class="time">
            最后刷新: {{ new Date(lastRefreshTime).toLocaleTimeString() }}
          </span>
          <el-button
            type="text"
            :icon="isAutoRefresh ? 'el-icon-video-pause' : 'el-icon-video-play'"
            @click="toggleAutoRefresh"
          >
            {{ isAutoRefresh ? '关闭自动刷新' : '开启自动刷新' }}
          </el-button>
        </div>
        <el-switch
          v-model="isDarkTheme"
          active-text="深色主题"
          inactive-text="浅色主题"
          class="theme-switch"
        />
      </div>
    </div>

    <el-row :gutter="20" class="main-content">
      <!-- 左侧树形菜单 -->
      <el-col :span="5">
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
      <el-col :span="19">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="device in deviceList" :key="device.id">
            <el-card class="device-card" :class="{'running': device.status === 'running', 'offline': !device.actual_online_status}">
              <div class="device-header">
                <el-checkbox 
                  v-model="device.selected"
                  @change="handleDeviceSelect"
                  class="device-checkbox"
                ></el-checkbox>
                <div class="device-title">
                  <span class="device-name">
                    {{ device.name }}
                    <template v-if="showDeviceId">
                      ({{ device.device_id }})
                    </template>
                  </span>
                  <span v-if="showDeviceId" class="device-uuid">
                    UUID: {{ device.uuid_info ? device.uuid_info.uuid : '无' }}
                  </span>
                  <span class="device-status-info">
                    <el-tag size="small" :type="device.actual_online_status ? 'success' : 'danger'">
                      {{ device.actual_online_status ? '在线' : '离线' }}
                    </el-tag>
                    <el-tooltip effect="dark" placement="top">
                      <template #content>
                        <div>设备状态: {{ device.online_status ? '在线' : '离线' }}</div>
                        <div>网关状态: {{ device.gateway_online ? '在线' : '离线' }}</div>
                      </template>
                      <i class="el-icon-info-filled" style="margin-left: 5px; cursor: pointer;"></i>
                    </el-tooltip>
                  </span>
                </div>
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

    <!-- 建筑管理对话框 -->
    <el-dialog
      v-model="buildingDialogVisible"
      title="建筑管理"
      width="60%"
    >
      <div class="building-management">
        <div class="management-header">
          <el-button type="primary" @click="handleAddBuilding" class="add-button">
            <i class="el-icon-plus"></i> 添加建筑
          </el-button>
        </div>
        <el-table :data="buildingList" style="width: 100%">
          <el-table-column prop="name" label="建筑名称"/>
          <el-table-column prop="code" label="建筑编码"/>
          <el-table-column prop="description" label="建筑描述"/>
          <el-table-column label="操作" width="280">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button size="small" type="primary" @click="handleEditBuilding(scope.row)">
                  <i class="el-icon-edit"></i> 编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteBuilding(scope.row)">
                  <i class="el-icon-delete"></i> 删除
                </el-button>
                <el-button size="small" type="success" @click="handleManageFloors(scope.row)">
                  <i class="el-icon-office-building"></i> 楼层
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 楼层管理对话框 -->
    <el-dialog
      v-model="floorDialogVisible"
      :title="currentBuilding ? `${currentBuilding.name}的楼层管理` : '楼层管理'"
      width="50%"
    >
      <div class="floor-management">
        <div class="management-header">
          <el-button type="primary" @click="handleAddFloor" class="add-button">
            <i class="el-icon-plus"></i> 添加楼层
          </el-button>
        </div>
        <el-table :data="floorList" style="width: 100%">
          <el-table-column prop="name" label="楼层名称"/>
          <el-table-column prop="floor_number" label="楼层号"/>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button size="small" type="primary" @click="handleEditFloor(scope.row)">
                  <i class="el-icon-edit"></i> 编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteFloor(scope.row)">
                  <i class="el-icon-delete"></i> 删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 公司管理对话框 -->
    <el-dialog
      v-model="companyDialogVisible"
      title="公司管理"
      width="60%"
    >
      <div class="company-management">
        <div class="management-header">
          <el-button type="primary" @click="handleAddCompany" class="add-button">
            <i class="el-icon-plus"></i> 添加公司
          </el-button>
        </div>
        <el-table :data="companyList" style="width: 100%">
          <el-table-column prop="name" label="公司名称"/>
          <el-table-column prop="code" label="公司编码"/>
          <el-table-column label="操作" width="280">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button size="small" type="primary" @click="handleEditCompany(scope.row)">
                  <i class="el-icon-edit"></i> 编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteCompany(scope.row)">
                  <i class="el-icon-delete"></i> 删除
                </el-button>
                <el-button size="small" type="success" @click="handleManageDepartments(scope.row)">
                  <i class="el-icon-suitcase"></i> 部门
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 部门管理对话框 -->
    <el-dialog
      v-model="departmentDialogVisible"
      :title="currentCompany ? `${currentCompany.name}的部门管理` : '部门管理'"
      width="50%"
    >
      <div class="department-management">
        <div class="management-header">
          <el-button type="primary" @click="handleAddDepartment" class="add-button">
            <i class="el-icon-plus"></i> 添加部门
          </el-button>
        </div>
        <el-table :data="departmentList" style="width: 100%">
          <el-table-column prop="name" label="部门名称"/>
          <el-table-column prop="code" label="部门编码"/>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button size="small" type="primary" @click="handleEditDepartment(scope.row)">
                  <i class="el-icon-edit"></i> 编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteDepartment(scope.row)">
                  <i class="el-icon-delete"></i> 删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 添加/编辑建筑对话框 -->
    <el-dialog
      v-model="buildingFormDialogVisible"
      :title="buildingForm.id ? '编辑建筑' : '添加建筑'"
      width="40%"
    >
      <el-form :model="buildingForm" :rules="buildingRules" ref="buildingFormRef" label-width="100px">
        <el-form-item label="建筑名称" prop="name">
          <el-input v-model="buildingForm.name" placeholder="请输入建筑名称"/>
        </el-form-item>
        <el-form-item label="建筑编码" prop="code">
          <el-input v-model="buildingForm.code" placeholder="请输入建筑编码"/>
        </el-form-item>
        <el-form-item label="建筑描述" prop="description">
          <el-input type="textarea" v-model="buildingForm.description" placeholder="请输入建筑描述"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="buildingFormDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitBuildingForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加/编辑楼层对话框 -->
    <el-dialog
      v-model="floorFormDialogVisible"
      :title="floorForm.id ? '编辑楼层' : '添加楼层'"
      width="40%"
    >
      <el-form :model="floorForm" :rules="floorRules" ref="floorFormRef" label-width="100px">
        <el-form-item label="楼层名称" prop="name">
          <el-input v-model="floorForm.name" placeholder="请输入楼层名称"/>
        </el-form-item>
        <el-form-item label="楼层号" prop="floor_number">
          <el-input-number v-model="floorForm.floor_number" :min="-5" :max="100" placeholder="请输入楼层号"/>
        </el-form-item>
        <el-form-item label="楼层描述" prop="description">
          <el-input type="textarea" v-model="floorForm.description" placeholder="请输入楼层描述"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="floorFormDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitFloorForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加/编辑公司对话框 -->
    <el-dialog
      v-model="companyFormDialogVisible"
      :title="companyForm.id ? '编辑公司' : '添加公司'"
      width="40%"
    >
      <el-form :model="companyForm" :rules="companyRules" ref="companyFormRef" label-width="100px">
        <el-form-item label="公司名称" prop="name">
          <el-input v-model="companyForm.name" placeholder="请输入公司名称"/>
        </el-form-item>
        <el-form-item label="公司编码" prop="code">
          <el-input v-model="companyForm.code" placeholder="请输入公司编码"/>
        </el-form-item>
        <el-form-item label="公司描述" prop="description">
          <el-input type="textarea" v-model="companyForm.description" placeholder="请输入公司描述"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="companyFormDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitCompanyForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加/编辑部门对话框 -->
    <el-dialog
      v-model="departmentFormDialogVisible"
      :title="departmentForm.id ? '编辑部门' : '添加部门'"
      width="40%"
    >
      <el-form :model="departmentForm" :rules="departmentRules" ref="departmentFormRef" label-width="100px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="departmentForm.name" placeholder="请输入部门名称"/>
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="departmentForm.code" placeholder="请输入部门编码"/>
        </el-form-item>
        <el-form-item label="部门描述" prop="description">
          <el-input type="textarea" v-model="departmentForm.description" placeholder="请输入部门描述"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="departmentFormDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitDepartmentForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 网关管理对话框 -->
    <el-dialog
      v-model="gatewayDialogVisible"
      title="网关管理"
      width="60%"
    >
      <div class="gateway-management">
        <div class="management-header">
          <el-button type="primary" @click="handleAddGateway" class="add-button">
            <i class="el-icon-plus"></i> 添加网关
          </el-button>
        </div>
        <el-table :data="gatewayList" style="width: 100%">
          <el-table-column prop="uuid" label="UUID"/>
          <el-table-column prop="subscribe_topic" label="订阅主题"/>
          <el-table-column prop="publish_topic" label="发布主题"/>
          <el-table-column prop="description" label="描述"/>
          <el-table-column label="操作" width="280">
            <template #default="scope">
              <div class="operation-buttons">
                <el-button size="small" type="primary" @click="handleEditGateway(scope.row)">
                  <i class="el-icon-edit"></i> 编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteGateway(scope.row.uuid)">
                  <i class="el-icon-delete"></i> 删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 添加/编辑网关对话框 -->
    <el-dialog
      v-model="gatewayFormDialogVisible"
      :title="gatewayForm.uuid ? '编辑网关' : '添加网关'"
      width="40%"
    >
      <el-form :model="gatewayForm" :rules="gatewayRules" ref="gatewayFormRef" label-width="100px">
        <el-form-item label="UUID" prop="uuid">
          <el-input v-model="gatewayForm.uuid" placeholder="请输入UUID" :disabled="!!gatewayForm.uuid"/>
        </el-form-item>
        <el-form-item label="订阅主题" prop="subscribe_topic">
          <el-input v-model="gatewayForm.subscribe_topic" placeholder="请输入订阅主题"/>
        </el-form-item>
        <el-form-item label="发布主题" prop="publish_topic">
          <el-input v-model="gatewayForm.publish_topic" placeholder="请输入发布主题"/>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="gatewayForm.description" placeholder="请输入描述"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="gatewayFormDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="handleGatewaySubmit">确 定</el-button>
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
      showDeviceId: false,
      currentTreeType: 'building',
      buildingTreeData: [],
      gatewayTreeData: [],
      companyTreeData: [],
      refreshInterval: null,  // 用于存储定时器
      isAutoRefresh: true,    // 控制自动刷新开关
      lastRefreshTime: null,  // 记录最后刷新时间
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
        ]
      },
      uuidOptions: [],
      buildingDialogVisible: false,
      buildingList: [],
      buildingForm: {
        id: null,
        name: '',
        code: '',
        description: ''
      },
      buildingFormDialogVisible: false,
      buildingRules: {
        name: [
          { required: true, message: '请输入建筑名称', trigger: 'blur' },
          { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        code: [
          { required: true, message: '请输入建筑编码', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
          { pattern: /^[A-Za-z0-9-_]+$/, message: '编码只能包含字母、数字、下划线和横线', trigger: 'blur' }
        ]
      },
      floorDialogVisible: false,
      floorList: [],
      currentBuilding: null,
      floorForm: {
        id: null,
        name: '',
        floor_number: 1,
        description: '',
        building: null
      },
      floorFormDialogVisible: false,
      floorRules: {
        name: [{ required: true, message: '请输入楼层名称', trigger: 'blur' }],
        floor_number: [{ required: true, message: '请输入楼层号', trigger: 'blur' }]
      },
      companyDialogVisible: false,
      companyList: [],
      companyForm: {
        id: null,
        name: '',
        code: '',
        description: ''
      },
      companyFormDialogVisible: false,
      companyRules: {
        name: [{ required: true, message: '请输入公司名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入公司编码', trigger: 'blur' }]
      },
      departmentDialogVisible: false,
      departmentList: [],
      currentCompany: null,
      departmentForm: {
        id: null,
        name: '',
        code: '',
        description: '',
        company: null
      },
      departmentFormDialogVisible: false,
      departmentRules: {
        name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
        code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }]
      },
      gatewayDialogVisible: false,
      gatewayForm: {
        uuid: '',
        subscribe_topic: '',
        publish_topic: '',
        description: ''
      },
      gatewayRules: {
        uuid: [
          { required: true, message: '请输入UUID', trigger: 'blur' }
        ],
        subscribe_topic: [
          { required: true, message: '请输入订阅Topic', trigger: 'blur' }
        ],
        publish_topic: [
          { required: true, message: '请输入发布Topic', trigger: 'blur' }
        ]
      },
      gatewayList: [],
      gatewayFormDialogVisible: false
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
    this.startAutoRefresh()
  },
  beforeDestroy() {
    this.stopAutoRefresh()
  },
  methods: {
    toggleAutoRefresh() {
      this.isAutoRefresh = !this.isAutoRefresh
      if (this.isAutoRefresh) {
        this.startAutoRefresh()
        this.$message.success('已开启自动刷新')
      } else {
        this.stopAutoRefresh()
        this.$message.success('已关闭自动刷新')
      }
    },

    startAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
      }
      
      // 只在自动刷新开启时创建定时器
      if (this.isAutoRefresh) {
        this.refreshInterval = setInterval(() => {
          // 检查页面是否在活动标签页中
          if (document.visibilityState === 'visible') {
            this.refreshDeviceList()
          }
        }, 10000)
      }
    },
    
    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },
    
    async refreshDeviceList() {
      try {
        // 构建查询参数，保持当前筛选条件
        const params = {
          name: this.listQuery.name,
          status: this.listQuery.status
        }
        
        // 获取新数据
        const response = await get(`/api/device/filter/?${new URLSearchParams(params).toString()}`)
        
        // 保存滚动位置
        const container = this.$el.querySelector('.el-col:last-child')
        const scrollTop = container ? container.scrollTop : 0
        
        // 智能更新设备列表
        const newDevices = response.data
        this.deviceList = this.deviceList.map(oldDevice => {
          const newDevice = newDevices.find(d => d.id === oldDevice.id)
          if (newDevice) {
            // 保持选中状态和其他用户交互状态
            return {
              ...newDevice,
              selected: oldDevice.selected
            }
          }
          return oldDevice
        })
        
        // 恢复滚动位置
        this.$nextTick(() => {
          if (container) {
            container.scrollTop = scrollTop
          }
        })
        
        this.lastRefreshTime = new Date()
      } catch (error) {
        console.error('刷新设备列表失败:', error)
        // 出错时不显示错误提示，避免打扰用户
      }
    },
    
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
        
        // 修改网关树的设备显示格式
        this.gatewayTreeData = response.data.gateway_tree.map(gateway => ({
          ...gateway,
          children: gateway.children ? gateway.children.map(device => ({
            ...device,
            label: `${device.label}(${device.device_id || ''})`  // 拼接设备名称和device_id
          })) : []
        }))
        
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
        const requiredFields = ['name', 'device_id', 'uuid']
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
        const requiredFields = ['name', 'device_id', 'uuid']
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
    // 设备管理下拉菜单处理
    handleManagementCommand(command) {
      if (command === 'addDevice') {
        this.handleAdd()
      } else if (command === 'gatewayManage') {
        this.handleGatewayManage()
      } else if (command === 'buildingManage') {
        this.handleBuildingManage()
      } else if (command === 'companyManage') {
        this.handleCompanyManage()
      }
    },
    async handleGatewayManage() {
      await this.fetchGatewayList()
      this.gatewayDialogVisible = true
    },
    async fetchGatewayList() {
      try {
        const response = await get('/api/device/topic/uuid-list/')
        if (response.data.code === 200) {
          this.gatewayList = response.data.data
        } else {
          this.$message.error('获取网关列表失败')
        }
      } catch (error) {
        this.$message.error('获取网关列表失败：' + error.message)
      }
    },
    handleAddGateway() {
      this.gatewayForm = {
        uuid: '',
        subscribe_topic: '',
        publish_topic: '',
        description: ''
      }
      this.$refs.gatewayFormRef && this.$refs.gatewayFormRef.resetFields()
      this.gatewayFormDialogVisible = true  // 打开添加网关对话框
    },
    handleEditGateway(gateway) {
      // 将当前网关数据填充到表单中
      this.gatewayForm = {
        uuid: gateway.uuid,
        subscribe_topic: gateway.subscribe_topic,
        publish_topic: gateway.publish_topic,
        description: gateway.description || ''
      }
      this.gatewayFormDialogVisible = true  // 打开编辑对话框
    },
    async handleDeleteGateway(uuid) {
      try {
        await this.$confirm('删除网关将同时删除其下所有关联设备，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await del(`/api/device/topic/delete/${uuid}/`)
        if (response.status === 200) {
          this.$message.success(response.data.message)  // 使用后端返回的消息，包含删除的设备数量
          await this.fetchGatewayList()
          await this.fetchAllTrees()  // 刷新树形结构
        } else {
          this.$message.error(response.data.message || '删除失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败：' + error.message)
        }
      }
    },
    async handleGatewaySubmit() {
      try {
        await this.$refs.gatewayFormRef.validate()
        
        const response = await post('/api/device/topic/create_or_update/', this.gatewayForm)
        
        if (response.data.success) {
          this.$message.success(response.data.created ? '添加成功' : '更新成功')
          this.gatewayFormDialogVisible = false  // 直接关闭对话框
          await this.fetchGatewayList()
        } else {
          this.$message.error(response.data.message || '操作失败')
        }
      } catch (error) {
        this.$message.error('操作失败：' + error.message)
      }
    },
    // 建筑管理相关方法
    async showBuildingManagement() {
      await this.fetchBuildingList()
      this.buildingDialogVisible = true
    },
    async fetchBuildingList() {
      try {
        const response = await get('/api/device/buildings/')
        if (response.data) {
          this.buildingList = response.data.map(building => ({
            id: building.id,
            name: building.name || '未命名建筑',
            code: building.code || '无编码',
            description: building.description || '无描述'
          }))
          console.log('建筑列表:', this.buildingList)  // 添加调试日志
        } else {
          this.$message.warning('获取建筑列表数据为空')
          this.buildingList = []
        }
      } catch (error) {
        console.error('获取建筑列表失败:', error)
        this.$message.error('获取建筑列表失败：' + (error.response?.data?.message || error.message))
        this.buildingList = []
      }
    },
    handleAddBuilding() {
      this.buildingForm = {
        id: null,
        name: '',
        code: '',
        description: ''
      }
      this.buildingFormDialogVisible = true
    },
    handleEditBuilding(building) {
      this.buildingForm = { ...building }
      this.buildingFormDialogVisible = true
    },
    async handleDeleteBuilding(building) {
      try {
        await this.$confirm('删除建筑将同时删除其下所有楼层，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await del(`/api/device/buildings/${building.id}/`)
        this.$message.success('删除成功')
        await this.fetchBuildingList()
        await this.fetchAllTrees()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败：' + error.message)
        }
      }
    },
    async submitBuildingForm() {
      try {
        await this.$refs.buildingFormRef.validate()
        if (this.buildingForm.id) {
          await put(`/api/device/buildings/${this.buildingForm.id}/`, this.buildingForm)
          this.$message.success('修改成功')
        } else {
          await post('/api/device/buildings/', this.buildingForm)
          this.$message.success('添加成功')
        }
        this.buildingFormDialogVisible = false
        await this.fetchBuildingList()
        await this.fetchAllTrees()
      } catch (error) {
        this.$message.error('操作失败：' + error.message)
      }
    },
    // 楼层管理相关方法
    async handleManageFloors(building) {
      this.currentBuilding = building
      await this.fetchFloorList(building.id)
      this.floorDialogVisible = true
    },
    async fetchFloorList(buildingId) {
      try {
        const response = await get(`/api/device/buildings/${buildingId}/floors/`)
        this.floorList = response.data
      } catch (error) {
        this.$message.error('获取楼层列表失败：' + error.message)
      }
    },
    handleAddFloor() {
      this.floorForm = {
        id: null,
        name: '',
        floor_number: 1,
        description: '',
        building: this.currentBuilding.id
      }
      this.floorFormDialogVisible = true
    },
    handleEditFloor(floor) {
      this.floorForm = { ...floor }
      this.floorFormDialogVisible = true
    },
    async handleDeleteFloor(floor) {
      try {
        await this.$confirm('确定要删除该楼层吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await del(`/api/device/floors/${floor.id}/`)
        this.$message.success('删除成功')
        await this.fetchFloorList(this.currentBuilding.id)
        await this.fetchAllTrees()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败：' + error.message)
        }
      }
    },
    async submitFloorForm() {
      try {
        await this.$refs.floorFormRef.validate()
        const floorData = {
          name: this.floorForm.name,
          floor_number: this.floorForm.floor_number,
          description: this.floorForm.description,
          building: this.currentBuilding.id  // 确保设置building字段
        }
        
        console.log('提交楼层数据:', floorData)  // 添加调试日志
        
        if (this.floorForm.id) {
          await put(`/api/device/floors/${this.floorForm.id}/`, floorData)
          this.$message.success('修改成功')
        } else {
          await post('/api/device/floors/', floorData)
          this.$message.success('添加成功')
        }
        this.floorFormDialogVisible = false
        await this.fetchFloorList(this.currentBuilding.id)
        await this.fetchAllTrees()
      } catch (error) {
        console.error('楼层操作失败:', error)
        this.$message.error('操作失败：' + (error.response?.data?.message || error.response?.data?.error || error.message))
      }
    },
    // 公司管理相关方法
    async showCompanyManagement() {
      await this.fetchCompanyList()
      this.companyDialogVisible = true
    },
    async fetchCompanyList() {
      try {
        const response = await get('/api/device/companies/')
        this.companyList = response.data
      } catch (error) {
        this.$message.error('获取公司列表失败：' + error.message)
      }
    },
    handleAddCompany() {
      this.companyForm = {
        id: null,
        name: '',
        code: '',
        description: ''
      }
      this.companyFormDialogVisible = true
    },
    handleEditCompany(company) {
      this.companyForm = { ...company }
      this.companyFormDialogVisible = true
    },
    async handleDeleteCompany(company) {
      try {
        await this.$confirm('删除公司将同时删除其下所有部门，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await del(`/api/device/companies/${company.id}/`)
        this.$message.success('删除成功')
        await this.fetchCompanyList()
        await this.fetchAllTrees()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败：' + error.message)
        }
      }
    },
    async submitCompanyForm() {
      try {
        await this.$refs.companyFormRef.validate()
        if (this.companyForm.id) {
          await put(`/api/device/companies/${this.companyForm.id}/`, this.companyForm)
          this.$message.success('修改成功')
        } else {
          await post('/api/device/companies/', this.companyForm)
          this.$message.success('添加成功')
        }
        this.companyFormDialogVisible = false
        await this.fetchCompanyList()
        await this.fetchAllTrees()
      } catch (error) {
        this.$message.error('操作失败：' + error.message)
      }
    },
    // 部门管理相关方法
    async handleManageDepartments(company) {
      this.currentCompany = company
      await this.fetchDepartmentList(company.id)
      this.departmentDialogVisible = true
    },
    async fetchDepartmentList(companyId) {
      try {
        const response = await get(`/api/device/departments/by_company/?company_id=${companyId}`)
        this.departmentList = response.data
      } catch (error) {
        this.$message.error('获取部门列表失败：' + error.message)
      }
    },
    handleAddDepartment() {
      this.departmentForm = {
        id: null,
        name: '',
        code: '',
        description: '',
        company: this.currentCompany.id
      }
      this.departmentFormDialogVisible = true
    },
    handleEditDepartment(department) {
      this.departmentForm = { ...department }
      this.departmentFormDialogVisible = true
    },
    async handleDeleteDepartment(department) {
      try {
        await this.$confirm('确定要删除该部门吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await del(`/api/device/departments/${department.id}/`)
        this.$message.success('删除成功')
        await this.fetchDepartmentList(this.currentCompany.id)
        await this.fetchAllTrees()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败：' + error.message)
        }
      }
    },
    async submitDepartmentForm() {
      try {
        await this.$refs.departmentFormRef.validate()
        if (this.departmentForm.id) {
          await put(`/api/device/departments/${this.departmentForm.id}/`, this.departmentForm)
          this.$message.success('修改成功')
        } else {
          await post('/api/device/departments/', this.departmentForm)
          this.$message.success('添加成功')
        }
        this.departmentFormDialogVisible = false
        await this.fetchDepartmentList(this.currentCompany.id)
        await this.fetchAllTrees()
      } catch (error) {
        this.$message.error('操作失败：' + error.message)
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
  
  .right-controls {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .refresh-info {
    font-size: 12px;
    color: #909399;
    display: flex;
    align-items: center;
    gap: 8px;
    
    .time {
      color: var(--text-color);
    }
    
    .el-button {
      padding: 0;
      font-size: 13px;
      
      &:hover {
        color: var(--primary-color);
      }
      
      [class^="el-icon-"] {
        margin-right: 4px;
      }
    }
  }
}

.theme-switch {
  margin-left: 20px;
}

.main-content {
  margin-top: 20px;
  height: calc(100vh - 120px);  /* 改为固定高度 */
  display: flex;
  
  .el-col {
    height: 100%;  /* 让列容器占满高度 */
    
    &:last-child {  /* 右侧设备卡片容器 */
      overflow-y: auto;  /* 启用垂直滚动 */
      padding-right: 8px;  /* 为滚动条预留空间 */
      
      /* 自定义滚动条样式 */
      &::-webkit-scrollbar {
        width: 6px;
        background-color: transparent;
      }
      
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      
      &::-webkit-scrollbar-thumb {
        background-color: rgba(144, 147, 153, 0.3);
        border-radius: 3px;
      }
      
      &::-webkit-scrollbar-thumb:hover {
        background-color: rgba(144, 147, 153, 0.5);
      }
      
      .el-row {
        margin-right: 0 !important;  /* 防止滚动条出现时的抖动 */
      }
    }
  }
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
    
    &::-webkit-scrollbar {
      width: 6px !important;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent !important;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(144, 147, 153, 0.3) !important;
      border-radius: 3px !important;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background-color: rgba(144, 147, 153, 0.5) !important;
    }
  }
}

.custom-tree {
  background-color: transparent;
  color: var(--text-color);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  max-height: calc(100vh - 200px); /* 设置最大高度，减去头部和其他元素的高度 */
  overflow-y: auto; /* 启用垂直滚动 */
  
  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
    background-color: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(144, 147, 153, 0.3);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(144, 147, 153, 0.5);
  }
  
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

  &.offline {
    background-color: #f5f5f5 !important;  /* 浅色主题下的灰色背景 */
  }
  
  .device-header {
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: flex-start;  // 修改为flex-start以便垂直对齐
    gap: 8px;
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

  .device-card {
    &.offline {
      background-color: #363636 !important;  /* 深色主题下的灰色背景 */
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

.management-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
  
  .add-button {
    display: flex;
    align-items: center;
    gap: 5px;
    
    i {
      margin-right: 2px;
    }
  }
}

.operation-buttons {
  display: flex;
  gap: 8px;  // 按钮之间的间距
  
  .el-button {
    display: flex;
    align-items: center;
    padding: 5px 12px;
    
    i {
      margin-right: 3px;
    }
  }
}

.device-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  .device-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
  }
  
  .device-uuid {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }

  .device-status-info {
    margin-top: 5px;
    display: flex;
    align-items: center;
    
    .el-tag {
      padding: 0 8px;
      height: 20px;
      line-height: 18px;
    }
    
    .el-icon-info-filled {
      color: #909399;
      font-size: 14px;
      
      &:hover {
        color: var(--primary-color);
      }
    }
  }
}

.gateway-management {
  .management-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
    
    .add-button {
      display: flex;
      align-items: center;
      gap: 5px;
      
      i {
        margin-right: 2px;
      }
    }
  }
}

.gateway-form-dialog {
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
  
  :deep(.el-form-item) {
    margin-bottom: 22px;
  }
}
</style>
