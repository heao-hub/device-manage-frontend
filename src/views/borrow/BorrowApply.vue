<template>
  <div class="reservation-apply">
    <el-card class="search-card">
      <div class="search-header">
        <h2 class="page-title">预约申请记录</h2>
        <el-button type="success" @click="openReserve" icon="Plus">预约设备</el-button>
      </div>
      
      <div class="search-form">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select 
              v-model="searchForm.status" 
              placeholder="预约状态" 
              clearable 
              filterable
              style="width: 100%;"
            >
              <el-option label="待审核" :value="1" />
              <el-option label="已通过" :value="2" />
              <el-option label="已拒绝" :value="3" />
              <el-option label="已完成" :value="4" />
              <el-option label="已取消" :value="5" />
              <el-option label="超时失效" :value="6" />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-date-picker 
              v-model="searchForm.timeRange" 
              type="datetimerange" 
              range-separator="至" 
              start-placeholder="开始时间" 
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%;"
            />
          </el-col>
          <el-col :span="6">
            <div class="search-buttons">
              <el-button type="primary" @click="fetchOrders" icon="Search">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <el-card class="table-card">
      <el-table 
        :data="orders" 
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
            <span class="time-slot-text">
              {{ formatDateTime(row.startTime) }}
            </span>
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
        <el-table-column prop="handleTime" label="审批时间" width="170" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{row}">
            <div class="row-actions">
              <el-button size="small" @click="viewDetail(row)" type="primary" link>详情</el-button>
              <el-button 
                v-if="row.status === 1"
                size="small" 
                type="danger" 
                link
                @click="doCancel(row)"
              >取消</el-button>
            </div>
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
          @current-change="fetchOrders"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </el-card>

    <!-- 预约设备弹窗 -->
    <el-dialog 
      title="预约设备" 
      v-model="dialogVisible" 
      width="720px"
      :before-close="handleDialogClose"
      destroy-on-close
    >
      <el-form 
        :model="form" 
        label-width="100px" 
        ref="formRef"
        :rules="formRules"
        @submit.prevent="submitForm"
      >
        <el-form-item label="预约说明" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请简要说明预约用途"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="预约日期" prop="reserveDate" required>
          <el-date-picker
            v-model="form.reserveDate"
            type="date"
            placeholder="选择预约日期"
            :disabled-date="disablePastDate"
            style="width: 100%;"
            @change="onDateChange"
          />
        </el-form-item>

        <el-form-item label="预约时段" prop="timeSlot" required>
          <div class="time-slot-picker">
            <div 
              v-for="slot in timeSlots" 
              :key="slot.value"
              class="slot-item"
              :class="{ 
                'slot-selected': form.timeSlot === slot.value, 
                'slot-disabled': slot.disabled 
              }"
              @click="selectSlot(slot)"
            >
              <div class="slot-time">{{ slot.label }}</div>
              <div class="slot-status" v-if="slot.disabled">
                <el-tag size="small" type="danger" effect="plain">已占用</el-tag>
              </div>
              <div class="slot-status" v-else-if="form.timeSlot === slot.value">
                <el-tag size="small" type="success" effect="plain">已选</el-tag>
              </div>
              <div class="slot-status" v-else>
                <el-tag size="small" type="success" effect="plain">可预约</el-tag>
              </div>
            </div>
          </div>
          <div class="slot-hint" v-if="!form.reserveDate">
            <el-text type="info" size="small">请先选择预约日期，再选择时间段</el-text>
          </div>
          <div class="slot-hint" v-else-if="timeSlots.length === 0">
            <el-text type="warning" size="small">暂无可用时间段</el-text>
          </div>
        </el-form-item>
        
        <el-form-item label="选择设备" required>
          <div class="device-selection">
            <el-button 
              type="primary" 
              @click="openDeviceSelect" 
              icon="Plus"
            >添加设备</el-button>
            
            <div class="selected-devices" v-if="form.devices.length">
              <div class="devices-header">
                <span>已选择 {{ form.devices.length }} 台设备：</span>
              </div>
              <div class="devices-list">
                <el-tag 
                  v-for="d in form.devices" 
                  :key="d.id" 
                  closable 
                  @close="removeDevice(d)" 
                  class="device-tag"
                >
                  {{ d.deviceName }} - {{ d.deviceModel }}
                </el-tag>
              </div>
            </div>
            
            <div class="no-devices" v-else>
              <el-alert 
                title="请至少添加一台设备" 
                type="info" 
                show-icon 
                :closable="false"
              />
            </div>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible=false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="submitLoading"
            :disabled="!form.devices.length || !form.timeSlot"
          >{{ submitLoading ? '提交中...' : '确定预约' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 设备选择弹窗 -->
    <el-dialog 
      title="选择设备" 
      v-model="deviceDialog" 
      width="800px"
      :before-close="handleDeviceDialogClose"
    >
      <div class="device-search">
        <el-input 
          v-model="deviceSearch" 
          placeholder="请输入设备名称" 
          clearable 
          prefix-icon="Search"
          style="width: 300px; margin-bottom: 15px;"
          @input="fetchDevices"
          @keyup.enter="fetchDevices"
        />
      </div>
      
      <el-table 
        :data="deviceList" 
        border 
        height="400"
        v-loading="deviceLoading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="code" label="设备编号" width="150" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="manufacturer" label="厂商" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button 
              size="small" 
              type="primary" 
              link
              @click="addDevice(row)"
              :disabled="isDeviceSelected(row.id)"
            >
              {{ isDeviceSelected(row.id) ? '已添加' : '添加' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="devicePage.page"
          v-model:page-size="devicePage.pageSize"
          :total="devicePage.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[8, 16, 32]"
          @current-change="fetchDevices"
          @size-change="handleDevicePageSizeChange"
          background
        />
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deviceDialog=false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
    
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
import { applyReservation, getMyReservations, getReservationDevices, cancelReservation } from '../../api/reservation';
import { getDevicePage } from '../../api/device';

import { Plus, Search } from '@element-plus/icons-vue';

const orders = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const deviceLoading = ref(false);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ status: null, timeRange: [] });

// 详情弹窗相关
const detailDialogVisible = ref(false);
const detailData = ref({});
const detailDevices = ref([]);

// 时间段选项
const TIME_SLOT_LIST = [
  { value: '1', label: '08:00 - 10:00', start: '08:00', end: '10:00' },
  { value: '2', label: '10:00 - 12:00', start: '10:00', end: '12:00' },
  { value: '3', label: '13:00 - 15:00', start: '13:00', end: '15:00' },
  { value: '4', label: '15:00 - 17:00', start: '15:00', end: '17:00' },
  { value: '5', label: '17:00 - 19:00', start: '17:00', end: '19:00' },
  { value: '6', label: '19:00 - 21:00', start: '19:00', end: '21:00' },
];
const timeSlots = ref([]);

// 预约状态常量
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
    case 1: return 'warning';  
    case 2: return 'success';  
    case 3: return 'danger'; 
    case 4: return 'info';     
    case 5: return 'info';   
    case 6: return 'danger'; 
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

const fetchOrders = async () => {
  loading.value = true;
  try {
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
    const res = await getMyReservations(params);
    if (res.data && res.data.code === 1) {
      orders.value = res.data.data.records;
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
  fetchOrders();
};

const resetSearch = () => {
  searchForm.status = null;
  searchForm.timeRange = [];
  page.page = 1;
  fetchOrders();
};

onMounted(fetchOrders);

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

// 取消预约
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
        fetchOrders();
      } else {
        ElMessage.error(res.data?.msg || '取消失败');
      }
    } catch (error) {
      ElMessage.error('取消失败');
    }
  }).catch(() => {});
}

