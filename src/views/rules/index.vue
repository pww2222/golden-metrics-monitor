<template>
  <div class="rules-page">
    <!-- Filter Card -->
    <a-card class="filter-card">
      <a-form layout="inline" :model="filterForm">
        <a-row :gutter="12" style="width: 100%">
          <a-col :span="6">
            <a-form-item label="网元类型">
              <a-select v-model:value="filterForm.ne_type" placeholder="请选择" allowClear>
                <a-select-option v-for="t in neTypeList" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="规则状态">
              <a-select v-model:value="filterForm.status" placeholder="全部" allowClear>
                <a-select-option :value="1">启用</a-select-option>
                <a-select-option :value="0">停用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="规则名称">
              <a-input v-model:value="filterForm.rule_name" placeholder="搜索规则名称" allowClear />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="应用场景">
              <a-select v-model:value="filterForm.scene" placeholder="全部" allowClear mode="multiple" maxTagCount="1">
                <a-select-option value="fault_dispatch">故障派单</a-select-option>
                <a-select-option value="biz_monitor">业务受损监控</a-select-option>
                <a-select-option value="auto_remediation">动网自动化</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="告警等级">
              <a-select v-model:value="filterForm.severity" placeholder="全部" allowClear>
                <a-select-option :value="1">1级 - 紧急</a-select-option>
                <a-select-option :value="2">2级 - 严重</a-select-option>
                <a-select-option :value="3">3级 - 一般</a-select-option>
                <a-select-option :value="4">4级 - 提示</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12" style="width: 100%">
          <a-col :span="6" style="text-align: right">
            <a-button type="primary" @click="loadRules">查询</a-button>
            <a-button style="margin-left: 8px" @click="resetFilter">重置</a-button>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- Table Card -->
    <a-card class="table-card" style="margin-top: 12px">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <a-button @click="batchEnable" :disabled="!hasSelected">批量启用</a-button>
          <a-button @click="batchDisable" :disabled="!hasSelected" style="margin-left: 8px">批量停用</a-button>
          <a-button danger @click="batchDelete" :disabled="!hasSelected" style="margin-left: 8px">批量删除</a-button>
        </div>
        <div class="toolbar-right">
          <a-button type="primary" @click="openCreateModal">自定义创建</a-button>
          <a-button @click="openTemplateModal" style="margin-left: 8px">📋 从模板创建</a-button>
        </div>
      </div>

      <a-table
        :columns="columns"
        :dataSource="ruleList"
        :rowSelection="{ selectedRowKeys, onChange: onSelectChange }"
        rowKey="rule_id"
        :pagination="pagination"
        @change="onTableChange"
        :loading="loading"
        bordered
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'scene'">
            <a-tag v-for="s in (record.scene || [])" :key="s" :color="sceneColorMap[s]" style="margin-bottom: 2px">{{ sceneLabelMap[s] || s }}</a-tag>
            <span v-if="!record.scene?.length" style="color: #bfbfbf">—</span>
          </template>
          <template v-if="column.key === 'conditions'">
            <span v-for="(c, i) in record.conditions" :key="i">
              {{ c.metric_name }} {{ thresholdTypeMap[c.threshold_type] }} {{ c.operator }}{{ c.threshold_value }}{{ c.metric_unit === 'percent' ? '%' : '' }}
              <span v-if="i < record.conditions.length - 1"> {{ record.logic_operator }} </span>
            </span>
          </template>
          <template v-if="column.key === 'status'">
            <a-badge :color="record.status === 1 ? '#52c41a' : '#8c8c8c'" :text="record.status === 1 ? '启用' : '停用'" />
          </template>
          <template v-if="column.key === 'severity'">
            <a-tag :color="severityColor(record.severity)">{{ severityLabel(record.severity) }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
            <a-divider type="vertical" />
            <a-popconfirm title="确定删除此规则？" @confirm="handleDelete(record.rule_id)">
              <a-button type="link" size="small" danger>删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Create/Edit Modal -->
    <RuleFormModal
      v-model:open="formModalVisible"
      :editData="editingRule"
      @saved="loadRules"
    />

    <!-- Template Modal -->
    <TemplateModal v-model:open="templateModalVisible" @create="onTemplateCreate" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { getRules, deleteRule, batchUpdateStatus, batchDeleteRules } from '@/api/rules';
import { getNeTypes } from '@/api/common';
import RuleFormModal from './RuleFormModal.vue';
import TemplateModal from './TemplateModal.vue';

const route = useRoute();
const loading = ref(false);
const ruleList = ref<any[]>([]);
const neTypeList = ref<any[]>([]);
const selectedRowKeys = ref<number[]>([]);
const formModalVisible = ref(false);
const templateModalVisible = ref(false);
const editingRule = ref<any>(null);

const filterForm = reactive({
  ne_type: undefined as string | undefined,
  status: undefined as number | undefined,
  rule_name: '',
  scene: [] as string[],
  severity: undefined as number | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
});

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const thresholdTypeMap: Record<string, string> = { absolute: '绝对值', qoq: '环比', yoy: '同比' };
const sceneLabelMap: Record<string, string> = { fault_dispatch: '故障派单', biz_monitor: '业务受损监控', auto_remediation: '动网自动化' };
const sceneColorMap: Record<string, string> = { fault_dispatch: 'red', biz_monitor: 'orange', auto_remediation: 'blue' };

const columns = [
  { title: '规则名称', dataIndex: 'rule_name', key: 'rule_name', width: 200, ellipsis: true },
  { title: '网元类型', dataIndex: 'ne_type', key: 'ne_type', width: 100 },
  { title: '应用场景', key: 'scene', width: 180 },
  { title: '条件', key: 'conditions', width: 280 },
  { title: '等级', key: 'severity', width: 90 },
  { title: '触发窗口', dataIndex: 'observe_window', key: 'observe_window', width: 90, customRender: ({ text }: any) => `${text}点` },
  { title: '状态', key: 'status', width: 80 },
  { title: '更新时间', dataIndex: 'updated_at', key: 'updated_at', width: 160 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' },
];

function severityColor(s: number) {
  return ['', 'red', 'orange', 'gold', 'blue'][s] || 'blue';
}
function severityLabel(s: number) {
  return ['', '1级-紧急', '2级-严重', '3级-一般', '4级-提示'][s] || '';
}

onMounted(() => {
  loadNeTypes();
  loadRules();
  // Handle route query: auto-open edit modal when navigating from monitor page
  const ruleId = route.query.rule_id;
  if (ruleId) {
    // Find the rule and open edit modal
    setTimeout(() => {
      const rule = ruleList.value.find((r: any) => r.rule_id === Number(ruleId));
      if (rule) openEditModal(rule);
    }, 1000);
  }
});

async function loadNeTypes() {
  try {
    const res: any = await getNeTypes();
    neTypeList.value = res || [];
  } catch {}
}

async function loadRules() {
  loading.value = true;
  try {
    const res: any = await getRules({
      ne_type: filterForm.ne_type,
      status: filterForm.status,
      rule_name: filterForm.rule_name || undefined,
      scene: filterForm.scene.length ? filterForm.scene.join(',') : undefined,
      severity: filterForm.severity,
      page: pagination.current,
      page_size: pagination.pageSize,
    });
    ruleList.value = res.list || [];
    pagination.total = res.total || 0;
  } catch {} finally {
    loading.value = false;
  }
}

function resetFilter() {
  filterForm.ne_type = undefined;
  filterForm.status = undefined;
  filterForm.rule_name = '';
  filterForm.scene = [];
  filterForm.severity = undefined;
  pagination.current = 1;
  loadRules();
}

function onTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadRules();
}

function onSelectChange(keys: number[]) {
  selectedRowKeys.value = keys;
}

function openCreateModal() {
  editingRule.value = null;
  formModalVisible.value = true;
}

function openEditModal(record: any) {
  editingRule.value = { ...record };
  formModalVisible.value = true;
}

function openTemplateModal() {
  templateModalVisible.value = true;
}

function onTemplateCreate() {
  templateModalVisible.value = false;
  loadRules();
}

async function handleDelete(ruleId: number) {
  try {
    await deleteRule(ruleId);
    message.success('删除成功');
    loadRules();
  } catch {}
}

async function batchEnable() {
  try {
    await batchUpdateStatus({ rule_ids: selectedRowKeys.value, status: 1 });
    message.success('批量启用成功');
    selectedRowKeys.value = [];
    loadRules();
  } catch {}
}

async function batchDisable() {
  try {
    await batchUpdateStatus({ rule_ids: selectedRowKeys.value, status: 0 });
    message.success('批量停用成功');
    selectedRowKeys.value = [];
    loadRules();
  } catch {}
}

async function batchDelete() {
  try {
    await batchDeleteRules({ rule_ids: selectedRowKeys.value });
    message.success('批量删除成功');
    selectedRowKeys.value = [];
    loadRules();
  } catch {}
}
</script>

<style lang="less" scoped>
.rules-page {
  .filter-card, .table-card {
    :deep(.ant-card-body) {
      padding: 16px;
    }
  }
  .table-toolbar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    .toolbar-right {
      display: flex;
    }
  }
}
</style>
