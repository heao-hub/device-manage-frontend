<template>
  <div class="user-management">
    <el-card class="search-card">
      <div class="search-header">
        <h2 class="page-title">用户管理</h2>
        <el-button type="success" @click="openAdd" icon="Plus">添加用户</el-button>
      </div>
      
      <div class="search-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input 
              v-model="searchForm.username" 
              placeholder="请输入用户名" 
              clearable 
              prefix-icon="Search"
              @keyup.enter="fetchUsers"
            />
          </el-col>
          <el-col :span="8">
            <el-select 
              v-model="searchForm.deptId" 
              placeholder="请选择所属单位" 
              clearable 
              filterable
            >
              <el-option 
                v-for="dept in depts" 
                :key="dept.id" 
                :label="dept.code + ' - ' + dept.name" 
                :value="dept.id" 
              />
            </el-select>
          </el-col>
          <el-col :span="8">
            <div class="search-buttons">
              <el-button type="primary" @click="fetchUsers" icon="Search">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
    
    <el-card class="table-card">
      <el-table 
        :data="users" 
        border 
        stripe 
        style="width:100%"
        v-loading="loading"
        element-loading-text="加载中..."
      >
        <el-table-column prop="code" label="编号" width="160" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="type" label="类型" :formatter="typeFmt" width="120" />
        <el-table-column prop="deptName" label="所属单位" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
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
                type="danger" 
                link
                icon="Delete"
                @click="delUser(row)"
              >删除</el-button>
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
          @current-change="fetchUsers"
          @size-change="handleSizeChange"
          background
        />
      </div>
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog 
      :title="editMode ? '编辑用户' : '添加用户'" 
      v-model="dialogVisible" 
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form 
        :model="form" 
        label-width="100px" 
        :rules="rules" 
        ref="formRef"
        @submit.prevent="submitForm"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="form.username" 
            autocomplete="off" 
            placeholder="请输入用户名"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            autocomplete="off" 
            placeholder="请输入密码"
            show-password
          />
          <div class="password-hint" v-if="editMode">留空则不修改密码</div>
        </el-form-item>
        
        <el-form-item label="用户类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">管理员</el-radio>
            <el-radio :value="2">普通用户</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="所属单位" prop="deptId">
          <el-select 
            v-model="form.deptId" 
            placeholder="请选择所属单位"
            filterable
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getUserPage, addUser, updateUser, updatePassword, deleteUser, getUserById, getUserDept } from '../../api/user';

// 引入图标
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue';

const users = ref([]);
const loading = ref(false);
const submitLoading = ref(false);
const page = reactive({ page: 1, pageSize: 10, total: 0 });
const searchForm = reactive({ username: '', deptId: null });
const depts = ref([]);

const fetchUsers = async () => {
  loading.value = true;
  try {
    const params = { page: page.page, pageSize: page.pageSize, ...searchForm };
    const res = await getUserPage(params);
    if (res.data && res.data.code === 1) {
      users.value = res.data.data.records;
      page.total = res.data.data.total;
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (val) => {
  page.pageSize = val;
  fetchUsers();
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
  searchForm.username = '';
  searchForm.deptId = null;
  page.page = 1;
  fetchUsers();
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
  password: [
    { 
      required: true, 
      message: '请输入密码', 
      trigger: 'blur' 
    },
    { 
      min: 6, 
      max: 20, 
      message: '密码长度应在6-20个字符之间', 
      trigger: 'blur' 
    }
  ],
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

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) return;
    
    submitLoading.value = true;
    try {
      let res;
      if (editMode.value) {
        // 编辑模式下，如果密码为空则不更新密码
        const formData = { ...form };
        if (!formData.password) {
          delete formData.password;
        }
        
        res = await updateUser(formData);
        if (res.data && res.data.code === 1) {
          ElMessage.success('修改成功');
          dialogVisible.value = false;
          fetchUsers();
        } else {
          ElMessage.error(res.data?.msg || '修改失败');
        }
      } else {
        res = await addUser(form);
        if (res.data && res.data.code === 1) {
          ElMessage.success('添加成功');
          dialogVisible.value = false;
          fetchUsers();
        } else {
          ElMessage.error(res.data?.msg || '添加失败');
        }
      }
    } catch (error) {
      ElMessage.error(editMode.value ? '修改失败' : '添加失败');
    } finally {
      submitLoading.value = false;
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

// 打开修改密码对话框
function openChangePassword(row) {
  Object.assign(passwordForm, { 
    id: row.id, 
    username: row.username, 
    newPassword: '', 
    confirmPassword: '' 
  });
  passwordDialogVisible.value = true;
}

// 处理密码对话框关闭
const handlePasswordDialogClose = (done) => {
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

// 提交密码修改表单
function submitPasswordForm() {
  passwordFormRef.value.validate(async valid => {
    if (!valid) return;
    
    submitLoading.value = true;
    try {
      const data = {
        id: passwordForm.id,
        password: passwordForm.newPassword
      };
      
      const res = await updatePassword(data);
      if (res.data && res.data.code === 1) {
        ElMessage.success('密码修改成功');
        passwordDialogVisible.value = false;
        fetchUsers();
      } else {
        ElMessage.error(res.data?.msg || '密码修改失败');
      }
    } catch (error) {
      ElMessage.error('密码修改失败');
    } finally {
      submitLoading.value = false;
    }
  });
}
</script>

<style scoped>
.user-management {
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

.password-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-management {
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
