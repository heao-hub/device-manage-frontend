<template>
  <div class="device-management">
    <el-card class="search-card">
      <div class="search-header">
        <h2 class="page-title">设备管理</h2>
        <el-button type="success" @click="openAdd" icon="Plus">设备入库</el-button>
      </div>
      
      <div class="search-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input 
              v-model="searchForm.deviceName" 
              placeholder="请输入设备名称" 
              clearable 
              prefix-icon="Search"
              @keyup.enter="fetchDevices"
            />
          </el-col>
          <el-col :span="8">
            <el-select 
              v-model="searchForm.deviceStatus" 
              placeholder="请选择设备状态" 
              clearable 
              filterable
            >
              <el-option label="正常可用" :value="1" />
              <el-option label="借出" :value="2" />
              <el-option label="维修中" :value="3" />
              <el-option label="报废" :value="4" />
              <el-option label="已预约" :value="5" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <div class="search-buttons">
              <el-button type="primary" @click="fetchDevices" icon="Search">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </div>
          </el-col>
        </el-row>
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
        <el-table-column prop="code" label="设备编号" width="150" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{row}">
            <el-tag :type="getStatusTagType(row.status)">{{ statusFmt(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价(元)" width="100" />
        <el-table-column prop="manufacturer" label="厂商" />
        <el-table-column prop="deptName" label="所属单位" />
        <el-table-column prop="createTime" label="入库时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{row}">
            <div class="table-actions">
              <el-button 
                size="small" 
                @click="openEdit(row)" 
                type="primary" 
                link
                icon="Edit"
              >编辑</el-button>
              <el-button 
                size="small" 
                type="warning" 
                link
                icon="Tools"
                @click="repairDevice(row)"
              >维修</el-button>
              <el-button 
                size="small" 
                type="danger" 
                link
                icon="Delete"
                @click="openScrapDialog(row)"
              >报废</el-button>
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
          @current-change="fetchDevices"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </el-card>

    <!-- 入库/编辑弹窗 -->
    <el-dialog 
      :title="editMode ? '编辑设备' : '设备入库'" 
      v-model="dialogVisible" 
      width="550px"
      :before-close="handleDialogClose"
    >
      <el-form 
        :model="form" 
        label-width="100px" 
        :rules="rules" 
        ref="formRef"
        @submit.prevent="submitForm"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input 
                v-model="form.deviceName" 
                placeholder="请输入设备名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="deviceModel">
              <el-input 
                v-model="form.deviceModel" 
                placeholder="请输入型号"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12" v-if="!editMode">
            <el-form-item label="数量" prop="count">
              <el-input-number 
                v-model="form.count" 
                :min="1" 
                controls-position="right"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价(元)" prop="price">
              <el-input-number 
                v-model="form.price" 
                :min="0" 
                controls-position="right"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="厂商" prop="manufacturer">
          <el-input 
            v-model="form.manufacturer" 
            placeholder="请输入厂商名称"
          />
        </el-form-item>
        
        <el-form-item label="所属单位" prop="deptId">
          <el-select 
            v-model="form.deptId" 
            placeholder="请选择所属单位"
            filterable
            style="width: 100%;"
          >
            <el-option 
              v-for="dept in depts" 
              :key="dept.id" 
              :label="dept.code + ' - ' + dept.name" 
              :value="dept.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible=false">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitForm" 
            :loading="submitLoading"
          >{{ submitLoading ? '提交中...' : '确定' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 报废弹窗 -->
    <el-dialog 
      title="设备报废" 
      v-model="scrapDialog" 
      width="500px"
      :before-close="handleScrapDialogClose"
    >
      <el-form :model="scrapForm" label-width="80px">
        <el-form-item label="报废原因" prop="reason">
          <el-input 
            v-model="scrapForm.reason" 
            type="textarea" 
            :rows="4"
            placeholder="请输入报废原因"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="scrapDialog=false">取消</el-button>
          <el-button 
            type="danger" 
            @click="submitScrap" 
            :loading="scrapLoading"
          >{{ scrapLoading ? '提交中...' : '确定' }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getDevicePage, addDevice, updateDevice, getDeviceById, scrapDevice } from '../../api/device';
import { getUserDept } from '../../api/user';

// 引入图标
import { Plus, Search, Edit, Delete, Tools } from '@element-plus/icons-vue';

const devices = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const scrapLoading = ref(false);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ deviceName: '', deviceStatus: null });
const depts = ref([]);

const fetchDevices = async () => {
  loading.value = true;
  try {
    const params = { page: page.page, pageSize: page.pageSize, ...searchForm };
    const res = await getDevicePage(params);
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

const fetchDepts = async () => {
  try {
    const res = await getUserDept();
    if (res.data && res.data.code === 1) {
      depts.value = res.data.data.records || [];
    }
  } catch (error) {
    ElMessage.error('获取单位列表失败');
  }
};

const resetSearch = () => {
  searchForm.deviceName = '';
  searchForm.deviceStatus = null;
  page.page = 1;
  fetchDevices();
};

onMounted(() => {
  fetchDepts();
  fetchDevices();
});

const dialogVisible = ref(false);
const editMode = ref(false);
const form = reactive({
  id: null, deviceName: '', deviceModel: '', count: 1, price: 0, manufacturer: '', deptId: null
});
const formRef = ref();
const rules = {
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceModel: [{ required: true, message: '请输入型号', trigger: 'blur' }],
  count: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  manufacturer: [{ required: true, message: '请输入厂商', trigger: 'blur' }],
  deptId: [{ required: true, message: '请选择单位', trigger: 'change' }],
};

// 设备状态常量（严格按接口文档）
// 1-正常可用 2-借出 3-维修中 4-报废 5-已预约
function statusFmt(row) {
  switch (row.status) {
    case 1: return '正常可用';
    case 2: return '借出';
    case 3: return '维修中';
    case 4: return '报废';
    case 5: return '已预约';
    default: return '-';
  }
}

function getStatusTagType(status) {
  switch (status) {
    case 1: return 'success'; // 正常可用 - 绿色
    case 2: return 'primary'; // 借出 - 蓝色
    case 3: return 'info';    // 维修中 - 灰色
    case 4: return 'danger';  // 报废 - 红色
    case 5: return 'warning'; // 已预约 - 橙色
    default: return 'info';
  }
}

function openAdd() {
  editMode.value = false;
  Object.assign(form, { id: null, deviceName: '', deviceModel: '', count: 1, price: 0, manufacturer: '', deptId: null });
  dialogVisible.value = true;
}

async function openEdit(row) {
  editMode.value = true;
  const res = await getDeviceById(row.id);
  if (res.data && res.data.code === 1) {
    Object.assign(form, res.data.data);
    dialogVisible.value = true;
  }
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

const handleScrapDialogClose = (done) => {
  ElMessageBox.confirm('确认关闭报废对话框吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    done();
  }).catch(() => {
    // 取消关闭
  });
};

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) return;
    
    submitLoading.value = true;
    try {
      let res;
      if (editMode.value) {
        res = await updateDevice(form);
        if (res.data && res.data.code === 1) { // 1 表示成功
          ElMessage.success('修改成功');
          dialogVisible.value = false;
          fetchDevices();
        } else {
          ElMessage.error(res.data?.msg || '修改失败');
        }
      } else {
        res = await addDevice({ ...form, adminId: getAdminId() });
        if (res.data && res.data.code === 1) { // 1 表示成功
          ElMessage.success('入库成功');
          dialogVisible.value = false;
          fetchDevices();
        } else {
          ElMessage.error(res.data?.msg || '入库失败');
        }
      }
    } catch (error) {
      ElMessage.error(editMode.value ? '修改失败' : '入库失败');
    } finally {
      submitLoading.value = false;
    }
  });
}

const scrapDialog = ref(false);
const scrapForm = reactive({ reason: '', deviceId: null });
let scrapRow = null;
function openScrapDialog(row) {
  scrapRow = row;
  scrapForm.reason = '';
  scrapForm.deviceId = row.id;
  scrapDialog.value = true;
}
async function submitScrap() {
  if (!scrapForm.reason) return ElMessage.warning('请填写报废原因');
  
  scrapLoading.value = true;
  try {
    const res = await scrapDevice({ deviceId: scrapForm.deviceId, reason: scrapForm.reason, adminId: getAdminId() });
    if (res.data && res.data.code === 1) { // 1 表示成功
      ElMessage.success('报废成功');
      scrapDialog.value = false;
      fetchDevices();
    } else {
      ElMessage.error(res.data?.msg || '报废失败');
    }
  } catch (error) {
    ElMessage.error('报废失败');
  } finally {
    scrapLoading.value = false;
  }
}

function getAdminId() {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.id;
  } catch {
    return null;
  }
}

async function repairDevice(row) {
  ElMessageBox.confirm('确定将该设备状态设为维修中？', '提示', { type: 'warning' })
    .then(async () => {
      const res = await updateDevice({ ...row, status: 3 });
      if (res.data && res.data.code === 1) { // 1 表示成功
        ElMessage.success('已设为维修中');
        fetchDevices();
      }
    });
}
</script>

<style scoped>
.device-management {
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

.table-actions {
  display: flex;
  gap: 10px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .device-management {
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
  
  .table-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style>
