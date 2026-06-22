<template>
  <div class="my-reservation">
    <el-card class="header-card">
      <div class="page-header">
        <h2 class="page-title">我的预约</h2>
        <div class="header-filters">
          <el-radio-group v-model="activeTab" @change="fetchReservations" size="default">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="pending">待审核</el-radio-button>
            <el-radio-button value="approved">已通过</el-radio-button>
            <el-radio-button value="done">已完成</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>
    
    <el-card class="table-card">
      <!-- 空状态 -->
      <el-empty 
        v-if="!loading && reservations.length === 0"
        description="暂无预约记录"
        :image-size="120"
      >
        <el-button type="primary" @click="$router.push('/borrow/apply')">去预约设备</el-button>
      </el-empty>

      <el-table 
        v-else
        :data="reservations" 
        border 
        stripe 
        style="width:100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="code" label="预约单号" width="170" />
        <el-table-column prop="description" label="预约说明" />
        <el-table-column label="预约时段" width="230">
          <template #default="{row}">
            <div class="time-cell">
              <span class="time-date">{{ formatDateTime(row.startTime) }}</span>
              <span class="time-range" v-if="row.endTime">至 {{ formatDateTime(row.endTime) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="110">
          <template #default="{row}">
            <el-tag :type="getStatusTagType(row.status)" effect="light">
              {{ statusFmt(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="170" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{row}">
            <div class="row-actions">
              <el-button 
                v-if="row.status === 1 || row.status === 2"
                size="small" 
                type="success" 
                link
                @click="doComplete(row)"
              >归还</el-button>
              <el-button 
                v-if="row.status === 1"
                size="small" 
                type="danger" 
                link
                @click="doCancel(row)"
              >取消预约</el-button>
              <el-button 
                size="small" 
                type="primary" 
                link
                @click="viewDetail(row)"
              >详情</el-button>
              <el-tooltip 
                v-if="row.status === 6" 
                content="该预约已因超时自动失效" 
                placement="top"
              >
                <el-icon color="#f56c6c"><WarningFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container" v-if="reservations.length > 0">
        <el-pagination
          v-model:current-page="page.page"
          v-model:page-size="page.pageSize"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          @current-change="fetchReservations"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog 
      title="预约详情" 
      v-model="detailDialogVisible" 
      width="650px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预约单号">{{detailData.code}}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(detailData.status)" effect="light">{{statusFmt(detailData)}}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预约说明" :span="2">{{detailData.description || '-'}}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{formatDateTime(detailData.startTime)}}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{formatDateTime(detailData.endTime)}}</el-descriptions-item>
        <el-descriptions-item label="预约人">{{detailData.userName}}</el-descriptions-item>
        <el-descriptions-item label="所属单位">{{detailData.userDeptName || '-'}}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{detailData.createTime}}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{detailData.handleTime || '-'}}</el-descriptions-item>
        <el-descriptions-item label="审批人" :span="2">{{detailData.adminName || '-'}}</el-descriptions-item>
      </el-descriptions>
      
      <el-card style="margin-top: 20px;" v-if="detailDevices.length > 0">
        <template #header>
          <span>预约设备列表</span>
        </template>
        <el-table :data="detailDevices" border stripe>
          <el-table-column prop="deviceCode" label="设备编号" />
          <el-table-column prop="deviceName" label="设备名称" />
          <el-table-column prop="deviceModel" label="设备型号" />
          <el-table-column prop="deviceDeptName" label="所属单位" />
        </el-table>
      </el-card>
      
      <div v-else style="margin-top: 20px; text-align: center; color: #909399;">
        暂无设备信息
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { WarningFilled } from '@element-plus/icons-vue';
import { getMyReservations, cancelReservation, completeReservation, getReservationDevices } from '../../api/reservation';

const reservations = ref([]);
const loading = ref(false);
const activeTab = ref('all');
const page = reactive({ page: 1, pageSize: 10, total: 0 });

// 详情弹窗
const detailDialogVisible = ref(false);
const detailData = ref({});
const detailDevices = ref([]);

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

const fetchReservations = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.page,
      pageSize: page.pageSize,
    };
    // 按 tab 过滤状态
    if (activeTab.value === 'pending') {
      params.status = 1; // 待审核
    } else if (activeTab.value === 'approved') {
      params.status = 2; // 已通过
    } else if (activeTab.value === 'done') {
      params.status = 4; // 已完成
    }
    // userId 由后端从 JWT 中自动获取，无需前端传递
    const res = await getMyReservations(params);
    if (res.data && res.data.code === 1) {
      reservations.value = res.data.data.records;
      page.total = res.data.data.total;
    }
  } catch (error) {
    ElMessage.error('获取预约记录失败');
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (val) => {
  page.pageSize = val;
  fetchReservations();
};

onMounted(fetchReservations);

// 查看详情
async function viewDetail(row) {
  detailData.value = { ...row };
  
  try {
    const res = await getReservationDevices(row.id);
    if (res.data && res.data.code === 1) {
      detailDevices.value = res.data.data?.records || [];
    } else {
      detailDevices.value = [];
    }
  } catch (error) {
    ElMessage.error('获取设备信息失败');
    detailDevices.value = [];
  }
  
  detailDialogVisible.value = true;
}

// 取消预约（调用 PUT /reservation/cancel/{id}，仅限待审核状态）
function doCancel(row) {
  ElMessageBox.confirm('确定取消该预约申请？', '提示', { 
    type: 'warning',
    confirmButtonText: '确定取消',
    cancelButtonText: '返回'
  }).then(async () => {
    try {
      const res = await cancelReservation(row.id);
      if (res.data && res.data.code === 1) {
        ElMessage.success('预约已取消');
        fetchReservations();
      } else {
        ElMessage.error(res.data?.msg || '取消失败');
      }
    } catch (error) {
      ElMessage.error('取消失败');
    }
  }).catch(() => {});
}

// 归还设备（调用 PUT /reservation/complete/{id}，状态为待审核或已通过时可归还）
function doComplete(row) {
  ElMessageBox.confirm('确定归还该预约的设备？归还后预约状态将变为已完成。', '归还确认', { 
    type: 'warning',
    confirmButtonText: '确定归还',
    cancelButtonText: '返回'
  }).then(async () => {
    try {
      const res = await completeReservation(row.id);
      // 接口成功返回 code: 200
      if (res.data && (res.data.code === 200 || res.data.code === 1)) {
        ElMessage.success('归还成功');
        fetchReservations();
      } else {
        ElMessage.error(res.data?.msg || '归还失败');
      }
    } catch (error) {
      ElMessage.error(error?.response?.data?.msg || '归还失败');
    }
  }).catch(() => {});
}
</script>

<style scoped>
.my-reservation {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.header-filters {
  display: flex;
  align-items: center;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  padding: 4px 0;
}

.time-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.time-date {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

.time-range {
  font-size: 12px;
  color: #909399;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .my-reservation {
    padding: 15px;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
