import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';

export interface TabItem {
  path: string;
  name: string;
  title: string;
  closable: boolean;
}

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref<TabItem[]>([
    { path: '/rules', name: 'Rules', title: '规则配置', closable: true },
  ]);
  const activeKey = ref('/rules');

  function addTab(route: RouteLocationNormalized) {
    const title = (route.meta?.title as string) || route.name?.toString() || '';
    const exists = tabs.value.find((t) => t.path === route.path);
    if (!exists) {
      tabs.value.push({
        path: route.path,
        name: route.name as string,
        title,
        closable: (route.meta?.closable as boolean) ?? true,
      });
    }
    activeKey.value = route.path;
  }

  function removeTab(path: string) {
    const idx = tabs.value.findIndex((t) => t.path === path);
    if (idx > -1) {
      tabs.value.splice(idx, 1);
      if (activeKey.value === path && tabs.value.length > 0) {
        const newIdx = Math.min(idx, tabs.value.length - 1);
        activeKey.value = tabs.value[newIdx].path;
      }
    }
    return activeKey.value;
  }

  function setActive(path: string) {
    activeKey.value = path;
  }

  return { tabs, activeKey, addTab, removeTab, setActive };
});
