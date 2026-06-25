<template>
  <div class="register-page">
    <el-card class="register-card">
      <div class="register-header">
        <h2 class="register-title">设备预约管理系统</h2>
        <p class="register-subtitle">用户注册</p>
      </div>

      <el-form
        :model="form"
        :rules="rules"
        ref="formRef"
        label-width="0"
        size="large"
        @submit.prevent="onRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            maxlength="20"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码（6-20位）"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="deptId">
          <el-select
            v-model="form.deptId"
            placeholder="请选择所属部门"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="dept in depts"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            @click="onRegister"
            :loading="loading"
            style="width: 100%;"
          >{{ loading ? '注册中...' : '立即注册' }}</el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <span>已有账号？</span>
        <el-link type="primary" :underline="false" @click="$router.push('/login')">立即登录</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock } from '@element-plus/icons-vue';
import { register, getUserDept } from '../../api/user';

const router = useRouter();
const formRef = ref();
const loading = ref(false);
const depts = ref([]);

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  deptId: null,
});

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应在2-20个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应在6-20个字符之间', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

// 加载部门列表
const fetchDepts = async () => {
  try {
    const res = await getUserDept();
    if (res.data && res.data.code === 1) {
      depts.value = res.data.data.records || [];
    }
  } catch (error) {
    ElMessage.error('获取部门列表失败');
  }
};

onMounted(fetchDepts);

// 提交注册
const onRegister = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const data = {
        username: form.username,
        password: form.password,
      };
      if (form.deptId) {
        data.deptId = form.deptId;
      }
      const res = await register(data);
      if (res.data && res.data.code === 1) {
        ElMessage.success('注册成功，请登录');
        router.push('/login');
      } else {
        ElMessage.error(res.data?.msg || '注册失败');
      }
    } catch (error) {
      ElMessage.error(error?.response?.data?.msg || '注册失败，请稍后重试');
    } finally {
      loading.value = false;
    }
  });
};
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: url('../../assets/bg.jpg') no-repeat center center;
  background-size: cover;
}

.register-card {
  width: 420px;
  padding: 36px 36px 24px 36px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.register-title {
  margin: 0 0 6px 0;
  font-size: 22px;
  font-weight: 700;
  color: #2d8cf0;
  letter-spacing: 1px;
}

.register-subtitle {
  margin: 0;
  font-size: 15px;
  color: #909399;
  font-weight: 400;
}

.register-footer {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #606266;
}

.register-footer .el-link {
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
}
</style>
