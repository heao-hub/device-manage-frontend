
<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 style="text-align:center;margin-bottom:20px;">设备预约管理系统登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onLogin" style="width:100%">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary" :underline="false" @click="$router.push('/register')">立即注册</el-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { login as apiLogin, getUserById } from '../../api/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const formRef = ref()
const form = ref({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const onLogin = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const res = await apiLogin(form.value)
      const resData = res.data
      
      // 兼容 code === 1 或 code === 200
      if (resData && (resData.code === 1 || resData.code === 200)) {
        const loginData = resData.data
        
        // 存储 token
        localStorage.setItem('app_token', loginData.token)
        
        // 尝试获取完整用户信息
        let userInfo = null
        try {
          const userRes = await getUserById(loginData.id)
          if (userRes.data && (userRes.data.code === 1 || userRes.data.code === 200)) {
            userInfo = userRes.data.data
          }
        } catch (e) {
          console.warn('获取用户信息失败，使用登录返回的数据', e)
        }
        
        // 如果 getUserById 失败，用登录接口返回的数据兜底
        if (!userInfo) {
          userInfo = {
            id: loginData.id,
            username: loginData.username || loginData.userName || form.value.username,
            type: loginData.type || 2, // 默认为普通用户
          }
        }
        
        localStorage.setItem('user_info', JSON.stringify(userInfo))
        
        ElMessage.success('登录成功')
        
        // 使用 nextTick 确保 DOM 更新完成后再跳转
        setTimeout(() => {
          window.location.href = '/'
        }, 100)
      } else {
        ElMessage.error(resData?.msg || '登录失败')
      }
    } catch (e) {
      console.error('Login error:', e)
      ElMessage.error(e?.response?.data?.msg || '登录异常')
    }
  })
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: url('../../assets/bg.jpg') no-repeat center center;
  background-size: cover;
}
.login-card {
  width: 400px;
  padding: 40px 30px 20px 30px;
  box-shadow: 0 2px 12px #0000001a;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}
.login-footer {
  text-align: center;
  margin-top: 12px;
  font-size: 14px;
  color: #606266;
}
.login-footer .el-link {
  font-size: 14px;
  font-weight: 500;
}
</style>
