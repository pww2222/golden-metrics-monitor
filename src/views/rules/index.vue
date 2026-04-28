<template>
  <div class="rules-page">
    <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
      <a-tab-pane key="normal" tab="告警规则" />
      <a-tab-pane key="agg" tab="聚合规则" />
    </a-tabs>

    <!-- 告警规则面板 -->
    <template v-if="activeTab === 'normal'">
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
              <a-form-item label="厂家">
                <a-select v-model:value="filterForm.vendor" placeholder="全部" allowClear>
                  <a-select-option value="huawei">华为</a-select-option>
                  <a-select-option value="zte">中兴</a-select-option>
                  <a-select-option value="ericsson">爱立信</a-select-option>
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
              <a-form-item label="告警等级">
                <a-select v-model:value="filterForm.severity" placeholder="全部" allowClear>
                  <a-select-option :value="1">1级-紧急</a-select-option>
                  <a-select-option :value="2">2级-严重</a-select-option>
                  <a-select-option :value="3">3级-一般</a-select-option>
                  <a-select-option :value="4">4级-提示</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="12" style="width: 100%">
            <a-col :span="6">
              <a-form-item label="应用场景">
                <a-select v-model:value="filterForm.scene" placeholder="全部" allowClear>
                  <a-select-option value="fault_dispatch">故障派单</a-select-option>
                  <a-select-option value="biz_monitor">业务受损监控</a-select-option>
                  <a-select-option value="auto_remediation">动网自动化</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="规则名称">
                <a-input v-model:value="filterForm.rule_name" placeholder="搜索规则名称" allowClear />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="创建人">
                <a-input v-model:value="filterForm.created_by" placeholder="搜索Falcomm账号" allowClear />
              </a-form-item>
            </a-col>
            <a-col :span="6" style="text-align: right">
              <a-button type="primary" @click="loadRules">查询</a-button>
              <a-button style="margin-left: 8px" @click="resetFilter">重置</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-card>
      <a-card class="table-card" style="margin-top: 12px">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <a-button @click="batchEnable" :disabled="!hasSelected">批量启用</a-button>
            <a-button @click="batchDisable" :disabled="!hasSelected" style="margin-left: 8px">批量停用</a-button>
            <a-button danger @click="batchDelete" :disabled="!hasSelected" style="margin-left: 8px">批量删除</a-button>
          </div>
          <div class="toolbar-right">
            <a-button type="primary" @click="openCreateModal">自定义创建</a-button>
            <a-button @click="openTemplateModal" style="margin-left: 8px">从模板创建</a-button>
          </div>
        </div>
        <a-table :columns="columns" :dataSource="ruleList" :rowSelection="{ selectedRowKeys, onChange: onSelectChange }" rowKey="rule_id" :pagination="pagination" @change="onTableChange" :loading="loading" bordered size="middle">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'scene'">
              <a-tag v-for="s in (record.scene || [])" :key="s" :color="sceneColorMap[s]">{{ sceneLabelMap[s] || s }}</a-tag>
              <span v-if="!record.scene?.length" style="color: #bfbfbf">—</span>
            </template>
            <template v-if="column.key === 'conditions'">
              <span v-for="(c, i) in record.conditions" :key="i">
                {{ c.metric_name }} {{ thresholdTypeMap[c.threshold_type] }} {{ operatorSymbolMap[c.operator] || c.operator }}{{ c.threshold_value }}{{ c.metric_unit === 'percent' ? '%' : '' }}
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
              <a-button type="link" size="small" @click="openViewModal(record)">查看</a-button>
              <a-divider type="vertical" />
              <template v-if="record.scene?.includes('fault_dispatch')">
                <a-tooltip title="故障派单规则不允许编辑">
                  <a-button type="link" size="small" disabled>编辑</a-button>
                </a-tooltip>
                <a-divider type="vertical" />
                <a-tooltip title="故障派单规则不允许删除">
                  <a-button type="link" size="small" danger disabled>删除</a-button>
                </a-tooltip>
              </template>
              <template v-else>
                <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
                <a-divider type="vertical" />
                <a-popconfirm title="确定删除此规则？" @confirm="handleDelete(record.rule_id)">
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </template>
              <a-divider type="vertical" />
              <a-button type="link" size="small" @click="handleCopy(record)">复制</a-button>
            </template>
          </template>
        </a-table>
      </a-card>
      <RuleFormModal v-model:open="formModalVisible" :editData="editingRule" :viewMode="false" @saved="loadRules" />
      <RuleFormModal v-model:open="viewModalVisible" :editData="viewingRule" :viewMode="true" :ruleList="ruleList" @navigate="onViewNavigate" />
      <TemplateModal v-model:open="templateModalVisible" @create="onTemplateCreate" />
    </template>

    <!-- 聚合规则面板 -->
    <template v-if="activeTab === 'agg'">
      <a-card class="filter-card">
        <a-form layout="inline" :model="aggFilterForm">
          <a-row :gutter="12" style="width: 100%">
            <a-col :span="6">
              <a-form-item label="网元类型">
                <a-select v-model:value="aggFilterForm.ne_type" placeholder="请选择" allowClear>
                  <a-select-option v-for="t in neTypeList" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="规则状态">
                <a-select v-model:value="aggFilterForm.status" placeholder="全部" allowClear>
                  <a-select-option :value="1">启用</a-select-option>
                  <a-select-option :value="0">停用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="规则名称">
                <a-input v-model:value="aggFilterForm.rule_name" placeholder="搜索" allowClear />
              </a-form-item>
            </a-col>
            <a-col :span="6" style="text-align: right">
              <a-button type="primary" @click="loadAggRules">查询</a-button>
              <a-button style="margin-left: 8px" @click="resetAggFilter">重置</a-button>
            </a-col>
          </a-row>
        </a-form>
      </a-card>
      <a-card class="table-card" style="margin-top: 12px">
        <div class="table-toolbar">
          <div class="toolbar-left">
            <a-button @click="batchAggEnable" :disabled="!aggHasSelected">批量启用</a-button>
            <a-button @click="batchAggDisable" :disabled="!aggHasSelected" style="margin-left: 8px">批量停用</a-button>
          </div>
          <div class="toolbar-right">
            <a-button type="primary" @click="openAggCreateModal">创建聚合规则</a-button>
          </div>
        </div>
        <a-table :columns="aggColumns" :dataSource="aggRuleList" :rowSelection="{ selectedRowKeys: aggSelectedKeys, onChange: onAggSelectChange }" rowKey="rule_id" :pagination="aggPagination" @change="onAggTableChange" :loading="aggLoading" bordered size="middle">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'agg_function'">
              <a-tag color="blue">{{ aggFuncLabel(record.agg_function) }}</a-tag>
            </template>
            <template v-if="column.key === 'baseline_type'">
              {{ baselineLabel(record.baseline_type) }}
            </template>
            <template v-if="column.key === 'threshold'">
              {{ record.operator }}{{ record.threshold_value }}{{ record.baseline_type === 'absolute' ? '' : '%' }}
            </template>
            <template v-if="column.key === 'status'">
              <a-badge :color="record.status === 1 ? '#52c41a' : '#8c8c8c'" :text="record.status === 1 ? '启用' : '停用'" />
            </template>
            <template v-if="column.key === 'severity'">
              <a-tag :color="severityColor(record.severity)">{{ severityLabel(record.severity) }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="openAggEditModal(record)">编辑</a-button>
              <a-divider type="vertical" />
              <a-popconfirm title="确定删除此聚合规则？" @confirm="handleAggDelete(record.rule_id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </template>
          </template>
        </a-table>
      </a-card>

      <!-- 聚合规则创建/编辑弹窗 -->
      <a-modal v-model:open="aggFormVisible" :title="editingAggRule ? '编辑聚合规则' : '创建聚合规则'" :width="640" @ok="handleAggSave" :confirmLoading="aggSaving" :destroyOnClose="true">
        <a-form :model="aggForm" layout="vertical">
          <a-row :gutter="16">
            <a-col :span="24">
              <a-form-item label="规则名称" required>
                <a-input v-model:value="aggForm.rule_name" placeholder="如：AMF注册态用户数聚合" :maxLength="50" showCount />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="网元类型" required>
                <a-select v-model:value="aggForm.ne_type" placeholder="请选择" @change="onAggNeTypeChange">
                  <a-select-option v-for="t in neTypeList" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="告警等级" required>
                <a-select v-model:value="aggForm.severity" placeholder="请选择">
                  <a-select-option :value="1">1级-紧急</a-select-option>
                  <a-select-option :value="2">2级-严重</a-select-option>
                  <a-select-option :value="3">3级-一般</a-select-option>
                  <a-select-option :value="4">4级-提示</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="指标" required>
                <a-select v-model:value="aggForm.metric_code" placeholder="请先选择网元类型" @change="onAggMetricChange">
                  <a-select-option v-for="m in aggMetricList" :key="m.metric_code" :value="m.metric_code">{{ m.metric_name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="聚合函数" required>
                <a-select v-model:value="aggForm.agg_function" placeholder="请选择">
                  <a-select-option value="sum">求和 (SUM)</a-select-option>
                  <a-select-option value="avg">均值 (AVG)</a-select-option>
                  <a-select-option value="max">最大 (MAX)</a-select-option>
                  <a-select-option value="min">最小 (MIN)</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="基线类型" required>
                <a-select v-model:value="aggForm.baseline_type" placeholder="请选择">
                  <a-select-option value="yesterday_same_period">昨日同期</a-select-option>
                  <a-select-option value="previous_normal_cycle">前一正常周期</a-select-option>
                  <a-select-option value="absolute">绝对阈值</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="运算符" required>
                <a-select v-model:value="aggForm.operator">
                  <a-select-option value="lt">&lt;</a-select-option>
                  <a-select-option value="lte">&lt;=</a-select-option>
                  <a-select-option value="gt">&gt;</a-select-option>
                  <a-select-option value="gte">&gt;=</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="阈值" required>
                <a-input-number v-model:value="aggForm.threshold_value" style="width: 100%" :step="0.1" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="观察窗口" required>
                <a-select v-model:value="aggForm.observe_window">
                  <a-select-option v-for="n in [1,2,3,5,10,15,30]" :key="n" :value="n">{{ n }}个采集点</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="保存后立即启用">
                <a-radio-group v-model:value="aggForm.status">
                  <a-radio :value="1">启用</a-radio>
                  <a-radio :value="0">停用</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-alert v-if="aggForm.baseline_type !== 'absolute'" type="info" show-icon style="margin-top: 8px">
            <template #message>百分比模式：阈值表示与基线相比的偏移百分比。如 -10 表示比基线低10%触发。</template>
          </a-alert>
        </a-form>
      </a-modal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { getRules, deleteRule, batchUpdateStatus, batchDeleteRules, copyRule } from '@/api/rules';
import { getAggRules, createAggRule, updateAggRule, deleteAggRule, batchUpdateAggRuleStatus } from '@/api/agg-rules';
import { getNeTypes, getMetricsByType } from '@/api/common';
import RuleFormModal from './RuleFormModal.vue';
import TemplateModal from './TemplateModal.vue';

const route = useRoute();
const activeTab = ref('normal');
const loading = ref(false);
const ruleList = ref<any[]>([]);
const neTypeList = ref<any[]>([]);
const selectedRowKeys = ref<number[]>([]);
const formModalVisible = ref(false);
const viewModalVisible = ref(false);
const templateModalVisible = ref(false);
const editingRule = ref<any>(null);
const viewingRule = ref<any>(null);

const filterForm = reactive({
  ne_type: undefined as string | undefined,
  vendor: undefined as string | undefined,
  status: undefined as number | undefined,
  severity: undefined as number | undefined,
  scene: undefined as string | undefined,
  rule_name: '',
  created_by: '',
});

const pagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const hasSelected = computed(() => selectedRowKeys.value.length > 0);

const thresholdTypeMap: Record<string, string> = { absolute: '绝对值', qoq: '环比', yoy: '同比' };
const operatorSymbolMap: Record<string, string> = { lt: '<', lte: '≤', gt: '>', gte: '≥', eq: '=', ne: '≠' };
const vendorLabelMap: Record<string, string> = { huawei: '华为', zte: '中兴', ericsson: '爱立信' };
const sceneLabelMap: Record<string, string> = { fault_dispatch: '故障派单', biz_monitor: '业务受损监控', auto_remediation: '动网自动化' };
const sceneColorMap: Record<string, string> = { fault_dispatch: 'red', biz_monitor: 'orange', auto_remediation: 'blue' };

const columns = [
  { title: '规则ID', dataIndex: 'rule_id', key: 'rule_id', width: 80 },
  { title: '规则名称', dataIndex: 'rule_name', key: 'rule_name', width: 180, ellipsis: true },
  { title: '厂家', dataIndex: 'vendor', key: 'vendor', width: 80, customRender: ({ text }: any) => vendorLabelMap[text] || text },
  { title: '网元类型', dataIndex: 'ne_type', key: 'ne_type', width: 90 },
  { title: '应用场景', key: 'scene', width: 180 },
  { title: '条件', key: 'conditions', width: 260 },
  { title: '等级', key: 'severity', width: 90 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建人', dataIndex: 'created_by', key: 'created_by', width: 90 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 150 },
  { title: '最新修改时间', dataIndex: 'updated_at', key: 'updated_at', width: 150 },
  { title: '操作', key: 'action', width: 240, fixed: 'right' },
];

// === 聚合规则 ===
const aggLoading = ref(false);
const aggSaving = ref(false);
const aggRuleList = ref<any[]>([]);
const aggSelectedKeys = ref<number[]>([]);
const aggFormVisible = ref(false);
const editingAggRule = ref<any>(null);
const aggMetricList = ref<any[]>([]);

const aggFilterForm = reactive({
  ne_type: undefined as string | undefined,
  status: undefined as number | undefined,
  rule_name: '',
});

const aggPagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true, showTotal: (total: number) => `共 ${total} 条` });
const aggHasSelected = computed(() => aggSelectedKeys.value.length > 0);

const aggColumns = [
  { title: '规则名称', dataIndex: 'rule_name', key: 'rule_name', width: 200, ellipsis: true },
  { title: '网元类型', dataIndex: 'ne_type', key: 'ne_type', width: 90 },
  { title: '指标', dataIndex: 'metric_name', key: 'metric_name', width: 130 },
  { title: '聚合函数', key: 'agg_function', width: 100 },
  { title: '基线类型', key: 'baseline_type', width: 120 },
  { title: '阈值', key: 'threshold', width: 100 },
  { title: '等级', key: 'severity', width: 90 },
  { title: '状态', key: 'status', width: 80 },
  { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
];

const defaultAggForm = () => ({
  rule_name: '',
  ne_type: '',
  metric_code: '',
  metric_name: '',
  agg_function: 'sum',
  baseline_type: 'yesterday_same_period',
  operator: 'lt',
  threshold_value: -10,
  observe_window: 3,
  severity: 2,
  status: 1,
});
const aggForm = reactive(defaultAggForm());

function severityColor(s: number) { return ['', 'red', 'orange', 'gold', 'blue'][s] || 'blue'; }
function severityLabel(s: number) { return ['', '1级-紧急', '2级-严重', '3级-一般', '4级-提示'][s] || ''; }
function aggFuncLabel(f: string) { return { sum: '求和', avg: '均值', max: '最大', min: '最小' }[f] || f; }
function baselineLabel(b: string) { return { yesterday_same_period: '昨日同期', previous_normal_cycle: '前一正常周期', absolute: '绝对阈值' }[b] || b; }

onMounted(() => {
  loadNeTypes();
  loadRules();
  const ruleId = route.query.rule_id;
  if (ruleId) {
    setTimeout(() => {
      const rule = ruleList.value.find((r: any) => r.rule_id === Number(ruleId));
      if (rule) openEditModal(rule);
    }, 1000);
  }
});

function onTabChange(key: string) {
  if (key === 'agg') loadAggRules();
}

async function loadNeTypes() {
  try { const res: any = await getNeTypes(); neTypeList.value = res || []; } catch {}
}

async function loadRules() {
  loading.value = true;
  try {
    const res: any = await getRules({
      ne_type: filterForm.ne_type, vendor: filterForm.vendor,
      status: filterForm.status, severity: filterForm.severity,
      scene: filterForm.scene,
      rule_name: filterForm.rule_name || undefined,
      created_by: filterForm.created_by || undefined,
      page: pagination.current, page_size: pagination.pageSize,
    });
    ruleList.value = res.list || []; pagination.total = res.total || 0;
  } catch {} finally { loading.value = false; }
}

function resetFilter() {
  Object.assign(filterForm, { ne_type: undefined, vendor: undefined, status: undefined, severity: undefined, scene: undefined, rule_name: '', created_by: '' });
  pagination.current = 1; loadRules();
}
function onTableChange(pag: any) { pagination.current = pag.current; pagination.pageSize = pag.pageSize; loadRules(); }
function onSelectChange(keys: number[]) { selectedRowKeys.value = keys; }
function openCreateModal() { editingRule.value = null; formModalVisible.value = true; }
function openEditModal(record: any) { editingRule.value = { ...record }; formModalVisible.value = true; }
function openViewModal(record: any) { viewingRule.value = { ...record }; viewModalVisible.value = true; }
function onViewNavigate(rule: any) { viewingRule.value = { ...rule }; }
function openTemplateModal() { templateModalVisible.value = true; }
function onTemplateCreate() { templateModalVisible.value = false; loadRules(); }
async function handleDelete(ruleId: number) { try { await deleteRule(ruleId); message.success('删除成功'); loadRules(); } catch {} }
async function handleCopy(record: any) {
  try {
    await copyRule(record.rule_id);
    message.success('复制成功，已生成草稿规则');
    loadRules();
  } catch {}
}
async function batchEnable() { try { await batchUpdateStatus({ rule_ids: selectedRowKeys.value, status: 1 }); message.success('批量启用成功'); selectedRowKeys.value = []; loadRules(); } catch {} }
async function batchDisable() { try { await batchUpdateStatus({ rule_ids: selectedRowKeys.value, status: 0 }); message.success('批量停用成功'); selectedRowKeys.value = []; loadRules(); } catch {} }
async function batchDelete() { try { await batchDeleteRules({ rule_ids: selectedRowKeys.value }); message.success('批量删除成功'); selectedRowKeys.value = []; loadRules(); } catch {} }

// === 聚合规则方法 ===
async function loadAggRules() {
  aggLoading.value = true;
  try {
    const res: any = await getAggRules({
      ne_type: aggFilterForm.ne_type, status: aggFilterForm.status,
      rule_name: aggFilterForm.rule_name || undefined,
      page: aggPagination.current, page_size: aggPagination.pageSize,
    });
    aggRuleList.value = res.list || []; aggPagination.total = res.total || 0;
  } catch {} finally { aggLoading.value = false; }
}

function resetAggFilter() {
  Object.assign(aggFilterForm, { ne_type: undefined, status: undefined, rule_name: '' });
  aggPagination.current = 1; loadAggRules();
}

function onAggTableChange(pag: any) { aggPagination.current = pag.current; aggPagination.pageSize = pag.pageSize; loadAggRules(); }
function onAggSelectChange(keys: number[]) { aggSelectedKeys.value = keys; }

async function onAggNeTypeChange(neType: string) {
  aggForm.metric_code = ''; aggForm.metric_name = ''; aggMetricList.value = [];
  if (neType) {
    try { const res: any = await getMetricsByType(neType); aggMetricList.value = res || []; } catch {}
  }
}

function onAggMetricChange(val: string) {
  const m = aggMetricList.value.find((item: any) => item.metric_code === val);
  if (m) aggForm.metric_name = m.metric_name;
}

function openAggCreateModal() {
  editingAggRule.value = null;
  Object.assign(aggForm, defaultAggForm());
  aggMetricList.value = [];
  aggFormVisible.value = true;
}

function openAggEditModal(record: any) {
  editingAggRule.value = { ...record };
  Object.assign(aggForm, {
    rule_name: record.rule_name, ne_type: record.ne_type,
    metric_code: record.metric_code, metric_name: record.metric_name,
    agg_function: record.agg_function, baseline_type: record.baseline_type,
    operator: record.operator, threshold_value: record.threshold_value,
    observe_window: record.observe_window, severity: record.severity, status: record.status,
  });
  onAggNeTypeChange(record.ne_type);
  aggFormVisible.value = true;
}

async function handleAggSave() {
  if (!aggForm.rule_name || !aggForm.ne_type || !aggForm.metric_code || !aggForm.agg_function || !aggForm.baseline_type || aggForm.threshold_value === undefined) {
    return message.warning('请填写必填项');
  }
  aggSaving.value = true;
  try {
    if (editingAggRule.value) {
      await updateAggRule(editingAggRule.value.rule_id, aggForm);
      message.success('修改成功');
    } else {
      await createAggRule(aggForm);
      message.success('创建成功');
    }
    aggFormVisible.value = false;
    loadAggRules();
  } catch {} finally { aggSaving.value = false; }
}

async function handleAggDelete(ruleId: number) { try { await deleteAggRule(ruleId); message.success('删除成功'); loadAggRules(); } catch {} }
async function batchAggEnable() { try { await batchUpdateAggRuleStatus({ rule_ids: aggSelectedKeys.value, status: 1 }); message.success('批量启用成功'); aggSelectedKeys.value = []; loadAggRules(); } catch {} }
async function batchAggDisable() { try { await batchUpdateAggRuleStatus({ rule_ids: aggSelectedKeys.value, status: 0 }); message.success('批量停用成功'); aggSelectedKeys.value = []; loadAggRules(); } catch {} }
</script>

<style lang="less" scoped>
.rules-page {
  :deep(.ant-tabs-nav) { margin-bottom: 0; }
  .filter-card, .table-card {
    :deep(.ant-card-body) { padding: 16px; }
  }
  .table-toolbar {
    display: flex; justify-content: space-between; margin-bottom: 12px;
    .toolbar-left { display: flex; }
    .toolbar-right { display: flex; }
  }
}
</style>
