<template>
  <div class="navbar">
    <div class="left-menu">
      <slot name="before-breadcrumb"></slot>
      <Breadcrumb/>
    </div>
    <div class="navbar-right">
      <Avatar/>
    </div>
  </div>
</template>

<script setup>
import Breadcrumb from './components/breadcrumb'
import Avatar from './components/avatar'


</script>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  height: 60px;
  overflow: hidden;
  background-color: #F5F5F5;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  position: relative;

  .left-menu {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .navbar-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 16px;

    ::v-deep .navbar-item {
      display: inline-block;
      margin-left: 18px;
      font-size: 22px;
      color: #5a5e66;
      box-sizing: border-box;
      cursor: pointer;
    }
  }
}
</style>
