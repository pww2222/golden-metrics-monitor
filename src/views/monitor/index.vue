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
                <a-select-option :value="1">1级-紧急</a-select-option>
                <a-select-option :value="2">2级-严重</a-select-option>
                <a-select-option :value="3">3级-一般</a-select-option>
                <a-select-option :value="4">4级-提示</a-select-option>
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
          <!-- 聚合维度选择器 -->
          <template v-if="viewMode === 'aggregate'">
            <a-select v-model:value="aggDimension" style="margin-left: 12px; width: 140px" @change="loadAggregatedAlarms">
              <a-select-option value="region_pool">大区+Pool</a-select-option>
              <a-select-option value="region">仅大区</a-select-option>
              <a-select-option value="pool">仅Pool</a-select-option>
            </a-select>
          </template>
          <template v-if="viewMode === 'list'">
            <a-button @click="batchConfirm" :disabled="!hasSelected" style="margin-left: 12px">批量确认</a-button>
            <a-button @click="openBatchTransfer" :disabled="!hasSelected" style="margin-left: 8px">批量转派</a-button>
            <a-button @click="batchMarkFalseAlarm" :disabled="!hasSelected" style="margin-left: 8px">标记误报</a-button>
          </template>
        </div>
        <div class="toolbar-right">
          <a-button @click="handleExport">导出</a-button>
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

      <!-- 聚合视图：三层树形结构 -->
      <div v-if="viewMode === 'aggregate'" class="aggregate-view">
        <a-spin :spinning="aggLoading">
          <template v-if="aggregateViewData">
            <div class="agg-summary">
              <span>共 {{ aggregateViewData.total_regions }} 个大区，{{ aggregateViewData.total_derived_alarms }} 条衍生告警</span>
            </div>
            <a-collapse v-model:activeKey="expandedRegions" :bordered="false" class="region-collapse">
              <a-collapse-panel v-for="region in aggregateViewData.regions" :key="region.region_code">
                <template #header>
                  <div class="region-header">
                    <span class="region-name">{{ region.region_name }}</span>
                    <a-tag :color="severityColor(region.max_severity)" style="margin-left: 8px">{{ severityLabel(region.max_severity) }}</a-tag>
                    <span class="region-count">{{ region.alarm_count }} 条告警</span>
                    <span class="region-time">{{ region.latest_time?.slice(5, 16) }}</span>
                  </div>
                </template>

                <!-- 大区级衍生告警 -->
                <div v-if="region.derived_alarms?.length" class="derived-alarm-section">
                  <div class="section-label">大区级衍生告警</div>
                  <div v-for="da in region.derived_alarms" :key="da.derived_id" class="derived-alarm-item" @click="openDerivedDetail(da)">
                    <span :class="'severity-badge-' + da.severity" class="severity-dot"></span>
                    <a-tag color="purple" style="margin-right: 4px">大区</a-tag>
                    <span class="da-title">{{ da.event_title }}</span>
                    <span class="da-info">{{ da.child_count }}条子告警 / {{ da.active_child_count }}条活跃</span>
                    <a-tag :color="severityColor(da.severity)">{{ severityLabel(da.severity) }}</a-tag>
                  </div>
                </div>

                <!-- Pool 级 -->
                <div v-if="region.pools?.length" class="pool-section">
                  <div class="section-label">Pool级</div>
                  <a-collapse v-model:activeKey="expandedPools[region.region_code]" :bordered="false" class="pool-collapse">
                    <a-collapse-panel v-for="pool in region.pools" :key="pool.pool_name">
                      <template #header>
                        <div class="pool-header">
                          <span class="pool-name">{{ pool.pool_name }}</span>
                          <a-tag :color="severityColor(pool.max_severity)" style="margin-left: 8px">{{ severityLabel(pool.max_severity) }}</a-tag>
                          <span class="pool-count">{{ pool.alarm_count }} 条</span>
                        </div>
                      </template>

                      <!-- Pool级衍生告警 -->
                      <div v-if="pool.derived_alarms?.length" class="derived-alarm-section">
                        <div v-for="da in pool.derived_alarms" :key="da.derived_id" class="derived-alarm-item" @click="openDerivedDetail(da)">
                          <span :class="'severity-badge-' + da.severity" class="severity-dot"></span>
                          <a-tag color="blue" style="margin-right: 4px">Pool</a-tag>
                          <span class="da-title">{{ da.event_title }}</span>
                          <span class="da-info">{{ da.child_count }}条子告警 / {{ da.active_child_count }}条活跃</span>
                          <a-tag :color="severityColor(da.severity)">{{ severityLabel(da.severity) }}</a-tag>
                        </div>
                      </div>

                      <!-- 原始告警 -->
                      <div v-if="pool.original_alarms?.length" class="original-alarm-section">
                        <div class="section-label" style="margin-top: 8px">原始告警</div>
                        <div v-for="oa in pool.original_alarms" :key="oa.event_id" class="original-alarm-item" @click="openDetail(oa)">
                          <span :class="'severity-badge-' + oa.severity" class="severity-dot"></span>
                          <span class="oa-name">{{ oa.ne_name }}</span>
                          <span class="oa-title">{{ oa.event_title }}</span>
                          <a-tag :color="severityColor(oa.severity)">{{ severityLabel(oa.severity) }}</a-tag>
                        </div>
                      </div>
                    </a-collapse-panel>
                  </a-collapse>
                </div>
              </a-collapse-panel>
            </a-collapse>
            <a-empty v-if="!aggregateViewData.regions?.length" description="暂无聚合数据" />
          </template>
          <a-empty v-else-if="!aggLoading" description="暂无聚合数据" />
        </a-spin>
      </div>
    </a-card>

    <!-- Alarm Detail Drawer (原始告警) -->
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

    <!-- Derived Alarm Detail Drawer (衍生告警) -->
    <a-drawer :open="derivedDetailVisible" :width="520" :title="'衍生告警详情'" @close="derivedDetailVisible = false" :destroyOnClose="true">
      <template v-if="currentDerived">
        <div class="detail-header">
          <span :class="'severity-badge-' + currentDerived.severity" class="severity-icon"></span>
          <span :class="'severity-' + currentDerived.severity" style="font-weight: 600">{{ severityLabel(currentDerived.severity) }}</span>
          <a-tag :color="currentDerived.agg_type === 'region' ? 'purple' : 'blue'" style="margin-left: 8px">
            {{ currentDerived.agg_type === 'region' ? '大区级' : 'Pool级' }}
          </a-tag>
          <span style="margin-left: 8px">{{ currentDerived.event_title }}</span>
        </div>

        <a-descriptions :column="1" size="small" bordered style="margin-top: 16px">
          <a-descriptions-item label="聚合类型">{{ currentDerived.agg_type === 'region' ? '大区级（告警层）' : 'Pool级（指标层）' }}</a-descriptions-item>
          <a-descriptions-item label="分组">{{ currentDerived.group_name }}</a-descriptions-item>
          <a-descriptions-item label="网元类型">{{ currentDerived.ne_type }}</a-descriptions-item>
          <a-descriptions-item label="指标">{{ currentDerived.metric_name }}</a-descriptions-item>
          <a-descriptions-item label="子告警数">{{ currentDerived.child_count }} (活跃 {{ currentDerived.active_child_count }})</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-badge :status="derivedStatusBadge(currentDerived.status)" :text="derivedStatusLabel(currentDerived.status)" />
          </a-descriptions-item>
          <a-descriptions-item label="开始时间">{{ currentDerived.started_at }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ currentDerived.updated_at }}</a-descriptions-item>
          <a-descriptions-item v-if="currentDerived.cleared_at" label="清除时间">{{ currentDerived.cleared_at }}</a-descriptions-item>
        </a-descriptions>

        <!-- Pool级特有：聚合值/基线值 -->
        <template v-if="currentDerived.agg_type === 'pool' && currentDerived.agg_value != null">
          <a-divider>聚合数据</a-divider>
          <a-row :gutter="12">
            <a-col :span="8">
              <a-statistic title="当前聚合值" :value="currentDerived.agg_value" :precision="1" :value-style="{ color: '#ff4d4f' }" />
            </a-col>
            <a-col :span="8">
              <a-statistic title="基线值" :value="currentDerived.baseline_value" :precision="1" />
            </a-col>
            <a-col :span="8">
              <a-statistic title="偏移" :value="currentDerived.trigger_config?.offset_percent" :precision="1" suffix="%" :value-style="{ color: '#ff4d4f' }" />
            </a-col>
          </a-row>
          <div v-if="currentDerived.trigger_config" style="margin-top: 12px; font-size: 13px; color: #8c8c8c">
            规则: {{ currentDerived.trigger_config.rule_name }}
            | 函数: {{ aggFuncLabel(currentDerived.trigger_config.agg_function) }}
            | 基线: {{ baselineLabel(currentDerived.trigger_config.baseline_type) }}
            | 阈值: {{ currentDerived.trigger_config.operator }}{{ currentDerived.trigger_config.threshold_value }}
            | 窗口: {{ currentDerived.trigger_config.observe_window }}点
          </div>
        </template>

        <!-- 大区级特有：触发配置 -->
        <template v-if="currentDerived.agg_type === 'region' && currentDerived.trigger_config">
          <a-divider>触发配置</a-divider>
          <div style="font-size: 13px; color: #8c8c8c">
            最少省份数: {{ currentDerived.trigger_config.min_provinces }}
            | 时间窗口: {{ currentDerived.trigger_config.time_window_minutes }}分钟
          </div>
          <div v-if="currentDerived.involved_provinces?.length" style="margin-top: 8px">
            <span style="font-size: 13px; color: #8c8c8c">涉及省份: </span>
            <a-tag v-for="p in currentDerived.involved_provinces" :key="p.province_code" style="margin-bottom: 2px">
              {{ p.province_name }} ({{ p.child_count }}条)
            </a-tag>
          </div>
        </template>

        <!-- 子告警列表 -->
        <a-divider>子告警列表 ({{ currentDerived.children?.length || 0 }}条)</a-divider>
        <a-table
          v-if="currentDerived.children?.length"
          :dataSource="currentDerived.children"
          :columns="childColumns"
          :pagination="false"
          size="small"
          bordered
          rowKey="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'severity'">
              <a-tag :color="severityColor(record.severity)">{{ severityLabel(record.severity) }}</a-tag>
            </template>
            <template v-if="column.key === 'child_status'">
              <a-badge :status="record.child_status === 'active' ? 'error' : 'success'" :text="record.child_status === 'active' ? '活跃' : '已清除'" />
            </template>
          </template>
        </a-table>

        <!-- 等级变化历史 -->
        <a-divider v-if="currentDerived.severity_history?.length">等级变化历史</a-divider>
        <a-timeline v-if="currentDerived.severity_history?.length">
          <a-timeline-item v-for="(h, i) in currentDerived.severity_history" :key="i" :color="h.severity <= 2 ? 'red' : 'blue'">
            <div style="font-size: 13px">
              <span style="color: #8c8c8c">{{ h.time }}</span>
              <a-tag :color="severityColor(h.severity)" style="margin-left: 8px">{{ severityLabel(h.severity) }}</a-tag>
              <div>{{ h.reason }}</div>
            </div>
          </a-timeline-item>
        </a-timeline>

        <!-- 无人工操作提示 -->
        <a-alert v-if="currentDerived.no_manual_action" type="info" show-icon style="margin-top: 16px">
          <template #message>衍生告警不支持人工操作（确认/关闭/转派等），请对子告警进行操作</template>
        </a-alert>
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
} from '@/api/alarms';
import { getDerivedAlarmsAggregateView, getDerivedAlarmDetail } from '@/api/derived-alarms';
import { getFilterOptions, getOperators } from '@/api/common';
import { createExport } from '@/api/export';

