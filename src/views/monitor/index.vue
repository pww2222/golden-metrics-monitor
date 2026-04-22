<template>
  <div class="monitor-page">
    <!-- Filter Card -->
    <a-card class="filter-card">
      <a-form layout="inline" :model="filterForm">
        <a-row :gutter="12" style="width: 100%">
          <a-col :span="6">
            <a-form-item label="省份">
              <a-select v-model:value="filterForm.province_code" placeholder="请选择" allowClear>
                <a-select-option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="专业">
              <a-select v-model:value="filterForm.major" placeholder="请选择" allowClear>
                <a-select-option v-for="m in majors" :key="m.code" :value="m.code">{{ m.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="类型">
              <a-select v-model:value="filterForm.ne_type" placeholder="请选择" allowClear>
                <a-select-option v-for="t in neTypes" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="厂商">
              <a-select v-model:value="filterForm.vendor" placeholder="请选择" allowClear>
                <a-select-option v-for="v in vendors" :key="v.code" :value="v.code">{{ v.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12" style="width: 100%">
          <a-col :span="6">
            <a-form-item label="网元">
              <a-input v-model:value="filterForm.ne_name" placeholder="搜索网元名称" allowClear />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="告警等级">
              <a-select v-model:value="filterForm.severity" placeholder="全部" allowClear mode="multiple">
                <a-select-option :value="1">🔴 1级-紧急</a-select-option>
                <a-select-option :value="2">🟠 2级-严重</a-select-option>
                <a-select-option :value="3">🟡 3级-一般</a-select-option>
                <a-select-option :value="4">🔵 4级-提示</a-select-option>
              </a-select>
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
            <a-form-item label="更新时间">
              <a-select v-model:value="timeRange" @change="loadAlarms">
                <a-select-option value="1h">最近1小时</a-select-option>
                <a-select-option value="6h">最近6小时</a-select-option>
                <a-select-option value="24h">最近24小时</a-select-option>
                <a-select-option value="7d">最近7天</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6" style="text-align: right">
            <a-button type="primary" @click="handleSearch">查询</a-button>
            <a-button style="margin-left: 8px" @click="resetFilter">重置</a-button>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- Severity Summary Cards -->
    <a-row :gutter="12" style="margin-top: 12px">
      <a-col :span="6" v-for="s in severityCards" :key="s.level">
        <a-card class="severity-card" :style="{ borderLeft: `3px solid ${s.color}` }">
          <a-statistic :title="s.label" :value="severitySummary[String(s.level)] || 0" :value-style="{ color: s.color }" />
        </a-card>
      </a-col>
    </a-row>

    <!-- Table Card -->
    <a-card class="table-card" style="margin-top: 12px">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <a-radio-group v-model:value="viewMode" button-style="solid" @change="onViewModeChange" size="small">
            <a-radio-button value="list">列表视图</a-radio-button>
            <a-radio-button value="aggregate">聚合视图</a-radio-button>
          </a-radio-group>
          <template v-if="viewMode === 'list'">
            <a-button @click="batchConfirm" :disabled="!hasSelected" style="margin-left: 12px">批量确认</a-button>
            <a-button @click="openBatchTransfer" :disabled="!hasSelected" style="margin-left: 8px">批量转派</a-button>
            <a-button @click="batchMarkFalseAlarm" :disabled="!hasSelected" style="margin-left: 8px">标记误报</a-button>
          </template>
        </div>
        <div class="toolbar-right">
          <a-button @click="handleExport">📥 导出</a-button>
        </div>
      </div>

      <!-- 列表视图 -->
      <a-table
        v-if="viewMode === 'list'"
        :columns="columns"
        :dataSource="alarmList"
        :rowSelection="{ selectedRowKeys, onChange: onSelectChange }"
        rowKey="event_id"
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
          <template v-if="column.key === 'severity'">
            <a-tag :color="severityColor(record.severity)">{{ severityLabel(record.severity) }}</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-badge :status="statusBadge(record.status)" :text="statusLabel(record.status)" />
          </template>
          <template v-if="column.key === 'updated_at'">
            {{ record.updated_at?.slice(5, 16) }}
            <div v-if="record.duration_minutes" style="font-size: 12px; color: #8c8c8c">{{ record.duration_minutes }}min</div>
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetail(record)">详情</a-button>
          </template>
        </template>
      </a-table>

      <!-- 聚合视图 -->
      <a-table
        v-if="viewMode === 'aggregate'"
        :columns="aggColumns"
        :dataSource="aggregatedList"
        :expandable="{ defaultExpandAllRows: false }"
        rowKey="key"
        :pagination="false"
        :loading="aggLoading"
        bordered
        size="middle"
        class="agg-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'ne_name'">
            <span v-if="record.is_pool" class="pool-label">🔗 {{ record.ne_name }}</span>
            <span v-else-if="record.event_id">{{ record.ne_name }}</span>
            <span v-else>{{ record.ne_name }}</span>
          </template>
          <template v-if="column.key === 'event_title'">
            <span v-if="record.event_title">{{ record.event_title }}</span>
            <span v-else style="color: #bfbfbf">—</span>
          </template>
          <template v-if="column.key === 'alarm_count'">
            <span v-if="record.alarm_count" class="alarm-count-badge">{{ record.alarm_count }}</span>
            <span v-else style="color: #bfbfbf">—</span>
          </template>
          <template v-if="column.key === 'severity'">
            <a-tag :color="severityColor(record.severity)">{{ severityLabel(record.severity) }}</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-badge v-if="record.status" :status="statusBadge(record.status)" :text="statusLabel(record.status)" />
            <span v-else style="color: #bfbfbf">—</span>
          </template>
          <template v-if="column.key === 'latest_time'">
            <span v-if="record.latest_time">{{ record.latest_time?.slice(5, 16) }}</span>
            <span v-else-if="record.updated_at">{{ record.updated_at?.slice(5, 16) }}</span>
            <span v-else style="color: #bfbfbf">—</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-button v-if="record.event_id" type="link" size="small" @click="openDetail(record)">详情</a-button>
            <span v-else style="color: #bfbfbf">—</span>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Detail Drawer -->
    <a-drawer :open="detailVisible" :width="480" :title="'告警事件详情'" @close="detailVisible = false" :destroyOnClose="true">
      <template v-if="currentAlarm">
        <div class="detail-header">
          <span :class="'severity-badge-' + currentAlarm.severity" class="severity-icon"></span>
          <span :class="'severity-' + currentAlarm.severity" style="font-weight: 600">{{ severityLabel(currentAlarm.severity) }}</span>
          <span style="margin-left: 8px">{{ currentAlarm.event_title }}</span>
        </div>

        <a-descriptions :column="1" size="small" bordered style="margin-top: 16px">
          <a-descriptions-item label="网元ID">{{ currentAlarm.ne_id }}</a-descriptions-item>
          <a-descriptions-item label="网元名称">{{ currentAlarm.ne_name }}</a-descriptions-item>
          <a-descriptions-item label="网元类型">{{ currentAlarm.ne_type }}</a-descriptions-item>
          <a-descriptions-item label="业务类型">{{ currentAlarm.biz_type }}</a-descriptions-item>
          <a-descriptions-item label="省份">{{ currentAlarm.province_name }}</a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ currentAlarm.started_at }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ currentAlarm.updated_at }}</a-descriptions-item>
          <a-descriptions-item label="异常持续">{{ currentAlarm.duration_minutes }}分钟</a-descriptions-item>
          <a-descriptions-item label="维护人员">{{ currentAlarm.handler || '—' }}</a-descriptions-item>
        </a-descriptions>

        <a-divider>告警指标趋势</a-divider>
        <div ref="detailChartRef" class="detail-chart"></div>
        <a-button type="link" @click="goToReport" style="padding: 0; margin-top: 4px">在报表页查看 →</a-button>

        <a-divider>触发规则</a-divider>
        <div v-if="currentAlarm.rule" class="rule-info">
          <div><b>规则:</b> {{ currentAlarm.rule.rule_name }}</div>
          <div v-for="(c, i) in currentAlarm.rule.conditions" :key="i">
            <b>条件:</b> {{ c.metric_name }} {{ thresholdTypeMap[c.threshold_type] }} {{ c.operator }}{{ c.threshold_value }}
          </div>
          <div><b>窗口:</b> 连续{{ currentAlarm.rule.observe_window }}个采集点</div>
          <div><b>触发值:</b> {{ currentAlarm.trigger_value }} (阈值{{ currentAlarm.trigger_threshold }})</div>
          <a-button type="link" size="small" @click="goToRule" style="padding:0;margin-top:4px">查看/编辑规则 →</a-button>
        </div>

        <a-divider v-if="currentAlarm.related_alarms?.length">关联告警 ({{ currentAlarm.related_alarms.length }}条)</a-divider>
        <div v-if="currentAlarm.related_alarms?.length" class="related-alarms">
          <div v-for="ra in currentAlarm.related_alarms" :key="ra.event_id" class="related-item">
            <span :class="'severity-badge-' + ra.severity" class="severity-dot"></span>
            {{ ra.ne_name }} {{ ra.event_title }} {{ severityLabel(ra.severity) }}
          </div>
        </div>

        <a-divider v-if="currentAlarm.sop_template">处置建议</a-divider>
        <div v-if="currentAlarm.sop_template" class="sop-content" v-html="currentAlarm.sop_template.replace(/\n/g, '<br/>')"></div>

        <a-divider />

        <a-form layout="vertical">
          <a-form-item label="处理说明" required>
            <a-textarea v-model:value="handleNote" placeholder="请输入处理说明..." :rows="3" />
          </a-form-item>
        </a-form>

        <div class="detail-actions">
          <a-button type="primary" @click="confirmCurrentAlarm" :disabled="currentAlarm.status !== 'pending'">确认告警</a-button>
          <a-button @click="markCurrentFalseAlarm" :disabled="currentAlarm.status !== 'pending'" style="margin-left: 8px">标记误报</a-button>
          <a-button @click="openTransferModal" style="margin-left: 8px">转派给...</a-button>
          <a-button @click="escalateCurrentAlarm" :disabled="currentAlarm.severity <= 1" style="margin-left: 8px">升级</a-button>
          <a-button @click="closeCurrentAlarm" :disabled="!['confirmed', 'processing'].includes(currentAlarm.status)" style="margin-left: 8px">关闭</a-button>
        </div>
      </template>
    </a-drawer>

    <!-- Transfer Modal -->
    <a-modal v-model:open="transferVisible" title="转派告警" @ok="handleTransfer" :destroyOnClose="true">
      <a-form layout="vertical">
        <a-form-item label="目标处理人" required>
          <a-select v-model:value="transferTo" placeholder="请选择" showSearch :filterOption="filterOperator">
            <a-select-option v-for="op in operators" :key="op.user_id" :value="op.user_id">{{ op.display_name }} ({{ op.role }})</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="转派说明" required>
          <a-textarea v-model:value="transferNote" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import {
  getAlarms, getAlarmDetail, confirmAlarm, markFalseAlarm,
  transferAlarm, escalateAlarm, closeAlarm,
  batchConfirmAlarms, batchTransferAlarms, batchFalseAlarm,
  getAlarmsAggregated,
} from '@/api/alarms';
import { getFilterOptions, getOperators } from '@/api/common';
import { createExport } from '@/api/export';

const router = useRouter();
const loading = ref(false);
const timeRange = ref('24h');
const viewMode = ref<'list' | 'aggregate'>('list');
const alarmList = ref<any[]>([]);
const aggregatedList = ref<any[]>([]);
const aggLoading = ref(false);
const selectedRowKeys = ref<number[]>([]);
const severitySummary = ref<Record<string, number>>({});
const detailVisible = ref(false);
const currentAlarm = ref<any>(null);
const handleNote = ref('');
const transferVisible = ref(false);
const transferTo = ref('');
const transferNote = ref('');
const operators = ref<any[]>([]);
const isBatchTransfer = ref(false);
const detailChartRef = ref<HTMLElement>();
let detailChart: echarts.ECharts | null = null;

const provinces = ref<any[]>([]);
const majors = ref<any[]>([]);
const neTypes = ref<any[]>([]);
const vendors = ref<any[]>([]);

const filterForm = reactive({
  province_code: '' as string,
  major: '' as string,
  ne_type: '' as string,
  vendor: '' as string,
  ne_name: '' as string,
  severity: [] as number[],
  scene: [] as string[],
});

const pagination = reactive({ current: 1, pageSize: 20, total: 0, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` });

const thresholdTypeMap: Record<string, string> = { absolute: '绝对值', qoq: '环比', yoy: '同比' };
const sceneLabelMap: Record<string, string> = { fault_dispatch: '故障派单', biz_monitor: '业务受损监控', auto_remediation: '动网自动化' };
const sceneColorMap: Record<string, string> = { fault_dispatch: 'red', biz_monitor: 'orange', auto_remediation: 'blue' };

const severityCards = [
  { level: 1, label: '1级-紧急', color: '#ff4d4f' },
  { level: 2, label: '2级-严重', color: '#faad14' },
  { level: 3, label: '3级-一般', color: '#faad14' },
  { level: 4, label: '4级-提示', color: '#1677ff' },
];

const columns = [
  { title: '网元名称', dataIndex: 'ne_name', key: 'ne_name', width: 140 },
  { title: '类型', dataIndex: 'ne_type', key: 'ne_type', width: 80 },
  { title: '省份', dataIndex: 'province_name', key: 'province_name', width: 80 },
  { title: '事件标题', dataIndex: 'event_title', key: 'event_title', width: 180, ellipsis: true },
  { title: '应用场景', key: 'scene', width: 180 },
  { title: '等级', key: 'severity', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '更新时间', key: 'updated_at', width: 120 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
];

const aggColumns = [
  { title: '网元/聚合', dataIndex: 'ne_name', key: 'ne_name', width: 180 },
  { title: '告警标题', dataIndex: 'event_title', key: 'event_title', width: 220, ellipsis: true },
  { title: '告警数', key: 'alarm_count', width: 80, align: 'center' as const },
  { title: '等级', key: 'severity', width: 100 },
  { title: '状态', key: 'status', width: 90 },
  { title: '最新时间', key: 'latest_time', width: 130 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' as const },
];

const hasSelected = ref(false);
watch(selectedRowKeys, (v) => { hasSelected.value = v.length > 0; });

function severityColor(s: number) { return ['', 'red', 'orange', 'gold', 'blue'][s] || 'blue'; }
function severityLabel(s: number) { return ['', '1级-紧急', '2级-严重', '3级-一般', '4级-提示'][s] || ''; }
function statusBadge(s: string) { return { pending: 'error', confirmed: 'warning', processing: 'processing', resolved: 'success', closed: 'default', false_alarm: 'default' }[s] || 'default'; }
function statusLabel(s: string) { return { pending: '待处理', confirmed: '已确认', processing: '处理中', resolved: '已恢复', closed: '已关闭', false_alarm: '误报' }[s] || s; }
function filterOperator(input: string, option: any) { return option.children?.[0]?.children?.toLowerCase().includes(input.toLowerCase()); }

function getTimeParams() {
  const now = dayjs();
  const map: Record<string, [string, string]> = {
    '1h': [now.subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'), now.format('YYYY-MM-DD HH:mm:ss')],
    '6h': [now.subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'), now.format('YYYY-MM-DD HH:mm:ss')],
    '24h': [now.subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ss'), now.format('YYYY-MM-DD HH:mm:ss')],
    '7d': [now.subtract(7, 'day').format('YYYY-MM-DD HH:mm:ss'), now.format('YYYY-MM-DD HH:mm:ss')],
  };
  return map[timeRange.value] || map['24h'];
}

onMounted(async () => {
  await loadFilterOptions();
  await loadAlarms();
});

function onViewModeChange() {
  if (viewMode.value === 'aggregate') {
    loadAggregatedAlarms();
  } else {
    loadAlarms();
  }
}

async function loadAggregatedAlarms() {
  aggLoading.value = true;
  try {
    const [startTime, endTime] = getTimeParams();
    const params: any = {
      province_code: filterForm.province_code || undefined,
      major: filterForm.major || undefined,
      ne_type: filterForm.ne_type || undefined,
      vendor: filterForm.vendor || undefined,
      ne_name: filterForm.ne_name || undefined,
      severity: filterForm.severity.length ? filterForm.severity.join(',') : undefined,
      scene: filterForm.scene.length ? filterForm.scene.join(',') : undefined,
      start_time: startTime,
      end_time: endTime,
    };
    const res: any = await getAlarmsAggregated(params);
    aggregatedList.value = res.list || [];
    severitySummary.value = res.severity_summary || {};
  } catch {} finally {
    aggLoading.value = false;
  }
}

async function loadFilterOptions() {
  try {
    const res: any = await getFilterOptions({ province_code: filterForm.province_code, major: filterForm.major, ne_type: filterForm.ne_type });
    provinces.value = res.provinces || [];
    majors.value = res.majors || [];
    neTypes.value = res.ne_types || [];
    vendors.value = res.vendors || [];
  } catch {}
}

async function loadAlarms() {
  loading.value = true;
  try {
    const [startTime, endTime] = getTimeParams();
    const params: any = {
      province_code: filterForm.province_code || undefined,
      major: filterForm.major || undefined,
      ne_type: filterForm.ne_type || undefined,
      vendor: filterForm.vendor || undefined,
      ne_name: filterForm.ne_name || undefined,
      severity: filterForm.severity.length ? filterForm.severity.join(',') : undefined,
      scene: filterForm.scene.length ? filterForm.scene.join(',') : undefined,
      start_time: startTime,
      end_time: endTime,
      page: pagination.current,
      page_size: pagination.pageSize,
    };
    const res: any = await getAlarms(params);
    alarmList.value = res.list || [];
    pagination.total = res.total || 0;
    severitySummary.value = res.severity_summary || {};
  } catch {} finally {
    loading.value = false;
  }
}

function resetFilter() {
  Object.assign(filterForm, { province_code: '', major: '', ne_type: '', vendor: '', ne_name: '', severity: [], scene: [] });
  timeRange.value = '24h';
  pagination.current = 1;
  if (viewMode.value === 'aggregate') {
    loadAggregatedAlarms();
  } else {
    loadAlarms();
  }
}

function handleSearch() {
  if (viewMode.value === 'aggregate') {
    loadAggregatedAlarms();
  } else {
    loadAlarms();
  }
}

function onTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadAlarms();
}

function onSelectChange(keys: number[]) { selectedRowKeys.value = keys; }

async function openDetail(record: any) {
  try {
    const res: any = await getAlarmDetail(record.event_id);
    currentAlarm.value = res;
    handleNote.value = '';
    detailVisible.value = true;
    await nextTick();
    renderDetailChart();
  } catch {}
}

function renderDetailChart() {
  if (!detailChartRef.value) return;
  detailChart?.dispose();
  detailChart = echarts.init(detailChartRef.value);
  const alarm = currentAlarm.value;
  if (!alarm) return;

  // Generate simulated trend data around the alarm event
  const triggerVal = alarm.trigger_value || 87.3;
  const thresholdVal = alarm.trigger_threshold || 95;
  const baseVal = alarm.rule?.conditions?.[0]?.threshold_type === 'qoq' ? 98.5 : 98;
  const points = 60; // 60 minutes
  const now = new Date(alarm.started_at || Date.now());
  const times: string[] = [];
  const values: number[] = [];
  const alarmZone: any[] = [];
  let inAlarm = false;

  for (let i = 0; i < points; i++) {
    const t = new Date(now.getTime() - (points - 1 - i) * 60000);
    times.push(t.toISOString().slice(11, 16));
    let v: number;
    if (i >= 40 && i <= 50) {
      // Alarm zone
      v = triggerVal + (Math.random() - 0.5) * 3;
      if (!inAlarm) { alarmZone.push([{ xAxis: i }]); inAlarm = true; }
    } else {
      v = baseVal + (Math.random() - 0.5) * 2;
      if (inAlarm) { alarmZone[alarmZone.length - 1].push({ xAxis: i - 1 }); inAlarm = false; }
    }
    values.push(Math.round(v * 100) / 100);
  }
  if (inAlarm && alarmZone.length) alarmZone[alarmZone.length - 1].push({ xAxis: points - 1 });

  detailChart.setOption({
    grid: { top: 10, right: 10, bottom: 20, left: 45 },
    xAxis: { type: 'category', data: times, axisLabel: { fontSize: 9, interval: 9 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { type: 'dashed' } }, min: (v: any) => Math.floor(v.min - 5) },
    series: [{
      type: 'line', data: values, smooth: true, symbol: 'none',
      lineStyle: { color: '#006be6', width: 2 },
      areaStyle: { color: 'rgba(0,107,230,0.05)' },
      markLine: { silent: true, symbol: 'none', data: [{ yAxis: thresholdVal, lineStyle: { color: '#ff4d4f', type: 'dashed', width: 1.5 }, label: { formatter: `阈值: ${thresholdVal}`, fontSize: 10, position: 'insideEndTop' } }] },
      markArea: { silent: true, data: alarmZone.length ? alarmZone : undefined, itemStyle: { color: 'rgba(255,77,79,0.1)' } },
    }],
    tooltip: { trigger: 'axis' },
  });
}

function goToReport() {
  if (currentAlarm.value) {
    router.push({ path: '/report', query: { ne_id: currentAlarm.value.ne_id, t: currentAlarm.value.started_at } });
  }
}

function goToRule() {
  if (currentAlarm.value?.rule?.rule_id) {
    router.push({ path: '/rules', query: { rule_id: currentAlarm.value.rule.rule_id } });
  }
}

async function confirmCurrentAlarm() {
  if (!handleNote.value || handleNote.value.length < 5) return message.warning('处理说明至少5个字');
  try {
    await confirmAlarm(currentAlarm.value.event_id, { handle_note: handleNote.value });
    message.success('确认成功');
    detailVisible.value = false;
    loadAlarms();
  } catch {}
}

async function markCurrentFalseAlarm() {
  if (!handleNote.value) return message.warning('请输入处理说明');
  try {
    await markFalseAlarm(currentAlarm.value.event_id, { handle_note: handleNote.value });
    message.success('已标记为误报');
    detailVisible.value = false;
    loadAlarms();
  } catch {}
}

function openTransferModal() {
  isBatchTransfer.value = false;
  transferTo.value = '';
  transferNote.value = '';
  loadOperators();
  transferVisible.value = true;
}

function openBatchTransfer() {
  isBatchTransfer.value = true;
  transferTo.value = '';
  transferNote.value = '';
  loadOperators();
  transferVisible.value = true;
}

async function loadOperators() {
  try {
    const res: any = await getOperators();
    operators.value = res || [];
  } catch {}
}

async function handleTransfer() {
  if (!transferTo.value) return message.warning('请选择目标处理人');
  if (!transferNote.value) return message.warning('请输入转派说明');
  try {
    if (isBatchTransfer.value) {
      await batchTransferAlarms({ event_ids: selectedRowKeys.value, transfer_to: transferTo.value, handle_note: transferNote.value });
      message.success('批量转派成功');
      selectedRowKeys.value = [];
    } else {
      await transferAlarm(currentAlarm.value.event_id, { transfer_to: transferTo.value, handle_note: transferNote.value });
      message.success('转派成功');
    }
    transferVisible.value = false;
    detailVisible.value = false;
    loadAlarms();
  } catch {}
}

async function escalateCurrentAlarm() {
  if (!handleNote.value) return message.warning('请输入升级说明');
  try {
    await escalateAlarm(currentAlarm.value.event_id, { handle_note: handleNote.value, target_severity: currentAlarm.value.severity - 1 });
    message.success('升级成功');
    detailVisible.value = false;
    loadAlarms();
  } catch {}
}

async function closeCurrentAlarm() {
  if (!handleNote.value) return message.warning('请输入处理说明');
  try {
    await closeAlarm(currentAlarm.value.event_id, { handle_note: handleNote.value });
    message.success('告警已关闭');
    detailVisible.value = false;
    loadAlarms();
  } catch {}
}

async function batchConfirm() {
  if (!handleNote.value) {
    handleNote.value = '批量确认';
  }
  try {
    await batchConfirmAlarms({ event_ids: selectedRowKeys.value, handle_note: handleNote.value });
    message.success('批量确认成功');
    selectedRowKeys.value = [];
    handleNote.value = '';
    loadAlarms();
  } catch {}
}

async function batchMarkFalseAlarm() {
  try {
    await batchFalseAlarm({ event_ids: selectedRowKeys.value, handle_note: '批量标记误报' });
    message.success('批量标记误报成功');
    selectedRowKeys.value = [];
    loadAlarms();
  } catch {}
}

async function handleExport() {
  try {
    const [startTime, endTime] = getTimeParams();
    await createExport({
      export_type: 'alarm_event',
      params: {
        province_code: filterForm.province_code || undefined,
        ne_type: filterForm.ne_type || undefined,
        severity: filterForm.severity.join(','),
        start_time: startTime,
        end_time: endTime,
      },
    });
    message.success('导出任务已创建');
  } catch {}
}
</script>

<style lang="less" scoped>
@import '@/styles/variables.less';

.monitor-page {
  .filter-card, .table-card {
    :deep(.ant-card-body) { padding: 16px; }
  }

  .severity-card {
    :deep(.ant-card-body) { padding: 12px 16px; }
  }

  .table-toolbar {
    display: flex; justify-content: space-between; margin-bottom: 12px;
    .toolbar-left { display: flex; }
    .toolbar-right { display: flex; }
  }

  .detail-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 16px;
    .severity-icon { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  }

  .detail-chart { height: 160px; width: 100%; }

  .rule-info {
    font-size: 13px; line-height: 1.8;
    b { color: @text-color; }
  }

  .related-alarms {
    .related-item {
      display: flex; align-items: center; gap: 6px; font-size: 13px; margin-bottom: 4px;
      .severity-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    }
  }

  .sop-content {
    font-size: 13px; line-height: 1.8; color: @text-color;
    background: #fafafa; padding: 8px 12px; border-radius: 6px;
  }

  .detail-actions {
    display: flex; flex-wrap: wrap; gap: 8px;
  }

  .agg-table {
    .pool-label {
      font-weight: 600;
      color: @primary-color;
    }

    .alarm-count-badge {
      display: inline-block;
      min-width: 22px;
      height: 22px;
      line-height: 22px;
      text-align: center;
      border-radius: 11px;
      background: #fff1f0;
      color: @alarm-1;
      font-size: 12px;
      font-weight: 600;
      padding: 0 6px;
    }

    :deep(.ant-table-expanded-row) {
      background: #fafbfc;
      td { padding: 6px 8px !important; }
    }

    :deep(.ant-table-row-level-1) {
      background: #fafbfc;
    }

    :deep(.ant-table-row-level-2) {
      background: #f5f7fa;
      font-size: 13px;
    }
  }
}
</style>
