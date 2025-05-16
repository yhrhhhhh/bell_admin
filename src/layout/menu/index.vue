<template>
  <el-menu
      active-text-color="#ffd04b"
      background-color="#2d3a4b"
      class="el-menu-vertical-demo"
      text-color="#fff"
      router
      :default-active="'/index'"
  >
    <el-menu-item index="/index" @click="openTab({name:'首页',path:'/index'})">
      <el-icon>
        <home-filled/>
      </el-icon>
      <span>首页</span>
    </el-menu-item>

    <el-menu-item index="/bsns/department" @click="openTab({name:'外机控制面板',path:'/bsns/department'})">
      <el-icon>
        <svg-icon icon="department"/>
      </el-icon>
      <span>外机控制面板</span>
    </el-menu-item>

  </el-menu>
</template>

<script setup>
import store from '@/store'
import {
  HomeFilled
} from '@element-plus/icons-vue'

const openTab=(item)=>{
  store.commit('ADD_TABS',item)
}
</script>

<style lang="scss" scoped>

</style>
