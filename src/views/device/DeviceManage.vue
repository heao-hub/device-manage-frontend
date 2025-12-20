<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <el-input v-model="searchForm.deviceName" placeholder="设备名称" clearable style="width:180px" />
        <el-select v-model="searchForm.deviceStatus" placeholder="设备状态" clearable style="width:180px">
          <el-option label="正常可用" :value="1" />
          <el-option label="借出" :value="2" />
          <el-option label="维修中" :value="3" />
          <el-option label="报废" :value="4" />
        </el-select>
        <el-button type="primary" @click="fetchDevices">查询</el-button>
        <el-button type="success" @click="openAdd">设备入库</el-button>
      </div>
      <el-table :data="devices" border stripe style="width:100%">
        <el-table-column prop="code" label="编号" width="120" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="status" label="状态" :formatter="statusFmt" />
        <el-table-column prop="price" label="单价" />
        <el-table-column prop="manufacturer" label="厂商" />
        <el-table-column prop="deptName" label="所属单位" />
        <el-table-column prop="createTime" label="入库时间" />
        <el-table-column label="操作" width="260">
          <template #default="{row}">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="openScrapDialog(row)">报废</el-button>
            <el-button size="small" type="warning" @click="repairDevice(row)">维修</el-button>
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

    <!-- 入库/编辑弹窗 -->
    <el-dialog :title="editMode ? '编辑设备' : '设备入库'" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="90px" :rules="rules" ref="formRef">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="form.deviceName" />
        </el-form-item>
        <el-form-item label="型号" prop="deviceModel">
          <el-input v-model="form.deviceModel" />
        </el-form-item>
        <el-form-item label="数量" prop="count" v-if="!editMode">
          <el-input-number v-model="form.count" :min="1" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="form.price" :min="0" />
        </el-form-item>
        <el-form-item label="厂商" prop="manufacturer">
          <el-input v-model="form.manufacturer" />
        </el-form-item>
        <el-form-item label="所属单位" prop="deptId">
          <el-select v-model="form.deptId">
            <el-option v-for="dept in depts" :key="dept.id" :label="dept.code + ' - ' + dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 报废弹窗 -->
    <el-dialog title="设备报废" v-model="scrapDialog" width="400px">
      <el-form :model="scrapForm" label-width="80px">
        <el-form-item label="原因" prop="reason">
          <el-input v-model="scrapForm.reason" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scrapDialog=false">取消</el-button>
        <el-button type="danger" @click="submitScrap">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getDevicePage, addDevice, updateDevice, getDeviceById, scrapDevice } from '../../api/device';
import { getAllDepts } from '../../api/user';

const devices = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ deviceName: '', deviceStatus: null });
const depts = ref([]);

const fetchDevices = async () => {
  const params = { page: page.page, pageSize: page.pageSize, ...searchForm };
  const res = await getDevicePage(params);
  if (res.data && res.data.code === 1) {
    devices.value = res.data.data.records;
    page.total = res.data.data.total;
  }
};

const fetchDepts = async () => {
  const res = await getAllDepts();
  if (res.data && res.data.code === 1) {
    depts.value = res.data.data.records || [];
  }
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

function statusFmt(row) {
  switch (row.status) {
    case 1: return '正常可用';
    case 2: return '借出';
    case 3: return '维修中';
    case 4: return '报废';
    default: return '-';
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

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) return;
    if (editMode.value) {
      const res = await updateDevice(form);
      if (res.data && res.data.code === 0) {
        ElMessage.success('修改成功');
        dialogVisible.value = false;
        fetchDevices();
      }
    } else {
      const res = await addDevice(form);
      if (res.data && res.data.code === 0) {
        ElMessage.success('入库成功');
        dialogVisible.value = false;
        fetchDevices();
      }
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
  const res = await scrapDevice({ deviceId: scrapForm.deviceId, reason: scrapForm.reason, adminId: getAdminId() });
  if (res.data && res.data.code === 0) {
    ElMessage.success('报废成功');
    scrapDialog.value = false;
    fetchDevices();
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
      if (res.data && res.data.code === 0) {
        ElMessage.success('已设为维修中');
        fetchDevices();
      }
    });
}
</script>
