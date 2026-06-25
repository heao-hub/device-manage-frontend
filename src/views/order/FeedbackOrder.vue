<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <el-select v-model="searchForm.status" placeholder="处理状态" clearable style="width:150px">
          <el-option label="未处理" :value="1" />
          <el-option label="已处理" :value="2" />
          <el-option label="维修" :value="3" />
          <el-option label="报废" :value="4" />
        </el-select>
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
        <el-button type="primary" @click="fetchOrders">查询</el-button>
      </div>
      <el-table :data="orders" border stripe style="width:100%">
        <el-table-column prop="code" label="编号" width="160" />
        <el-table-column prop="deviceCode" label="设备编号" width="160" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="deviceProblem" label="问题描述" />
        <el-table-column prop="status" label="状态">
          <template #default="{row}">
            <el-tag :type="getStatusTagType(row.status)">{{ statusFmt(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="反馈时间" />
        <el-table-column prop="handleTime" label="处理时间" />
        <el-table-column label="操作" width="120">
          <template #default="{row}">
            <el-button size="small" @click="openHandle(row)" v-if="row.status===1">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.page"
        v-model:page-size="page.pageSize"
        :total="page.total"
        layout="total, prev, pager, next, jumper"
        @current-change="fetchOrders"
        @size-change="fetchOrders"
        style="margin-top:16px;text-align:right;"
      />
    </el-card>

    <!-- 处理弹窗 -->
    <el-dialog title="处理反馈" v-model="dialogVisible" width="400px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="设备编号">{{detail.deviceCode}}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{detail.deviceName}}</el-descriptions-item>
        <el-descriptions-item label="型号">{{detail.deviceModel}}</el-descriptions-item>
        <el-descriptions-item label="问题">{{detail.deviceProblem}}</el-descriptions-item>
        <el-descriptions-item label="反馈人">{{detail.userName}}</el-descriptions-item>
      </el-descriptions>
      <el-radio-group v-model="handleStatus" style="margin:16px 0">
        <el-radio :value="2">已处理</el-radio>
        <el-radio :value="3">维修</el-radio>
        <el-radio :value="4">报废</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getFeedbackOrderPage, handleFeedbackOrder } from '../../api/order';

const orders = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ status: null, timeRange: [] });

const fetchOrders = async () => {
  const params = {
    page: page.page,
    pageSize: page.pageSize,
    status: searchForm.status,
    beginTime: searchForm.timeRange?.[0] || '',
    endTime: searchForm.timeRange?.[1] || '',
  };
  const res = await getFeedbackOrderPage(params);
  if (res.data && res.data.code === 1) {
    orders.value = res.data.data.records;
    page.total = res.data.data.total;
  }
};
onMounted(fetchOrders);

function statusFmt(row) {
  switch (row.status) {
    case 1: return '未处理';
    case 2: return '已处理';
    case 3: return '维修';
    case 4: return '报废';
    default: return '-';
  }
}

function getStatusTagType(status) {
  switch (status) {
    case 1: return 'warning';
    case 2: return 'success';
    case 3: return 'info';   
    case 4: return 'danger'; 
    default: return 'info';  
  }
}

const dialogVisible = ref(false);
const detail = ref({});
const handleStatus = ref(2);
function openHandle(row) {
  detail.value = { ...row };
  handleStatus.value = 2;
  dialogVisible.value = true;
}
async function submitHandle() {
  const res = await handleFeedbackOrder({ id: detail.value.id, deviceId: detail.value.deviceId, status: handleStatus.value, adminId: getAdminId() });
  if (res.data && res.data.code === 1) {
    ElMessage.success('处理成功');
    dialogVisible.value = false;
    fetchOrders();
  }
}
function getAdminId() {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.id;
  } catch {
    return null;
  }
}
</script>
