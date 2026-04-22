<template>
  <div class="report-page">
    <!-- Summary Cards -->
    <a-row :gutter="12" class="summary-row">
      <a-col :span="6">
        <a-card class="summary-card alarm-card" @click="goToMonitor">
          <a-statistic title="告警网元" :value="summary.alarm_ne_count" :value-style="{ color: '#ff4d4f' }">
            <template #prefix><warning-outlined /></template>
          </a-statistic>
          <div class="card-footer">点击下钻</div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="summary-card normal-card">
          <a-statistic title="正常网元" :value="summary.normal_ne_count" :value-style="{ color: '#52c41a' }">
            <template #prefix><check-circle-outlined /></template>
          </a-statistic>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="summary-card top5-card">
          <div class="top5-title">最严重告警 TOP5</div>
          <div v-for="(item, i) in summary.top5_alarms" :key="i" class="top5-item">
            <span :class="'severity-badge-' + item.severity" class="severity-dot"></span>
            <span class="top5-name">{{ item.ne_name }}</span>
            <span class="top5-title-text">{{ item.event_title }}</span>
          </div>
          <a-empty v-if="!summary.top5_alarms?.length" description="暂无告警" />
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="summary-card trend-card">
          <div class="trend-title">近1小时异常趋势</div>
          <div ref="trendChartRef" class="trend-chart"></div>
        </a-card>
      </a-col>
    </a-row>

    <!-- Filter Card -->
    <a-card class="filter-card" style="margin-top: 12px">
      <a-form layout="inline" :model="filterForm">
        <a-row :gutter="12" style="width: 100%">
          <a-col :span="6">
            <a-form-item label="省份">
              <a-select v-model:value="filterForm.province_code" placeholder="请选择" allowClear @change="onFilterChange">
                <a-select-option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="专业">
              <a-select v-model:value="filterForm.major" placeholder="请选择" allowClear @change="onFilterChange">
                <a-select-option v-for="m in majors" :key="m.code" :value="m.code">{{ m.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="类型">
              <a-select v-model:value="filterForm.ne_type" placeholder="请选择" allowClear @change="onFilterChange">
                <a-select-option v-for="t in neTypes" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="厂商">
              <a-select v-model:value="filterForm.vendor" placeholder="请选择" allowClear @change="onFilterChange">
                <a-select-option v-for="v in vendors" :key="v.code" :value="v.code">{{ v.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12" style="width: 100%">
          <a-col :span="6">
            <a-form-item label="网元">
              <a-select v-model:value="filterForm.ne_ids" mode="multiple" placeholder="搜索网元名称/ID..." :filterOption="false" :maxCount="10" @search="onNeSearch">
                <a-select-option v-for="ne in neOptions" :key="ne.ne_id" :value="ne.ne_id">{{ ne.ne_name }} ({{ ne.ne_id }})</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="时间">
              <a-select v-model:value="timeRange" @change="onTimeRangeChange">
                <a-select-option value="1h">最近1小时</a-select-option>
                <a-select-option value="6h">最近6小时</a-select-option>
                <a-select-option value="24h">最近24小时</a-select-option>
                <a-select-option value="7d">最近7天</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="对比">
              <a-radio-group v-model:value="filterForm.compare_mode" @change="loadData">
                <a-radio value="same_province_type">同省同类型</a-radio>
                <a-radio value="same_pool">同Pool</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="6" style="text-align: right">
            <a-button type="primary" @click="loadData">查询</a-button>
            <a-button style="margin-left: 8px" @click="resetFilter">重置</a-button>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- Chart / Table Card -->
    <a-card class="table-card" style="margin-top: 12px">
      <div class="table-toolbar">
        <a-radio-group v-model:value="viewMode" button-style="solid">
          <a-radio-button value="chart">折线图</a-radio-button>
          <a-radio-button value="table">表格</a-radio-button>
        </a-radio-group>
        <a-button @click="handleExport" style="margin-left: 12px">📥 导出</a-button>
      </div>

      <!-- Chart View -->
      <div v-if="viewMode === 'chart'" ref="mainChartRef" class="main-chart"></div>

      <!-- Table View -->
      <a-table
        v-if="viewMode === 'table'"
        :columns="tableColumns"
        :dataSource="tableData"
        :pagination="tablePagination"
        @change="onTableChange"
        :loading="loading"
        bordered
        size="middle"
        rowKey="ne_id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'ne_name'">
            {{ record.ne_name }}
          </template>
          <template v-if="column.key?.startsWith('metric_')">
            <span :style="{ color: record[column.key]?.is_alarm ? '#ff4d4f' : '' }">
              {{ record[column.key]?.value ?? '-' }}{{ record[column.key]?.is_alarm ? ' ⚠' : '' }}
            </span>
          </template>
          <template v-if="column.key === 'alarm_status'">
            <a-badge :color="record.alarm_status === 'alarm' ? '#ff4d4f' : '#52c41a'" :text="record.alarm_status === 'alarm' ? '告警' : '正常'" />
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { queryMetrics, getMetricsSummary } from '@/api/metrics';
import { getFilterOptions, searchNe } from '@/api/common';
import { createExport } from '@/api/export';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const viewMode = ref('chart');
const timeRange = ref('24h');

const trendChartRef = ref<HTMLElement>();
const mainChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let mainChart: echarts.ECharts | null = null;

const summary = ref<any>({ alarm_ne_count: 0, normal_ne_count: 0, top5_alarms: [], anomaly_trend: [] });
const filterForm = reactive({
  province_code: '' as string,
  major: '' as string,
  ne_type: '' as string,
  vendor: '' as string,
  ne_ids: [] as string[],
  compare_mode: 'same_province_type' as string,
});

const provinces = ref<any[]>([]);
const majors = ref<any[]>([]);
const neTypes = ref<any[]>([]);
const vendors = ref<any[]>([]);
const neOptions = ref<any[]>([]);

const chartData = ref<any>(null);
const tableData = ref<any[]>([]);
const tableColumns = ref<any[]>([]);
const tablePagination = reactive({ current: 1, pageSize: 50, total: 0, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` });

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
  await loadSummary();
  // Handle route query params for cross-page navigation (monitor → report)
  const query = route.query;
  if (query.ne_id) {
    filterForm.ne_ids = [query.ne_id as string];
  }
  if (query.t) {
    timeRange.value = '24h'; // default to 24h window around the event
  }
  await loadData();
  await nextTick();
  initCharts();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  trendChart?.dispose();
  mainChart?.dispose();
  window.removeEventListener('resize', handleResize);
});

function handleResize() {
  trendChart?.resize();
  mainChart?.resize();
}

function initCharts() {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    renderTrendChart();
  }
  if (mainChartRef.value) {
    mainChart = echarts.init(mainChartRef.value);
  }
}

function renderTrendChart() {
  if (!trendChart || !summary.value.anomaly_trend?.length) return;
  const data = summary.value.anomaly_trend;
  trendChart.setOption({
    grid: { top: 10, right: 10, bottom: 20, left: 30 },
    xAxis: { type: 'category', data: data.map((d: any) => d.time?.slice(11, 16) || ''), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10 }, splitLine: { lineStyle: { type: 'dashed' } } },
    series: [{ type: 'line', data: data.map((d: any) => d.count), smooth: true, areaStyle: { color: 'rgba(255,77,79,0.1)' }, lineStyle: { color: '#ff4d4f', width: 2 }, itemStyle: { color: '#ff4d4f' }, symbol: 'none' }],
    tooltip: { trigger: 'axis' },
  });
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

async function loadSummary() {
  try {
    const res: any = await getMetricsSummary({ province_code: filterForm.province_code, ne_type: filterForm.ne_type });
    summary.value = res || { alarm_ne_count: 0, normal_ne_count: 0, top5_alarms: [], anomaly_trend: [] };
    await nextTick();
    renderTrendChart();
  } catch {}
}

async function loadData() {
  loading.value = true;
  try {
    const [startTime, endTime] = getTimeParams();
    const params: any = {
      province_code: filterForm.province_code || undefined,
      major: filterForm.major || undefined,
      ne_type: filterForm.ne_type || undefined,
      vendor: filterForm.vendor || undefined,
      ne_ids: filterForm.ne_ids.length ? filterForm.ne_ids.join(',') : undefined,
      start_time: startTime,
      end_time: endTime,
      compare_mode: filterForm.compare_mode,
    };
    const res: any = await queryMetrics(params);
    chartData.value = res;
    if (viewMode.value === 'chart') {
      renderMainChart(res);
    } else {
      loadTableData(params);
    }
    loadSummary();
  } catch {} finally {
    loading.value = false;
  }
}

function renderMainChart(data: any) {
  if (!mainChart || !data?.series?.length) {
    mainChart?.setOption({ title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#8c8c8c', fontSize: 14 } } });
    return;
  }
  const series = data.series || [];
  const times = series[0]?.data_points?.map((p: any) => p.time?.slice(11, 16) || '') || [];
  const thresholdLines = data.threshold_lines || [];
  const alarmZones = data.alarm_zones || [];

  // Build alarm markAreas using xAxis index
  const markAreaData: any[] = [];
  alarmZones.forEach((z: any) => {
    const startIdx = times.indexOf(z.start_time?.slice(11, 16));
    const endIdx = times.indexOf(z.end_time?.slice(11, 16));
    if (startIdx >= 0) {
      markAreaData.push([
        { xAxis: startIdx, itemStyle: { color: 'rgba(255,77,79,0.08)' } },
        { xAxis: endIdx >= 0 ? endIdx : startIdx + 5 },
      ]);
    }
  });

  // Threshold lines
  const markLineData = thresholdLines.map((t: any) => ({
    yAxis: t.threshold_value,
    lineStyle: { color: '#ff4d4f', type: 'dashed', width: 1.5 },
    label: { formatter: `${t.rule_name}: ${t.threshold_value}`, fontSize: 10, position: 'insideEndTop' },
  }));

  const chartSeries = series.map((s: any, idx: number) => {
    const alarmPoints = s.data_points?.map((p: any, pi: number) =>
      p.is_alarm ? { coord: [pi, p.value], symbol: 'circle', symbolSize: 8, itemStyle: { color: '#ff4d4f' }, label: { show: false } } : null
    ).filter(Boolean) || [];

    return {
      name: s.ne_name,
      type: 'line',
      data: s.data_points?.map((p: any) => p.value) || [],
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2 },
      markPoint: {
        data: alarmPoints.length ? alarmPoints : undefined,
        animation: false,
      },
      // Only attach markLine & markArea to first series
      ...(idx === 0 ? {
        markLine: { silent: true, symbol: 'none', data: markLineData },
        markArea: { silent: true, data: markAreaData.length ? markAreaData : undefined },
      } : {}),
    };
  });

  mainChart.setOption({
    grid: { top: 50, right: 30, bottom: 60, left: 60 },
    tooltip: {
      trigger: 'axis',
      formatter(params: any) {
        if (!Array.isArray(params)) return '';
        let html = `<div style="font-size:12px;margin-bottom:4px">${params[0]?.axisValue}</div>`;
        params.forEach((p: any) => {
          const dot = p.marker || '';
          const val = p.value != null ? p.value : '-';
          const isAlarm = p.data?.is_alarm;
          html += `<div style="display:flex;justify-content:space-between;gap:16px">${dot}${p.seriesName} <span style="font-weight:600;color:${isAlarm ? '#ff4d4f' : '#1f2937'}">${val}${isAlarm ? ' ⚠' : ''}</span></div>`;
        });
        return html;
      },
    },
    legend: { data: series.map((s: any) => s.ne_name), top: 5, textStyle: { fontSize: 12 }, type: 'scroll' },
    xAxis: { type: 'category', data: times, axisLabel: { fontSize: 10, rotate: times.length > 60 ? 45 : 0 }, boundaryGap: false },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10 },
      splitLine: { lineStyle: { type: 'dashed' } },
      name: data.metric_unit === 'percent' ? '(%)' : '',
    },
    series: chartSeries,
    dataZoom: [
      { type: 'slider', start: 70, end: 100, height: 20, bottom: 10, borderColor: '#e5e7eb', fillerColor: 'rgba(0,107,230,0.15)' },
      { type: 'inside' },
    ],
  }, true);
}

async function loadTableData(params: any) {
  try {
    const res: any = await queryMetrics({ ...params, page: tablePagination.current, page_size: tablePagination.pageSize });
    if (res.columns) {
      tableColumns.value = [
        { title: '网元名称', dataIndex: 'ne_name', key: 'ne_name', width: 160, fixed: 'left' },
        ...res.columns.filter((c: any) => c.key !== 'ne_name').map((c: any) => ({
          title: c.title, dataIndex: c.key, key: c.key, width: c.width,
        })),
      ];
      tableData.value = res.list || [];
      tablePagination.total = res.total || 0;
    }
  } catch {}
}

function onFilterChange() {
  loadFilterOptions();
}

function onTimeRangeChange() {
  loadData();
}

function onNeSearch(keyword: string) {
  if (!keyword) return;
  searchNe({ keyword, province_code: filterForm.province_code, ne_type: filterForm.ne_type }).then((res: any) => {
    neOptions.value = res || [];
  }).catch(() => {});
}

function resetFilter() {
  filterForm.province_code = '';
  filterForm.major = '';
  filterForm.ne_type = '';
  filterForm.vendor = '';
  filterForm.ne_ids = [];
  filterForm.compare_mode = 'same_province_type';
  timeRange.value = '24h';
  loadData();
}

function onTableChange(pag: any) {
  tablePagination.current = pag.current;
  tablePagination.pageSize = pag.pageSize;
  loadData();
}

watch(viewMode, () => {
  if (viewMode.value === 'chart') {
    nextTick(() => {
      if (!mainChart && mainChartRef.value) {
        mainChart = echarts.init(mainChartRef.value);
      }
      if (chartData.value) renderMainChart(chartData.value);
    });
  } else {
    loadData();
  }
});

function goToMonitor() {
  router.push('/monitor');
}

async function handleExport() {
  try {
    const [startTime, endTime] = getTimeParams();
    await createExport({
      export_type: 'metric_report',
      params: {
        province_code: filterForm.province_code || undefined,
        ne_type: filterForm.ne_type || undefined,
        ne_ids: filterForm.ne_ids,
        start_time: startTime,
        end_time: endTime,
        include_alarm_marks: true,
      },
    });
    message.success('导出任务已创建，请在导出列表中查看');
  } catch {}
}
</script>

<style lang="less" scoped>
@import '@/styles/variables.less';

.report-page {
  .summary-row {
    .summary-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: @shadow-2; }
      :deep(.ant-card-body) { padding: 16px; }
    }
    .top5-card, .trend-card { cursor: default; }
    .card-footer { font-size: 12px; color: @disabled-color; margin-top: 4px; }
    .top5-title, .trend-title { font-size: 13px; font-weight: 500; margin-bottom: 8px; color: @text-color; }
    .top5-item {
      display: flex; align-items: center; gap: 6px; font-size: 12px; margin-bottom: 4px;
      .severity-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .top5-name { font-weight: 500; }
      .top5-title-text { color: @disabled-color; }
    }
    .trend-chart { height: 100px; }
  }

  .filter-card, .table-card {
    :deep(.ant-card-body) { padding: 16px; }
  }

  .table-toolbar {
    display: flex; align-items: center; margin-bottom: 12px;
  }

  .main-chart { height: 420px; width: 100%; }
}
</style>
