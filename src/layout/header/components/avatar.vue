<template>
  <el-dropdown>
    <span class="el-dropdown-link">
      <el-avatar shape="square" :size="40" :src="squareUrl" />
      &nbsp;&nbsp;{{username}}
      <el-icon class="el-icon--right">
        <arrow-down />
      </el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="goToUserCenter">
          个人中心
        </el-dropdown-item>
        <el-dropdown-item @click="goToUserManage">
          用户管理
        </el-dropdown-item>
        <el-dropdown-item @click="logout">安全退出</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import requestUtil,{getServerUrl} from '@/util/request'
import router from '@/router'
import store from '@/store'

const username = ref('用户')
const squareUrl = ref('')

onMounted(() => {
  try {
    const userStr = window.sessionStorage.getItem("currentUser")
    if (userStr) {
      const user = JSON.parse(userStr)
      username.value = user.username || '用户'
      squareUrl.value = getServerUrl() + 'media/userAvatar/' + (user.avatar || 'default.jpg')
    } else {
      squareUrl.value = getServerUrl() + 'media/userAvatar/default.jpg'
    }
  } catch (e) {
    console.error('解析用户数据失败:', e)
    squareUrl.value = getServerUrl() + 'media/userAvatar/default.jpg'
  }
})

const goToUserCenter = () => {
  const menuItem = {name:'个人中心',path:'/userCenter'}
  store.commit('ADD_TABS', menuItem)
  router.push('/userCenter')
}

const goToUserManage = () => {
  const menuItem = {name:'用户管理',path:'/sys/user'}
  store.commit('ADD_TABS', menuItem)
  router.push('/sys/user')
}

const logout=()=>{
  window.sessionStorage.clear()
  store.commit('RESET_TAB')
  router.replace("/login")
}
</script>

<style lang="scss" scoped>
.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}
</style>
