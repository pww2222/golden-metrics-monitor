<template>
  <a-modal
    :open="open"
    title="规则模板市场"
    :width="720"
    :footer="null"
    @cancel="$emit('update:open', false)"
    :destroyOnClose="true"
  >
    <a-form layout="inline" style="margin-bottom: 16px">
      <a-form-item label="模板名称">
        <a-input v-model:value="filter.template_name" placeholder="搜索模板..." allowClear @change="loadTemplates" />
      </a-form-item>
      <a-form-item label="网元类型">
        <a-select v-model:value="filter.ne_type" placeholder="全部" allowClear style="width: 120px" @change="loadTemplates">
          <a-select-option v-for="t in neTypeList" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>

    <a-list :dataSource="templateList" :loading="loading" bordered>
      <template #renderItem="{ item }">
        <a-list-item>
          <a-list-item-meta>
            <template #title>
              <span style="font-weight: 500">📋 {{ item.template_name }}</span>
            </template>
            <template #description>
              <a-space :size="16">
                <span>网元类型: {{ item.ne_type }}</span>
                <span>指标: {{ item.metric_name }}</span>
                <span>条件: {{ thresholdTypeMap[item.threshold_type] }} {{ item.operator }}{{ item.threshold_value }}{{ item.metric_unit === 'percent' ? '%' : '' }}</span>
                <span>窗口: {{ item.observe_window }}分钟</span>
                <span>等级: {{ severityLabel(item.severity) }}</span>
                <span>使用次数: {{ item.usage_count }}</span>
              </a-space>
            </template>
          </a-list-item-meta>
          <template #actions>
            <a-button type="primary" size="small" @click="useTemplate(item)">使用此模板</a-button>
          </template>
        </a-list-item>
      </template>
    </a-list>

    <div style="text-align: right; margin-top: 12px">
      <a-pagination v-model:current="pagination.current" :total="pagination.total" :pageSize="pagination.pageSize" size="small" @change="loadTemplates" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { getTemplates, createRuleFromTemplate } from '@/api/templates';
import { getNeTypes } from '@/api/common';

defineProps<{ open: boolean }>();
const emit = defineEmits(['update:open', 'create']);

const loading = ref(false);
const templateList = ref<any[]>([]);
const neTypeList = ref<any[]>([]);

const filter = reactive({ template_name: '', ne_type: undefined as string | undefined });
const pagination = reactive({ current: 1, pageSize: 10, total: 0 });

const thresholdTypeMap: Record<string, string> = { absolute: '绝对值', qoq: '环比', yoy: '同比' };

function severityLabel(s: number) {
  return ['', '1级-紧急', '2级-严重', '3级-一般', '4级-提示'][s] || '';
}

onMounted(() => {
  loadNeTypes();
  loadTemplates();
});

async function loadNeTypes() {
  try {
    const res: any = await getNeTypes();
    neTypeList.value = res || [];
  } catch {}
}

async function loadTemplates() {
  loading.value = true;
  try {
    const res: any = await getTemplates({
      template_name: filter.template_name || undefined,
      ne_type: filter.ne_type,
      page: pagination.current,
      page_size: pagination.pageSize,
    });
    templateList.value = res.list || [];
    pagination.total = res.total || 0;
  } catch {} finally {
    loading.value = false;
  }
}

async function useTemplate(tpl: any) {
  try {
    await createRuleFromTemplate(tpl.template_id, {
      rule_name: tpl.template_name,
      severity: tpl.severity,
      observe_window: tpl.observe_window,
      recovery_window: tpl.recovery_window,
      status: 1,
    });
    message.success('从模板创建规则成功');
    emit('update:open', false);
    emit('create');
  } catch {}
}
</script>
