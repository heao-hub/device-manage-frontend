<template>
  <div class="borrow-return">
    <el-card class="header-card">
      <div class="page-header">
        <h2 class="page-title">设备归还</h2>
        <el-alert 
          title="请选择需要归还的设备" 
          type="info" 
          show-icon 
          :closable="false"
          style="margin-bottom: 0;"
        />
      </div>
    </el-card>
    
    <el-card class="table-card">
      <el-table 
        :data="devices" 
        border 
        stripe 
        style="width:100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="borrowCode" label="借条编号" />
        <el-table-column prop="deviceCode" label="设备编号" width="150" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="borrowTime" label="借用时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button 
              size="small" 
              type="success" 
              @click="returnDev(row)"
              icon="Check"
              style="width: 100%; text-align: center;"
            >归还</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page.page"
          v-model:page-size="page.pageSize"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="fetchDevices"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserDevices, returnDevice } from '../../api/borrow';

// 引入图标
import { Check } from '@element-plus/icons-vue';

const devices = ref([]);
const loading = ref(false);
const page = reactive({ page: 1, pageSize: 10, total: 0 });

const fetchDevices = async () => {
  loading.value = true;
  try {
    const params = {
      userId: getUserId(),
      returnStatus: 1,
      page: page.page,
      pageSize: page.pageSize,
    };
    const res = await getUserDevices(params);
    if (res.data && res.data.code === 1) {
      devices.value = res.data.data.records;
      page.total = res.data.data.total;
    }
  } catch (error) {
    ElMessage.error('获取设备列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (val) => {
  page.pageSize = val;
  fetchDevices();
};

onMounted(fetchDevices);

function getUserId() {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.id;
  } catch {
    return null;
  }
}

function returnDev(row) {
  ElMessageBox.confirm('确定归还该设备？', '提示', { type: 'warning' })
    .then(async () => {
      const res = await returnDevice({ userId: getUserId(), borrowId: row.borrowId, deviceId: row.deviceId });
      if (res.data && res.data.code === 1) {
        ElMessage.success('归还成功');
        fetchDevices();
      }
    });
}
</script>

<style scoped>
.borrow-return {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.page-header {
  padding: 20px 0;
}

.page-title {
  margin: 0 0 15px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .borrow-return {
    padding: 15px;
  }
}
</style>