function formatDate(date) {
  if (!date) return null;
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
const dialogVisible = ref(false);
const form = reactive({ 
  description: '', 
  devices: [], 
  reserveDate: null,
  timeSlot: null,
  startTime: '',
  endTime: ''
});
const formRef = ref();
const formRules = {};

function openReserve() {
  form.description = '';
  form.devices = [];
  form.reserveDate = null;
  form.timeSlot = null;
  form.startTime = '';
  form.endTime = '';
  timeSlots.value = [];
  dialogVisible.value = true;
}

const handleDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭对话框吗？未保存的数据将会丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    done();
  }).catch(() => {});
};

function onDateChange() {
  form.timeSlot = null;
  form.startTime = '';
  form.endTime = '';
  
  // 判断选择的日期是否是今天
  const selectedDate = form.reserveDate ? new Date(form.reserveDate) : null;
  const today = new Date();
  const isToday = selectedDate && 
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate();

  const currentHours = today.getHours();
  const currentMinutes = today.getMinutes();
  const currentTimeValue = currentHours * 60 + currentMinutes;
  
  timeSlots.value = TIME_SLOT_LIST.map(slot => {
    let disabled = false;
    
    if (isToday) {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const slotStartValue = startHour * 60 + startMin;

      if (slotStartValue <= currentTimeValue) {
        disabled = true;
      }
    }
    
    return { ...slot, disabled };
  });
}

