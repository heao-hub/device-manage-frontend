
<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2 style="text-align:center;margin-bottom:20px;">设备管理系统登录</h2>
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
        if (res.data.code === 1) {
          localStorage.setItem('app_token', res.data.data.token)
          await Promise.resolve() // 确保 token 写入完成
          const userRes = await getUserById(res.data.data.id)
          localStorage.setItem('user_info', JSON.stringify(userRes.data.data))
          ElMessage.success('登录成功')
          router.push('/')
        } else {
          ElMessage.error(res.data.msg || '登录失败')
        }
    } catch (e) {
      ElMessage.error(e.msg || '登录异常')
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
  background: #f5f7fa;
}
.login-card {
  width: 400px;
  padding: 40px 30px 20px 30px;
  box-shadow: 0 2px 12px #0000001a;
}
</style>
