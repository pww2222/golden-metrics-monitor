<template>
  <div class="basic-layout">
    <!-- Top Navigation -->
    <header class="top-header">
      <div class="header-left">
        <span class="logo-icon">📊</span>
        <span class="sys-title">黄金指标分析系统</span>
      </div>
      <nav class="header-nav">
        <div
          v-for="item in navItems"
          :key="item.path"
          :class="['nav-item', { active: currentNav === item.path }]"
          @click="navigateTo(item.path)"
        >
          {{ item.title }}
        </div>
      </nav>
      <div class="header-right">
        <a-badge :count="alarmCount" :overflow-count="99">
          <bell-outlined class="alarm-bell" />
        </a-badge>
        <a-dropdown>
          <span class="user-info">
            <a-avatar :size="28" style="background: #006be6">{{ displayName?.[0] || 'U' }}</a-avatar>
            <span class="user-name">{{ displayName || '未登录' }}</span>
          </span>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="handleLogout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </header>

    <!-- Tab Bar -->
    <div class="tab-bar">
      <div
        v-for="tab in tabs"
        :key="tab.path"
        :class="['tab-item', { active: activeKey === tab.path }]"
        @click="onTabClick(tab.path)"
      >
        <span class="tab-title">{{ tab.title }}</span>
        <close-outlined
          v-if="tab.closable"
          class="tab-close"
          @click.stop="onTabClose(tab.path)"
        />
      </div>
    </div>

    <!-- Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { BellOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { useTabsStore } from '@/stores/tabs';
import { useUserStore } from '@/stores/user';
import { getAlarms } from '@/api/alarms';

const router = useRouter();
const route = useRoute();
const tabsStore = useTabsStore();
const userStore = useUserStore();

const navItems = [
  { path: '/rules', title: '规则配置' },
  { path: '/report', title: '指标报表' },
  { path: '/monitor', title: '监控报表' },
];

const tabs = computed(() => tabsStore.tabs);
const activeKey = computed(() => tabsStore.activeKey);
const currentNav = computed(() => '/' + route.path.split('/')[1]);
const displayName = computed(() => userStore.userInfo?.display_name);
const alarmCount = ref(0);

onMounted(async () => {
  try {
    const res: any = await getAlarms({ status: 'pending', page: 1, page_size: 1 });
    alarmCount.value = res.total || 0;
  } catch {}
});

watch(route, (r) => {
  tabsStore.addTab(r);
}, { immediate: true });

function navigateTo(path: string) {
  router.push(path);
}

function onTabClick(path: string) {
  tabsStore.setActive(path);
  router.push(path);
}

function onTabClose(path: string) {
  const newActive = tabsStore.removeTab(path);
  router.push(newActive);
}

function handleLogout() {
  userStore.logout();
  router.push('/login');
}
</script>

<script lang="ts">
export default { name: 'BasicLayout' };
</script>

<style lang="less" scoped>
@import '@/styles/variables.less';

.basic-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.top-header {
  height: @header-height;
  padding: 2px 16px;
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: @shadow-1;
  z-index: 100;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    .logo-icon { font-size: 22px; }
    .sys-title {
      font-size: 16px;
      font-weight: 600;
      color: @text-color;
      white-space: nowrap;
    }
  }

  .header-nav {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;

    .nav-item {
      padding: 0 20px;
      height: 46px;
      line-height: 46px;
      cursor: pointer;
      border-radius: 6px;
      font-size: 14px;
      color: @text-color;
      transition: all 0.2s;
      white-space: nowrap;

      &:hover { background: @menu-hover-bg; }
      &.active {
        background: @selected-bg;
        color: @selected-text;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .alarm-bell {
      font-size: 18px;
      cursor: pointer;
      color: @text-color;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      .user-name {
        font-size: 14px;
        color: @text-color;
      }
    }
  }
}

.tab-bar {
  height: @tab-height;
  background: #fff;
  display: flex;
  align-items: flex-end;
  padding: 0 12px;
  gap: 4px;
  border-bottom: 1px solid @border-color;
  flex-shrink: 0;

  .tab-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    height: 30px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 5px 5px 0 0;
    color: @text-color;
    transition: all 0.2s;

    &:hover { background: @menu-hover-bg; }
    &.active {
      background: @selected-bg;
      color: @selected-text;
    }

    .tab-close {
      font-size: 10px;
      color: @disabled-color;
      &:hover { color: @error-color; }
    }
  }
}

.main-content {
  flex: 1;
  overflow: auto;
  background: @page-bg;
  padding: @content-padding;
}
</style>