function selectSlot(slot) {
  if (slot.disabled) return;
  form.timeSlot = slot.value;
  form.startTime = slot.start;
  form.endTime = slot.end;
}

// 禁止选过去日期
function disablePastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime();
}

const handleDeviceDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭设备选择对话框吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    done();
  }).catch(() => {});
};

function removeDevice(d) {
  form.devices = form.devices.filter(item => item.id !== d.id);
}

// 提交预约申请
async function submitForm() {
  if (!form.devices.length) return ElMessage.warning('请选择设备');
  if (!form.reserveDate) return ElMessage.warning('请选择预约日期');
  if (!form.timeSlot) return ElMessage.warning('请选择预约时段');
  
  submitLoading.value = true;
  try {
    const dateStr = formatDate(form.reserveDate);
    const startTime = `${dateStr} ${form.startTime}:00`;
    const endTime = `${dateStr} ${form.endTime}:00`;

    const data = {
      description: form.description,
      startTime,
      endTime,
      deviceIds: form.devices.map(d => d.id),
    };
    const res = await applyReservation(data);
    if (res.data && res.data.code === 1) {
      ElMessage.success('预约申请成功');
      dialogVisible.value = false;
      fetchOrders();
    } else {
      ElMessage.error(res.data?.msg || '申请失败');
    }
  } catch (error) {
    ElMessage.error(error?.response?.data?.msg || '申请失败');
  } finally {
    submitLoading.value = false;
  }
}
const deviceDialog = ref(false);
const deviceList = ref([]);
const devicePage = reactive({ page: 1, pageSize: 8, total: 0 });
const deviceSearch = ref('');

function openDeviceSelect() {
  deviceDialog.value = true;
  fetchDevices();
}

const handleDevicePageSizeChange = (val) => {
  devicePage.pageSize = val;
  fetchDevices();
};

const fetchDevices = async () => {
  deviceLoading.value = true;
  try {
    const params = {
      page: devicePage.page,
      pageSize: devicePage.pageSize,
      deviceName: deviceSearch.value,
      deviceStatus: 1, // 只显示正常可用的设备
    };
    const res = await getDevicePage(params);
    if (res.data && res.data.code === 1) {
      deviceList.value = res.data.data.records;
      devicePage.total = res.data.data.total;
    }
  } catch (error) {
    ElMessage.error('获取设备列表失败');
  } finally {
    deviceLoading.value = false;
  }
};

function isDeviceSelected(deviceId) {
  return form.devices.some(d => d.id === deviceId);
}

function addDevice(row) {
  if (!form.devices.find(d => d.id === row.id)) {
    form.devices.push(row);
    ElMessage.success(`已添加 ${row.deviceName}`);
  } else {
    ElMessage.warning(`${row.deviceName} 已添加`);
  }
}
</script>

<style scoped>
.reservation-apply {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.search-form {
  padding: 16px 0 4px 0;
}

.search-buttons {
  display: flex;
  gap: 10px;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.row-actions {
  display: flex;
  gap: 8px;
}

.time-slot-text {
  font-size: 13px;
  color: #606266;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.time-slot-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
  margin-bottom: 4px;
}

.slot-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  border: 1.5px solid #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
  gap: 6px;
}

.slot-item:hover:not(.slot-disabled) {
  border-color: #409eff;
  background: #f0f7ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.slot-selected {
  border-color: #409eff !important;
  background: #ecf5ff !important;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.slot-disabled {
  border-color: #f56c6c;
  background: #fef0f0;
  cursor: not-allowed;
  opacity: 0.75;
}

.slot-time {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.slot-disabled .slot-time {
  color: #f56c6c;
  text-decoration: line-through;
}

.slot-status {
  line-height: 1;
}

.slot-hint {
  margin-top: 6px;
}
.device-selection {
  width: 100%;
}

.selected-devices {
  margin-top: 15px;
}

.devices-header {
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.devices-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.device-tag {
  margin: 0;
}

.no-devices {
  margin-top: 15px;
}

.device-search {
  display: flex;
  justify-content: flex-start;
}


@media (max-width: 768px) {
  .reservation-apply {
    padding: 15px;
  }
  
  .search-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .search-form .el-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-form .el-col {
    width: 100%;
  }
  
  .search-buttons {
    justify-content: flex-end;
  }

  .time-slot-picker {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
