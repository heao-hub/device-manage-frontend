<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <el-select v-model="searchForm.status" placeholder="申请状态" clearable style="width:150px">
          <el-option label="待审核" :value="1" />
          <el-option label="审核通过" :value="2" />
          <el-option label="审核不通过" :value="3" />
        </el-select>
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
        <el-button type="primary" @click="fetchOrders">查询</el-button>
        <el-button type="success" @click="openBorrow">借用设备</el-button>
      </div>
      <el-table :data="orders" border stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="code" label="借条编号" />
        <el-table-column prop="description" label="借用说明" />
        <el-table-column prop="status" label="状态" :formatter="statusFmt" />
        <el-table-column prop="createTime" label="申请时间" />
        <el-table-column prop="handleTime" label="审批时间" />
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

    <!-- 借用设备弹窗 -->
    <el-dialog title="借用设备" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="90px" ref="formRef">
        <el-form-item label="借用说明" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="选择设备">
          <el-button type="primary" @click="openDeviceSelect">添加设备</el-button>
          <div v-if="form.devices.length">
            <el-tag v-for="d in form.devices" :key="d.id" closable @close="removeDevice(d)">{{d.deviceName}}({{d.deviceModel}})</el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 设备选择弹窗 -->
    <el-dialog title="选择设备" v-model="deviceDialog" width="700px">
      <el-input v-model="deviceSearch" placeholder="设备名称" clearable style="width:200px;margin-bottom:10px" @input="fetchDevices" />
      <el-table :data="deviceList" border height="300">
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="manufacturer" label="厂商" />
        <el-table-column label="操作" width="100">
          <template #default="{row}">
            <el-button size="small" @click="addDevice(row)">添加</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="devicePage.page"
        v-model:page-size="devicePage.pageSize"
        :total="devicePage.total"
        layout="total, prev, pager, next, jumper"
        @current-change="fetchDevices"
        @size-change="fetchDevices"
        style="margin-top:8px;text-align:right;"
      />
      <template #footer>
        <el-button @click="deviceDialog=false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getUserBorrowOrders, borrowDevices } from '../../api/borrow';
import { getDevicePage } from '../../api/device';

const orders = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ status: null, timeRange: [] });

const fetchOrders = async () => {
  const params = {
    page: page.page,
    pageSize: page.pageSize,
    userId: getUserId(),
    status: searchForm.status,
    beginTime: searchForm.timeRange?.[0] || '',
    endTime: searchForm.timeRange?.[1] || '',
  };
  const res = await getUserBorrowOrders(params);
  if (res.data && res.data.code === 1) {
    orders.value = res.data.data.records;
    page.total = res.data.data.total;
  }
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

function getUserId() {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.id;
  } catch {
    return null;
  }
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
function removeDevice(d) {
  form.devices = form.devices.filter(item => item.id !== d.id);
}
async function submitForm() {
  if (!form.devices.length) return ElMessage.warning('请选择设备');
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
const fetchDevices = async () => {
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
};
function addDevice(row) {
  if (!form.devices.find(d => d.id === row.id)) {
    form.devices.push(row);
  }
}
</script>