const router = useRouter();
const loading = ref(false);
const timeRange = ref('24h');
const viewMode = ref<'list' | 'aggregate'>('list');
const aggDimension = ref<'region' | 'pool' | 'region_pool'>('region_pool');
const alarmList = ref<any[]>([]);
const aggregateViewData = ref<any>(null);
const aggLoading = ref(false);
const expandedRegions = ref<string[]>([]);
const expandedPools = ref<Record<string, string[]>>({});
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

// 衍生告警详情
const derivedDetailVisible = ref(false);
const currentDerived = ref<any>(null);

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

const childColumns = [
  { title: '省份', dataIndex: 'province_name', key: 'province_name', width: 80 },
  { title: '网元', dataIndex: 'ne_name', key: 'ne_name', width: 120 },
  { title: '标题', dataIndex: 'event_title', key: 'event_title', ellipsis: true },
  { title: '等级', key: 'severity', width: 90 },
  { title: '状态', key: 'child_status', width: 80 },
  { title: '加入时间', dataIndex: 'joined_at', key: 'joined_at', width: 130, customRender: ({ text }: any) => text?.slice(5, 16) },
];

const hasSelected = ref(false);
watch(selectedRowKeys, (v) => { hasSelected.value = v.length > 0; });

function severityColor(s: number) { return ['', 'red', 'orange', 'gold', 'blue'][s] || 'blue'; }
function severityLabel(s: number) { return ['', '1级-紧急', '2级-严重', '3级-一般', '4级-提示'][s] || ''; }
function statusBadge(s: string) { return { pending: 'error', confirmed: 'warning', processing: 'processing', resolved: 'success', closed: 'default', false_alarm: 'default' }[s] || 'default'; }
function statusLabel(s: string) { return { pending: '待处理', confirmed: '已确认', processing: '处理中', resolved: '已恢复', closed: '已关闭', false_alarm: '误报' }[s] || s; }
function derivedStatusBadge(s: string) { return { active: 'error', clearing: 'warning', cleared: 'success' }[s] || 'default'; }
function derivedStatusLabel(s: string) { return { active: '活跃', clearing: '清除中', cleared: '已清除' }[s] || s; }
function aggFuncLabel(f: string) { return { sum: '求和', avg: '均值', max: '最大', min: '最小' }[f] || f; }
function baselineLabel(b: string) { return { yesterday_same_period: '昨日同期', previous_normal_cycle: '前一正常周期', absolute: '绝对阈值' }[b] || b; }
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
      view_mode: 'aggregate',
      agg_dimension: aggDimension.value,
      severity: filterForm.severity.length ? filterForm.severity.join(',') : undefined,
      start_time: startTime,
      end_time: endTime,
    };
    const res: any = await getDerivedAlarmsAggregateView(params);
    aggregateViewData.value = res;
    // 默认展开第一个大区
    if (res?.regions?.length) {
      expandedRegions.value = [res.regions[0].region_code];
    }
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

