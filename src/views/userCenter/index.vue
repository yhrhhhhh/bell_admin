<template>
  <div class="app-container">
    <el-row :gutter="20" v-if="currentUser">
      <el-col :span="6">
        <el-card class="box-card">
          <template #header>
            <div class="clearfix">
              <span>个人信息</span>
            </div>
          </template>
          <div v-if="currentUser">
            <div class="text-center">
              <avatar :user="currentUser"/>
            </div>
            <ul class="list-group list-group-striped">
              <li class="list-group-item">
                <svg-icon icon="user"/>&nbsp;&nbsp;用户名称
                <div class="pull-right">{{ currentUser.username }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon="phone"/>&nbsp;&nbsp;手机号码
                <div class="pull-right">{{ currentUser.phonenumber }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon="email"/>&nbsp;&nbsp;用户邮箱
                <div class="pull-right">{{ currentUser.email }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon="peoples"/>&nbsp;&nbsp;所属角色
                <div class="pull-right">{{ currentUser.roles }}</div>
              </li>
              <li class="list-group-item">
                <svg-icon icon="date"/>&nbsp;&nbsp;创建日期
                <div class="pull-right">{{ currentUser.login_date }}</div>
              </li>
            </ul>
          </div>
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="clearfix">
              <span>基本资料</span>
            </div>
          </template>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="userinfo">
              <userInfo :user="currentUser"/>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="resetPwd">
              <resetPwd :user="currentUser"/>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
    <div v-else class="loading-container">
      <el-empty description="加载中...">
        <template #image>
          <el-icon class="loading-icon"><Loading /></el-icon>
        </template>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from "vue";
import avatar from './components/avatar'
import userInfo from './components/userInfo'
import resetPwd from './components/resetPwd'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref("userinfo")
const currentUser = ref(null)

const loadUserInfo = () => {
  try {
    const userStr = localStorage.getItem("currentUser")
    if (!userStr) {
      ElMessage.error('用户信息已失效，请重新登录')
      router.push('/login')
      return false
    }
    const userData = JSON.parse(userStr)
    if (!userData || !userData.username) {
      ElMessage.error('用户信息不完整，请重新登录')
      router.push('/login')
      return false
    }
    currentUser.value = userData
    return true
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败，请重新登录')
    router.push('/login')
    return false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  min-height: 100vh;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;

  .loading-icon {
    font-size: 32px;
    color: #409EFF;
    animation: rotate 2s linear infinite;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.list-group-striped > .list-group-item {
  border-left: 0;
  border-right: 0;
  border-radius: 0;
  padding-left: 0;
  padding-right: 0;
}

.list-group-item {
  border-bottom: 1px solid #e7eaec;
  border-top: 1px solid #e7eaec;
  margin-bottom: -1px;
  padding: 11px 0;
  font-size: 13px;
}

.pull-right {
  float: right !important;
}

.text-center {
  text-align: center;
  margin-bottom: 20px;
}

::v-deep .el-card__body {
  height: auto;
  min-height: 230px;
}

::v-deep .box-card {
  height: auto;
  min-height: 450px;
}
</style>
