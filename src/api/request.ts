import axios from 'axios';
import { message } from 'ant-design-vue';
import { useUserStore } from '@/stores/user';
import router from '@/router';

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const userStore = useUserStore();
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`;
  }
  return config;
});

request.interceptors.response.use(
  (res) => {
    const { code, message: msg, data } = res.data;
    if (code === 0) {
      return data;
    }
    // Business error
    message.error(msg || '请求失败');
    if (code === 401) {
      useUserStore().logout();
      router.push('/login');
    }
    return Promise.reject(new Error(msg));
  },
  (err) => {
    if (err.response?.status === 401) {
      useUserStore().logout();
      router.push('/login');
    } else {
      message.error(err.message || '网络异常');
    }
    return Promise.reject(err);
  }
);

export default request;
