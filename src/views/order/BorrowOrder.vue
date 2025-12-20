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
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="借条编号" />
        <el-table-column prop="username" label="申请人" />
        <el-table-column prop="status" label="状态" :formatter="statusFmt" />
        <el-table-column prop="createTime" label="申请时间" />
        <el-table-column prop="handleTime" label="审批时间" />
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
    <el-dialog title="借条详情与审批" v-model="dialogVisible" width="500px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="借条编号">{{detail.code}}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{detail.username}}</el-descriptions-item>
        <el-descriptions-item label="借用说明">{{detail.description}}</el-descriptions-item>
        <el-descriptions-item label="状态">{{statusFmt(detail)}}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{detail.createTime}}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{detail.handleTime}}</el-descriptions-item>
      </el-descriptions>
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

// 审批弹窗
const dialogVisible = ref(false);
const detail = ref({});
function openDetail(row) {
  detail.value = { ...row };
  dialogVisible.value = true;
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