async function openDerivedDetail(da: any) {
  try {
    const res: any = await getDerivedAlarmDetail(da.derived_id);
    currentDerived.value = res;
    derivedDetailVisible.value = true;
  } catch {}
}

function renderDetailChart() {
  if (!detailChartRef.value) return;
  detailChart?.dispose();
  detailChart = echarts.init(detailChartRef.value);
  const alarm = currentAlarm.value;
  if (!alarm) return;

  const triggerVal = alarm.trigger_value || 87.3;
  const thresholdVal = alarm.trigger_threshold || 95;
  const baseVal = alarm.rule?.conditions?.[0]?.threshold_type === 'qoq' ? 98.5 : 98;
  const points = 60;
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
    .toolbar-left { display: flex; align-items: center; }
    .toolbar-right { display: flex; }
  }

  // 聚合视图样式
  .aggregate-view {
    .agg-summary {
      font-size: 13px;
      color: @disabled-color;
      margin-bottom: 12px;
    }

    .region-collapse {
      background: transparent;

      :deep(.ant-collapse-item) {
        margin-bottom: 8px;
        border: 1px solid @border-color;
        border-radius: @card-radius;
        background: #fff;
      }

      :deep(.ant-collapse-header) {
        padding: 10px 16px !important;
      }

      :deep(.ant-collapse-content) {
        border-top: none;
        border-radius: 0 0 @card-radius @card-radius;
      }
    }

    .region-header {
      display: flex;
      align-items: center;

      .region-name {
        font-weight: 600;
        font-size: 14px;
      }

      .region-count {
        margin-left: 12px;
        font-size: 12px;
        color: @disabled-color;
      }

      .region-time {
        margin-left: 8px;
        font-size: 12px;
        color: @disabled-color;
      }
    }

    .pool-collapse {
      background: transparent;

      :deep(.ant-collapse-item) {
        margin-bottom: 4px;
        border: 1px solid @border-color;
        border-radius: @card-radius;
        background: #fafbfc;
      }
    }

    .pool-header {
      display: flex;
      align-items: center;

      .pool-name {
        font-weight: 500;
        color: @primary-color;
        font-size: 13px;
      }

      .pool-count {
        margin-left: 8px;
        font-size: 12px;
        color: @disabled-color;
      }
    }

    .section-label {
      font-size: 12px;
      color: @disabled-color;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .derived-alarm-section {
      margin-bottom: 12px;
    }

    .derived-alarm-item {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      margin-bottom: 4px;
      background: #fff;
      border: 1px solid @border-color;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 0.2s;
      font-size: 13px;

      &:hover {
        border-color: @primary-color;
        background: @hover-bg;
      }

      .severity-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-right: 8px;
      }

      .da-title {
        flex: 1;
        font-weight: 500;
      }

      .da-info {
        margin-left: 8px;
        font-size: 12px;
        color: @disabled-color;
        white-space: nowrap;
      }
    }

    .original-alarm-section {
      margin-top: 4px;
    }

    .original-alarm-item {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      margin-bottom: 2px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 13px;

      &:hover { background: @hover-bg; }

      .severity-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        flex-shrink: 0;
        margin-right: 6px;
      }

      .oa-name {
        font-weight: 500;
        margin-right: 8px;
        min-width: 100px;
      }

      .oa-title {
        flex: 1;
        color: @text-color;
      }
    }
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
}
</style>
