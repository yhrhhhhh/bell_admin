<template>
  <el-menu
      active-text-color="#ffd04b"
      background-color="#2d3a4b"
      class="el-menu-vertical-demo"
      text-color="#fff"
      router
      :default-active="'/index'"
      :collapse="isCollapse"
      :collapse-transition="false"
  >
    <el-menu-item index="/index" @click="openTab({name:'首页',path:'/index'})">
      <el-icon>
        <home-filled/>
      </el-icon>
      <template #title>首页</template>
    </el-menu-item>

    <el-menu-item index="/bsns/department" @click="openTab({name:'外机控制面板',path:'/bsns/department'})">
      <el-icon>
        <svg-icon icon="department"/>
      </el-icon>
      <template #title>外机控制面板</template>
    </el-menu-item>

  </el-menu>
</template>

<script setup>
import store from '@/store'
import {
  HomeFilled
} from '@element-plus/icons-vue'

defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  }
})

const openTab=(item)=>{
  store.commit('ADD_TABS',item)
}
</script>

<style lang="scss" scoped>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
}

:deep(.el-menu-item) {
  &.is-active {
    background-color: #1f2d3d !important;
  }
  
  &:hover {
    background-color: #1f2d3d !important;
  }
}
</style>
