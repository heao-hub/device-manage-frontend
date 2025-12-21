<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <el-select v-model="searchForm.status" placeholder="申请状态" clearable style="width:150px">
          <el-option label="待审批" :value="1" />
          <el-option label="通过" :value="2" />
          <el-option label="不通过" :value="3" />
        </el-select>
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
        <el-button type="primary" @click="fetchOrders">查询</el-button>
      </div>
      <el-table :data="orders" border stripe style="width:100%" @row-dblclick="openDetail">
        <el-table-column prop="id" label="ID" width="120" />
        <el-table-column prop="code" label="借条编号" />
        <el-table-column prop="userName" label="申请人" />
        <el-table-column prop="status" label="状态">
          <template #default="{row}">
            <el-tag :type="getStatusTagType(row.status)">{{ statusFmt(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" />
        <el-table-column prop="handleTime" label="审批时间" />
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
    <el-dialog title="借条详情与审批" v-model="dialogVisible" width="700px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="借条编号">{{detail.code}}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{detail.userName}}</el-descriptions-item>
        <el-descriptions-item label="借用说明">{{detail.description}}</el-descriptions-item>
        <el-descriptions-item label="状态">{{statusFmt(detail)}}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{detail.createTime}}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{detail.handleTime}}</el-descriptions-item>
      </el-descriptions>
      
      <el-card style="margin-top: 20px;" v-if="borrowDevices.length > 0">
        <template #header>
          <span>借用设备列表</span>
        </template>
        <el-table :data="borrowDevices" border stripe>
          <el-table-column prop="code" label="设备编号" />
          <el-table-column prop="deviceName" label="设备名称" />
        </el-table>
      </el-card>
      
      <div v-else style="margin-top: 20px; text-align: center; color: #909399;">
        暂无设备信息
      </div>
      
      <div v-if="detail.status === 1" style="margin-top:16px;text-align:right">
        <el-button type="success" @click="handleOrder(2)">通过</el-button>
        <el-button type="danger" @click="handleOrder(3)">不通过</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getBorrowOrderPage, handleBorrowOrder } from '../../api/order';
import { getBorrowOrderDevices } from '../../api/borrow';

const orders = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ status: null, timeRange: [] });
const borrowDevices = ref([]);

const fetchOrders = async () => {
  const params = {
    page: page.page,
    pageSize: page.pageSize,
    status: searchForm.status,
    beginTime: searchForm.timeRange?.[0] || '',
    endTime: searchForm.timeRange?.[1] || '',
  };
  const res = await getBorrowOrderPage(params);
  if (res.data && res.data.code === 1) {
    orders.value = res.data.data.records;
    page.total = res.data.data.total;
  }
};
onMounted(fetchOrders);

function statusFmt(row) {
  switch (row.status) {
    case 1: return '待审批';
    case 2: return '通过';
    case 3: return '不通过';
    default: return '-';
  }
}

function getStatusTagType(status) {
  switch (status) {
    case 1: return 'warning'; // 待审批 - 橙色
    case 2: return 'success'; // 通过 - 绿色
    case 3: return 'danger';  // 不通过 - 红色
    default: return 'info';   // 默认 - 灰色
  }
}

// 审批弹窗
const dialogVisible = ref(false);
const detail = ref({});
async function openDetail(row) {
  console.log('打开详情，行数据:', row);
  detail.value = { ...row };
  
  // 获取借条下的设备信息
  try {
    const res = await getBorrowOrderDevices(row.id);
    console.log('设备API响应:', res);
    if (res.data && res.data.code === 1) {
      // API返回的是分页数据结构 {total: x, records: [...]}
      borrowDevices.value = res.data.data?.records || [];
      console.log('设置设备数据:', borrowDevices.value);
    } else {
      console.log('API返回错误:', res.data?.msg);
      borrowDevices.value = [];
    }
  } catch (error) {
    console.error('获取设备信息异常:', error);
    ElMessage.error('获取设备信息失败');
    borrowDevices.value = [];
  }
  
  dialogVisible.value = true;
  console.log('弹窗已打开');
}
async function handleOrder(status) {
  const res = await handleBorrowOrder({ id: detail.value.id, status, adminId: getAdminId() });
  if (res.data && res.data.code === 1) {
    ElMessage.success('操作成功');
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
