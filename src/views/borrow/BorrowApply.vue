<template>
  <div class="borrow-apply">
    <el-card class="search-card">
      <div class="search-header">
        <h2 class="page-title">借用申请记录</h2>
        <el-button type="success" @click="openBorrow" icon="Plus" style="text-align: center;">借用设备</el-button>
      </div>
      
      <div class="search-form">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select 
              v-model="searchForm.status" 
              placeholder="请选择申请状态" 
              clearable 
              filterable
            >
              <el-option label="待审核" :value="1" />
              <el-option label="审核通过" :value="2" />
              <el-option label="审核不通过" :value="3" />
            </el-select>
          </el-col>
          <el-col :span="12">
            <el-date-picker 
              v-model="searchForm.timeRange" 
              type="daterange" 
              range-separator="至" 
              start-placeholder="开始日期" 
              end-placeholder="结束日期" 
              style="width: 100%;"
            />
          </el-col>
          <el-col :span="6">
            <div class="search-buttons">
              <el-button type="primary" @click="fetchOrders" icon="Search" style="text-align: center;">查询</el-button>
              <el-button @click="resetSearch" style="text-align: center;">重置</el-button>
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
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="code" label="借条编号" width="150" />
        <el-table-column prop="description" label="借用说明" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{row}">
            <el-tag :type="getStatusTagType(row.status)">{{ statusFmt(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="180" />
        <el-table-column prop="handleTime" label="审批时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{row}">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
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

    <!-- 借用设备弹窗 -->
    <el-dialog 
      title="借用设备" 
      v-model="dialogVisible" 
      width="700px"
      :before-close="handleDialogClose"
    >
      <el-form 
        :model="form" 
        label-width="100px" 
        ref="formRef"
        @submit.prevent="submitForm"
      >
        <el-form-item label="借用说明" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入借用说明"
            maxlength="200"
            show-word-limit
          />
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
            :disabled="!form.devices.length"
          >{{ submitLoading ? '提交中...' : '确定申请' }}</el-button>
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
      title="借条详情" 
      v-model="detailDialogVisible" 
      width="600px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="借条编号">{{detailData.code}}</el-descriptions-item>
        <el-descriptions-item label="借用说明">{{detailData.description}}</el-descriptions-item>
        <el-descriptions-item label="状态">{{statusFmt(detailData)}}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{detailData.createTime}}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{detailData.handleTime}}</el-descriptions-item>
      </el-descriptions>
      
      <el-card style="margin-top: 20px;" v-if="detailDevices.length > 0">
        <template #header>
          <span>借用设备列表</span>
        </template>
        <el-table :data="detailDevices" border stripe>
          <el-table-column prop="code" label="设备编号" />
          <el-table-column prop="deviceName" label="设备名称" />
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
import { getUserBorrowOrders, borrowDevices, getBorrowOrderDevices } from '../../api/borrow';
import { getDevicePage } from '../../api/device';

// 引入图标
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

const fetchOrders = async () => {
  loading.value = true;
  try {
    // 构建参数对象，只包含非空值的参数
    const params = {};
    params.page = page.page;
    params.pageSize = page.pageSize;
    params.userId = getUserId();
    
    if (searchForm.status !== null && searchForm.status !== undefined) {
      params.status = searchForm.status;
    }
    
    if (searchForm.timeRange?.[0]) {
      // 传递日期格式 yyyy-MM-dd，确保不是ISO格式
      params.beginTime = formatDate(searchForm.timeRange[0]);
    }
    
    if (searchForm.timeRange?.[1]) {
      // 传递日期格式 yyyy-MM-dd，确保不是ISO格式
      params.endTime = formatDate(searchForm.timeRange[1]);
    }
    const res = await getUserBorrowOrders(params);
    if (res.data && res.data.code === 1) {
      orders.value = res.data.data.records;
      page.total = res.data.data.total;
    }
  } catch (error) {
    ElMessage.error('获取申请记录失败');
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

function statusFmt(row) {
  switch (row.status) {
    case 1: return '待审核';
    case 2: return '审核通过';
    case 3: return '审核不通过';
    default: return '-';
  }
}

function getStatusTagType(status) {
  switch (status) {
    case 1: return 'warning'; // 待审核 - 橙色
    case 2: return 'success'; // 审核通过 - 绿色
    case 3: return 'danger';  // 审核不通过 - 红色
    default: return 'info';   // 默认 - 灰色
  }
}

// 查看详情
async function viewDetail(row) {
  detailData.value = { ...row };
  
  // 获取借条下的设备信息
  try {
    const res = await getBorrowOrderDevices(row.id);
    if (res.data && res.data.code === 1) {
      // API返回的是分页数据结构 {total: x, records: [...]}
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

function getUserId() {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.id;
  } catch {
    return null;
  }
}

// 格式化日期为 yyyy-MM-dd 格式，避免ISO格式
function formatDate(date) {
  if (!date) return null;
  
  // 如果已经是字符串格式的日期，直接返回
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date;
  }
  
  // 如果是Date对象或其他格式，转换为 yyyy-MM-dd
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 借用设备弹窗
const dialogVisible = ref(false);
const form = reactive({ description: '', devices: [] });
const formRef = ref();
function openBorrow() {
  form.description = '';
  form.devices = [];
  dialogVisible.value = true;
}

const handleDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭对话框吗？未保存的数据将会丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    done();
  }).catch(() => {
    // 取消关闭
  });
};

const handleDeviceDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭设备选择对话框吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    done();
  }).catch(() => {
    // 取消关闭
  });
};
function removeDevice(d) {
  form.devices = form.devices.filter(item => item.id !== d.id);
}
async function submitForm() {
  if (!form.devices.length) return ElMessage.warning('请选择设备');
  
  submitLoading.value = true;
  try {
    const data = {
      userId: getUserId(),
      devices: form.devices.map(d => ({ id: d.id, code: d.code, name: d.deviceName, model: d.deviceModel })),
      status: 1,
      description: form.description,
    };
    const res = await borrowDevices(data);
    if (res.data && res.data.code === 1) {
      ElMessage.success('申请成功');
      dialogVisible.value = false;
      fetchOrders();
    } else {
      ElMessage.error(res.data?.msg || '申请失败');
    }
  } catch (error) {
    ElMessage.error('申请失败');
  } finally {
    submitLoading.value = false;
  }
}

// 设备选择弹窗
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
      deviceStatus: 1,
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
.borrow-apply {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.search-form {
  padding: 20px 0;
}

.search-buttons {
  display: flex;
  gap: 10px;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 借用设备弹窗样式 */
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

/* 设备选择弹窗样式 */
.device-search {
  display: flex;
  justify-content: flex-start;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .borrow-apply {
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
}
</style>
