import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface UserInfo {
  user_id: string;
  username: string;
  display_name: string;
  role: string;
  province_code: string;
  province_name: string;
  permissions: string[];
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const savedInfo = localStorage.getItem('user_info');
  const userInfo = ref<UserInfo | null>(savedInfo ? JSON.parse(savedInfo) : null);

  function setToken(t: string) {
    token.value = t;
    localStorage.setItem('token', t);
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info;
    localStorage.setItem('user_info', JSON.stringify(info));
  }

  function logout() {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user_info');
  }

  function hasPermission(perm: string): boolean {
    return userInfo.value?.permissions?.includes(perm) ?? false;
  }

  function isGroupAdmin(): boolean {
    return userInfo.value?.role === 'GROUP_ADMIN';
  }

  return { token, userInfo, setToken, setUserInfo, logout, hasPermission, isGroupAdmin };
});
