<template>

  <el-menu :default-active="active" class="el-menu-vertical-demo" router background-color="#fff" text-color="#333" active-text-color="#2d8cf0">
    <!-- 一、首页 -->
    <el-menu-item index="/">
      <el-icon><HomeFilled /></el-icon>
      <span>首页</span>
    </el-menu-item>
    <!-- 二、用户管理 -->
    <el-menu-item index="/user" v-if="userType === 1">
      <el-icon><UserFilled /></el-icon>
      <span>用户管理</span>
    </el-menu-item>
  
    <!-- 三、设备管理 -->
    <el-menu-item index="/device" v-if="userType === 1">
      <el-icon><Cpu /></el-icon>
      <span>设备管理</span>
    </el-menu-item>
    <!-- 四、设备预约（所有用户可用） -->
    <el-sub-menu index="/borrow" popper-class="sidebar-submenu">
      <template #title><el-icon><Calendar /></el-icon><span>设备预约</span></template>
      <el-menu-item index="/borrow/apply">预约设备</el-menu-item>
      <el-menu-item index="/borrow/return">我的预约</el-menu-item>
    </el-sub-menu>
    <!-- 五、设备反馈 -->
    <el-menu-item index="/feedback">
      <el-icon><Message /></el-icon>
      <span>设备反馈</span>
    </el-menu-item>
    <!-- 六、单据管理（管理员） -->
    <el-sub-menu index="/order" v-if="userType === 1" popper-class="sidebar-submenu">
      <template #title><el-icon><List /></el-icon><span>单据管理</span></template>
      <el-menu-item index="/order/borrow">预约单管理</el-menu-item>
      <el-menu-item index="/order/feedback">反馈表管理</el-menu-item>
      <el-menu-item index="/order/insert">入库单管理</el-menu-item>
      <el-menu-item index="/order/scrap">报废单管理</el-menu-item>
      <el-menu-item index="/order/statistics">数据统计</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { HomeFilled, UserFilled, Cpu, List, Calendar, Message } from '@element-plus/icons-vue';
const route = useRoute();
const active = computed(() => route.path);
const userType = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.type;
  } catch {
    return null;
  }
});
</script>

<style scoped>
.el-menu {
  border-right: none;
  min-height: 100vh;
}
.sidebar-submenu {
  min-width: 180px;
}
</style>
