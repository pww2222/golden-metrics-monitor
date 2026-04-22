<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <span class="logo-icon">📊</span>
        <h1>核心网黄金指标分析系统</h1>
      </div>
      <a-form :model="form" @finish="handleLogin" layout="vertical">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="form.username" placeholder="用户名" size="large" />
        </a-form-item>
        <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="form.password" placeholder="密码" size="large" @pressEnter="handleLogin" />
        </a-form-item>
        <a-form-item>
          <a-checkbox v-model:checked="rememberMe">记住用户名</a-checkbox>
        </a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading" block size="large">
          登 录
        </a-button>
        <div class="login-hint">
          演示账号: admin / 任意密码
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { login } from '@/api/auth';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const rememberMe = ref(false);
const form = reactive({ username: '', password: '' });

onMounted(() => {
  const saved = localStorage.getItem('remembered_username');
  if (saved) {
    form.username = saved;
    rememberMe.value = true;
  }
});

async function handleLogin() {
  loading.value = true;
  try {
    const res: any = await login(form);
    userStore.setToken(res.token);
    userStore.setUserInfo(res.user);
    // Persist user info
    localStorage.setItem('user_info', JSON.stringify(res.user));
    // Remember username
    if (rememberMe.value) {
      localStorage.setItem('remembered_username', form.username);
    } else {
      localStorage.removeItem('remembered_username');
    }
    message.success('登录成功');
    router.push('/');
  } catch (e) {
    // Error handled by interceptor
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="less" scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0960bd 0%, #006be6 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 28px 8px rgba(0,0,0,0.05), 0 9px 24px 0 rgba(0,0,0,0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

  .logo-icon { font-size: 40px; }

  h1 {
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
    margin-top: 12px;
  }
}

.login-hint {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: #8c8c8c;
}
</style>
