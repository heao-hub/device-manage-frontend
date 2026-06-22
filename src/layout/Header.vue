<template>
  <div class="header-bar">
    <div class="title">设备预约管理系统</div>
    <div class="user-info">
      <el-dropdown>
        <span class="el-dropdown-link">
          {{ userInfo?.username || '未登录' }}<el-icon><arrow-down /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ArrowDown } from '@element-plus/icons-vue';
import { computed } from 'vue';
const userInfo = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user_info'));
  } catch {
    return null;
  }
});
const router = useRouter();
function logout() {
  localStorage.removeItem('app_token');
  localStorage.removeItem('user_info');
  router.replace('/login');
}
</script>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 32px;
  background: #2d8cf0;
  color: #fff;
}
.title {
  font-size: 22px;
  font-weight: bold;
}
.user-info {
  font-size: 16px;
}
</style>
