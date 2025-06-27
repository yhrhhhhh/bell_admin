<template>
  <div class="app-wrapper">
    <el-container>
      <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar-container">
        <Menu :is-collapse="isCollapse"/>
      </el-aside>
      <el-container>
        <el-header>
          <Header>
            <template #before-breadcrumb>
              <div class="hamburger-container" @click="toggleSideBar">
                <el-icon :class="{'is-active': !isCollapse}">
                  <Fold v-if="isCollapse"/>
                  <Expand v-else/>
                </el-icon>
              </div>
            </template>
          </Header>
        </el-header>
        <el-main><Tabs/><router-view/></el-main>
        <el-footer><Footer/></el-footer>
      </el-container>
    </el-container>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import Menu from '@/layout/menu'
import Header from '@/layout/header'
import Footer from '@/layout/footer'
import Tabs from '@/layout/tabs'
import { Fold, Expand } from '@element-plus/icons-vue'

const isCollapse = ref(false)

const toggleSideBar = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.sidebar-container {
  background-color: #2d3a4b;
  height: 100%;
  transition: width 0.3s;
  overflow: hidden;
}

.el-container {
  height: 100%
}

.el-header {
  padding-left: 0px;
  padding-right: 0px;
}

:deep(ul.el-menu) {
  border-right-width: 0px
}

.hamburger-container {
  padding: 0 15px;
  height: 100%;
  float: left;
  cursor: pointer;
  transition: background .3s;
  display: flex;
  align-items: center;
  
  &:hover {
    background: rgba(0, 0, 0, .025)
  }
  
  .el-icon {
    font-size: 20px;
    
    &.is-active {
      transform: rotate(180deg);
    }
  }
}
</style>
