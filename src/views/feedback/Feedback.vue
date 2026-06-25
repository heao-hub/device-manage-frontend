<template>
  <div class="feedback-management">
    <el-card class="search-card">
      <div class="search-header">
        <h2 class="page-title">设备反馈</h2>
        <el-button type="success" @click="openFeedback" icon="Plus">设备问题反馈</el-button>
      </div>
      
      <div class="search-form">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select 
              v-model="searchForm.status" 
              placeholder="请选择反馈状态" 
              clearable 
              filterable
              style="width: 100%;"
            >
              <el-option label="未处理" :value="1" />
              <el-option label="已处理" :value="2" />
              <el-option label="维修" :value="3" />
              <el-option label="报废" :value="4" />
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
              <el-button type="primary" @click="fetchFeedbacks" icon="Search">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <el-card class="table-card">
      <el-table 
        :data="feedbacks" 
        border 
        stripe 
        style="width:100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="code" label="反馈单编号" width="160" />
        <el-table-column prop="deviceCode" label="设备编号" width="160" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="deviceProblem" label="问题描述" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{row}">
            <el-tag :type="getStatusTagType(row.status)">{{ statusFmt(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="反馈时间" width="180" />
        <el-table-column prop="handleTime" label="处理时间" width="180" />
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="page.page"
          v-model:page-size="page.pageSize"
          :total="page.total"
          layout="total, sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          @current-change="fetchFeedbacks"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </el-card>

    <!-- 反馈弹窗 -->
    <el-dialog 
      title="设备问题反馈" 
      v-model="dialogVisible" 
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form 
        :model="form" 
        label-width="100px" 
        ref="formRef"
        @submit.prevent="submitForm"
      >
        <el-form-item label="选择设备" prop="deviceId" required>
          <div class="device-selection">
            <el-button 
              type="primary" 
              @click="openDeviceSelect" 
              icon="Plus"
            >选择设备</el-button>
            
            <div class="selected-device" v-if="form.deviceName">
              <div class="device-info">
                <el-tag 
                  closable 
                  @close="removeDevice" 
                  class="device-tag"
                >
                  {{ form.deviceName }} - {{ form.deviceModel }}
                </el-tag>
              </div>
            </div>
            
            <div class="no-device" v-else>
              <el-alert 
                title="请选择需要反馈的设备" 
                type="info" 
                show-icon 
                :closable="false"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="问题描述" prop="deviceProblem" required>
          <el-input 
            v-model="form.deviceProblem" 
            type="textarea" 
            :rows="4"
            placeholder="请输入设备问题描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible=false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="submitLoading"
            :disabled="!form.deviceId || !form.deviceProblem"
          >{{ submitLoading ? '提交中...' : '确定提交' }}</el-button>
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
              @click="selectDevice(row)"
            >
              选择
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserFeedbacks, submitFeedback } from '../../api/feedback';
import { Plus, Search } from '@element-plus/icons-vue';

const feedbacks = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const deviceLoading = ref(false);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ status: null, timeRange: [] });

const fetchFeedbacks = async () => {
  loading.value = true;
  try {
    // 构建参数对象
    const params = {};
    params.page = page.page;
    params.pageSize = page.pageSize;
    params.userId = getUserId();
    
    if (searchForm.status !== null && searchForm.status !== undefined) {
      params.status = searchForm.status;
    }
    
    if (searchForm.timeRange?.[0]) {
      params.beginTime = formatDate(searchForm.timeRange[0]);
    }
    
    if (searchForm.timeRange?.[1]) {
      params.endTime = formatDate(searchForm.timeRange[1]);
    }
    const res = await getUserFeedbacks(params);
    if (res.data && res.data.code === 1) {
      feedbacks.value = res.data.data.records;
      page.total = res.data.data.total;
    }
  } catch (error) {
    ElMessage.error('获取反馈记录失败');
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (val) => {
  page.pageSize = val;
  fetchFeedbacks();
};

const resetSearch = () => {
  searchForm.status = null;
  searchForm.timeRange = [];
  page.page = 1;
  fetchFeedbacks();
};

onMounted(fetchFeedbacks);

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

function getUserId() {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.id;
  } catch {
    return null;
  }
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

// 反馈弹窗
const dialogVisible = ref(false);
const form = reactive({ deviceId: null, deviceCode: '', deviceName: '', deviceModel: '', deviceProblem: '' });
const formRef = ref();

function openFeedback() {
  Object.assign(form, { deviceId: null, deviceCode: '', deviceName: '', deviceModel: '', deviceProblem: '' });
  dialogVisible.value = true;
}

function removeDevice() {
  Object.assign(form, { deviceId: null, deviceCode: '', deviceName: '', deviceModel: '' });
}

const handleDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭对话框吗？未保存的数据将会丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    done();
  }).catch(() => {
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
  });
};

async function submitForm() {
  if (!form.deviceId) return ElMessage.warning('请选择设备');
  if (!form.deviceProblem) return ElMessage.warning('请填写问题描述');
  
  submitLoading.value = true;
  try {
    const data = {
      ...form,
      userId: getUserId(),
    };
    const res = await submitFeedback(data);
    if (res.data && res.data.code === 1) {
      ElMessage.success('反馈成功');
      dialogVisible.value = false;
      fetchFeedbacks();
    } else {
      ElMessage.error(res.data?.msg || '反馈失败');
    }
  } catch (error) {
    ElMessage.error('反馈失败');
  } finally {
    submitLoading.value = false;
  }
}

// 设备选择弹窗
const deviceDialog = ref(false);
const deviceList = ref([]);
const devicePage = reactive({ page: 1, pageSize: 8, total: 0 });
const deviceSearch = ref('');

import { getDevicePage } from '../../api/device';

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
      // 只显示正常可用的设备
      deviceStatus: 1
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
function selectDevice(row) {
  Object.assign(form, {
    deviceId: row.deviceId || row.id,
    deviceCode: row.deviceCode,
    deviceName: row.deviceName,
    deviceModel: row.deviceModel,
  });
  deviceDialog.value = false;
}
</script>

<style scoped>
.feedback-management {
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

/* 反馈弹窗样式 */
.device-selection {
  width: 100%;
}

.selected-device {
  margin-top: 15px;
}

.device-info {
  margin-bottom: 10px;
}

.device-tag {
  margin: 0;
  font-size: 14px;
}

.no-device {
  margin-top: 15px;
}

/* 设备选择弹窗样式 */
.device-search {
  display: flex;
  justify-content: flex-start;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .feedback-management {
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
