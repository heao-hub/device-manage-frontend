<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <el-select v-model="searchForm.status" placeholder="反馈状态" clearable style="width:150px">
          <el-option label="未处理" :value="1" />
          <el-option label="已处理" :value="2" />
          <el-option label="维修" :value="3" />
          <el-option label="报废" :value="4" />
        </el-select>
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width:260px" />
        <el-button type="primary" @click="fetchFeedbacks">查询</el-button>
        <el-button type="success" @click="openFeedback">设备问题反馈</el-button>
      </div>
      <el-table :data="feedbacks" border stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="deviceName" label="设备名称" />
        <el-table-column prop="deviceModel" label="型号" />
        <el-table-column prop="deviceProblem" label="问题描述" />
        <el-table-column prop="status" label="状态" :formatter="statusFmt" />
        <el-table-column prop="createTime" label="反馈时间" />
        <el-table-column prop="handleTime" label="处理时间" />
      </el-table>
      <el-pagination
        v-model:current-page="page.page"
        v-model:page-size="page.pageSize"
        :total="page.total"
        layout="total, prev, pager, next, jumper"
        @current-change="fetchFeedbacks"
        @size-change="fetchFeedbacks"
        style="margin-top:16px;text-align:right;"
      />
    </el-card>

    <!-- 反馈弹窗 -->
    <el-dialog title="设备问题反馈" v-model="dialogVisible" width="500px">
      <el-form :model="form" label-width="90px" ref="formRef">
        <el-form-item label="选择设备" prop="deviceId">
          <el-button type="primary" @click="openDeviceSelect">选择设备</el-button>
          <div v-if="form.deviceName">
            <el-tag closable @close="removeDevice">{{form.deviceName}}({{form.deviceModel}})</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="问题描述" prop="deviceProblem">
          <el-input v-model="form.deviceProblem" type="textarea" />
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
        <el-table-column label="操作" width="100">
          <template #default="{row}">
            <el-button size="small" @click="selectDevice(row)">选择</el-button>
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
import { getUserFeedbacks, submitFeedback } from '../../api/feedback';
import { getUserDevices } from '../../api/borrow';

const feedbacks = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ status: null, timeRange: [] });

const fetchFeedbacks = async () => {
  const params = {
    page: page.page,
    pageSize: page.pageSize,
    userId: getUserId(),
    status: searchForm.status,
    beginTime: searchForm.timeRange?.[0] || '',
    endTime: searchForm.timeRange?.[1] || '',
  };
  const res = await getUserFeedbacks(params);
  if (res.data && res.data.code === 1) {
    feedbacks.value = res.data.data.records;
    page.total = res.data.data.total;
  }
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

function getUserId() {
  try {
    return JSON.parse(localStorage.getItem('user_info'))?.id;
  } catch {
    return null;
  }
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
async function submitForm() {
  if (!form.deviceId) return ElMessage.warning('请选择设备');
  if (!form.deviceProblem) return ElMessage.warning('请填写问题描述');
  const data = {
    ...form,
    userId: getUserId(),
  };
  const res = await submitFeedback(data);
  if (res.data && res.data.code === 1) {
    ElMessage.success('反馈成功');
    dialogVisible.value = false;
    fetchFeedbacks();
  }
}

// 设备选择弹窗（仅可选自己用过的设备）
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
    userId: getUserId(),
    page: devicePage.page,
    pageSize: devicePage.pageSize,
    deviceName: deviceSearch.value,
  };
  const res = await getUserDevices(params);
  if (res.data && res.data.code === 0) {
    deviceList.value = res.data.data.records;
    devicePage.total = res.data.data.total;
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
