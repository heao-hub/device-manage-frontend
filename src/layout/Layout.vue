<template>
  <el-container style="height:100vh">
    <el-header height="60px"><AppHeader /></el-header>
    <el-container>
      <el-aside width="200px"><Sidebar /></el-aside>
      <el-main style="background:#f5f6fa;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import AppHeader from './Header.vue';
import Sidebar from './Sidebar.vue';

export default {
  name: 'Layout',
  components: { AppHeader, Sidebar },
};
</script>

<style scoped>
.el-header {
  background: #2d8cf0;
  color: #fff;
  padding: 0;
}
</style>
