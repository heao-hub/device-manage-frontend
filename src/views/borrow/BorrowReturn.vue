<template>
  <div>
    <el-card>
      <el-table :data="devices" border stripe style="width:100%">
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="borrowTime" label="借用时间" />
        <el-table-column label="操作" width="120">
          <template #default="{row}">
            <el-button size="small" type="success" @click="returnDev(row)">归还</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.page"
        v-model:page-size="page.pageSize"
        :total="page.total"
        layout="total, prev, pager, next, jumper"
        @current-change="fetchDevices"
        @size-change="fetchDevices"
        style="margin-top:16px;text-align:right;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserDevices, returnDevice } from '../../api/borrow';

const devices = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });

const fetchDevices = async () => {
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
