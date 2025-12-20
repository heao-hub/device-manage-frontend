<template>
  <div>
    <el-card>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <el-input v-model="searchForm.username" placeholder="用户名" clearable style="width:180px" />
        <el-select v-model="searchForm.deptId" placeholder="所属单位" clearable style="width:180px">
          <el-option v-for="dept in depts" :key="dept.id" :label="dept.deptName" :value="dept.id" />
        </el-select>
        <el-button type="primary" @click="fetchUsers">查询</el-button>
        <el-button type="success" @click="openAdd">添加用户</el-button>
      </div>
      <el-table :data="users" border stripe style="width:100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="type" label="类型" :formatter="typeFmt" />
        <el-table-column prop="deptName" label="所属单位" />
        <el-table-column prop="createTime" label="创建时间" />
        <el-table-column label="操作" width="180">
          <template #default="{row}">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="delUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.page"
        v-model:page-size="page.pageSize"
        :total="page.total"
        layout="total, prev, pager, next, jumper"
        @current-change="fetchUsers"
        @size-change="fetchUsers"
        style="margin-top:16px;text-align:right;"
      />
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog :title="editMode ? '编辑用户' : '添加用户'" v-model="dialogVisible" width="400px">
      <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" autocomplete="off" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editMode">
          <el-input v-model="form.password" type="password" autocomplete="off" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type">
            <el-option label="管理员" :value="1" />
            <el-option label="普通用户" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属单位" prop="deptId">
          <el-select v-model="form.deptId">
            <el-option v-for="dept in depts" :key="dept.id" :label="dept.deptName" :value="dept.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserPage, addUser, updateUser, deleteUser, getUserById, getAllDepts } from '../../api/user';

const users = ref([]);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ username: '', deptId: null });
const depts = ref([]);

const fetchUsers = async () => {
  const params = { page: page.page, pageSize: page.pageSize, ...searchForm };
  const res = await getUserPage(params);
  if (res.data && res.data.code === 1) {
    users.value = res.data.data.records;
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
  fetchUsers();
});

const dialogVisible = ref(false);
const editMode = ref(false);
const form = reactive({ id: null, username: '', password: '', type: 2, deptId: null });
const formRef = ref();
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  deptId: [{ required: true, message: '请选择单位', trigger: 'change' }],
};

function typeFmt(row) {
  return row.type === 1 ? '管理员' : '普通用户';
}

function openAdd() {
  editMode.value = false;
  Object.assign(form, { id: null, username: '', password: '', type: 2, deptId: null });
  dialogVisible.value = true;
}

async function openEdit(row) {
  editMode.value = true;
  const res = await getUserById(row.id);
  if (res.data && res.data.code === 1) {
    Object.assign(form, res.data.data, { password: '' });
    dialogVisible.value = true;
  }
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) return;
    if (editMode.value) {
      const res = await updateUser(form);
      if (res.data && res.data.code === 1) {
        ElMessage.success('修改成功');
        dialogVisible.value = false;
        fetchUsers();
      }
    } else {
      const res = await addUser(form);
      if (res.data && res.data.code === 1) {
        ElMessage.success('添加成功');
        dialogVisible.value = false;
        fetchUsers();
      }
    }
  });
}

function delUser(row) {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', { type: 'warning' })
    .then(async () => {
      const res = await deleteUser(row.id);
      if (res.data && res.data.code === 1) {
        ElMessage.success('删除成功');
        fetchUsers();
      }
    });
}
</script>
