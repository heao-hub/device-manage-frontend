<template>
  <div class="reservation-order">
    <el-card>
      <div class="order-header">
        <h3 class="order-title">预约单管理</h3>
        <div class="order-filters">
          <el-select v-model="searchForm.status" placeholder="预约状态" clearable style="width:140px">
            <el-option label="待审核" :value="1" />
            <el-option label="已通过" :value="2" />
            <el-option label="已拒绝" :value="3" />
            <el-option label="已完成" :value="4" />
            <el-option label="已取消" :value="5" />
            <el-option label="超时失效" :value="6" />
          </el-select>
          <el-date-picker v-model="searchForm.timeRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss" style="width:280px" />
          <el-button type="primary" @click="fetchOrders">查询</el-button>
        </div>
      </div>
      <el-table :data="orders" border stripe style="width:100%" @row-dblclick="openDetail">
        <el-table-column prop="code" label="预约单号" width="170" />
        <el-table-column prop="userName" label="预约人" />
        <el-table-column prop="userDeptName" label="所属单位" />
        <el-table-column label="预约时段" width="230">
          <template #default="{row}">
            <span>{{ formatDateTime(row.startTime) }}</span>
            <span v-if="row.endTime" style="margin-left:6px;color:#909399;font-size:12px;">至 {{ formatDateTime(row.endTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{row}">
            <el-tag :type="getStatusTagType(row.status)" effect="light">{{ statusFmt(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="170" />
        <el-table-column prop="handleTime" label="审批时间" width="170">
          <template #default="{row}">{{ row.handleTime || '-' }}</template>
        </el-table-column>
        <el-table-column prop="adminName" label="审批人" />
        <el-table-column label="操作" width="120">
          <template #default="{row}">
            <el-button size="small" @click="openDetail(row)">审批</el-button>
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

    <!-- 审批弹窗 -->
    <el-dialog title="预约单详情与审批" v-model="dialogVisible" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预约单号">{{detail.code}}</el-descriptions-item>
        <el-descriptions-item label="预约人">{{detail.userName}}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{detail.userDeptName || '-'}}</el-descriptions-item>
        <el-descriptions-item label="预约说明">{{detail.description || '-'}}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{formatDateTime(detail.startTime)}}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{formatDateTime(detail.endTime)}}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(detail.status)" effect="light">{{statusFmt(detail)}}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{detail.createTime}}</el-descriptions-item>
        <el-descriptions-item label="审批时间" :span="2">{{detail.handleTime || '-'}}</el-descriptions-item>
      </el-descriptions>
      
      <el-card style="margin-top: 20px;" v-if="reservationDevices.length > 0">
        <template #header>
          <span>预约设备列表</span>
        </template>
        <el-table :data="reservationDevices" border stripe>
          <el-table-column prop="deviceCode" label="设备编号" />
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="deviceModel" label="设备型号" />
          <el-table-column prop="deviceDeptName" label="所属单位" />
        </el-table>
      </el-card>
      
      <div v-else style="margin-top: 20px; text-align: center; color: #909399;">
        暂无设备信息
      </div>
      
      <div v-if="detail.status === 1" style="margin-top:16px;text-align:right">
        <el-button type="success" @click="handleOrder(2)">通过</el-button>
        <el-button type="danger" @click="handleOrder(3)">拒绝</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getAdminReservationPage, handleReservation, getReservationDevices } from '../../api/reservation';

const orders = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ status: null, timeRange: [] });
const reservationDevices = ref([]);

// 预约状态常量（严格按接口文档）
// 1-待审核 2-已通过 3-已拒绝 4-已完成 5-已取消 6-超时失效
function statusFmt(row) {
  switch (row.status) {
    case 1: return '待审核';
    case 2: return '已通过';
    case 3: return '已拒绝';
    case 4: return '已完成';
    case 5: return '已取消';
    case 6: return '超时失效';
    default: return '-';
  }
}

function getStatusTagType(status) {
  switch (status) {
    case 1: return 'warning';  // 待审核 - 橙色
    case 2: return 'success';  // 已通过 - 绿色
    case 3: return 'danger';   // 已拒绝 - 红色
    case 4: return 'info';     // 已完成 - 灰色
    case 5: return 'info';     // 已取消 - 灰色
    case 6: return 'danger';   // 超时失效 - 红色
    default: return 'info';
  }
}

// 格式化 ISO 时间为可读格式
function formatDateTime(isoStr) {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${Y}-${M}-${D} ${h}:${m}`;
  } catch {
    return isoStr;
  }
}

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const fetchOrders = async () => {
  const params = {
    page: page.page,
    pageSize: page.pageSize,
  };
  if (searchForm.status !== null && searchForm.status !== undefined) {
    params.status = searchForm.status;
  }
  if (searchForm.timeRange?.[0]) {
    params.beginTime = searchForm.timeRange[0];
  }
  if (searchForm.timeRange?.[1]) {
    params.endTime = searchForm.timeRange[1];
  }
  const res = await getAdminReservationPage(params);
  if (res.data && res.data.code === 1) {
    orders.value = res.data.data.records;
    page.total = res.data.data.total;
  }
};
onMounted(fetchOrders);

// 审批弹窗
const dialogVisible = ref(false);
const detail = ref({});
async function openDetail(row) {
  detail.value = { ...row };
  
  // 获取预约单关联的设备信息
  try {
    const res = await getReservationDevices(row.id);
    if (res.data && res.data.code === 1) {
      reservationDevices.value = res.data.data?.records || [];
    } else {
      reservationDevices.value = [];
    }
  } catch (error) {
    ElMessage.error('获取设备信息失败');
    reservationDevices.value = [];
  }
  
  dialogVisible.value = true;
}

// 管理员审批（调用 PUT /admin/orders/reservation/handle/{id}?status={status}）
async function handleOrder(status) {
  try {
    const res = await handleReservation(detail.value.id, status);
    if (res.data && res.data.code === 1) {
      ElMessage.success(status === 2 ? '已通过' : '已拒绝');
      dialogVisible.value = false;
      fetchOrders();
    } else {
      ElMessage.error(res.data?.msg || '操作失败');
    }
  } catch (error) {
    ElMessage.error('操作失败');
  }
}
</script>

<style scoped>
.reservation-order {
  padding: 0;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.order-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.order-filters {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
