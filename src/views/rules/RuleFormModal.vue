<template>
  <a-modal
    :open="open"
    :title="editData ? `编辑告警规则 - ${editData.rule_name}` : '创建告警规则'"
    :width="860"
    :footer="null"
    @cancel="handleClose"
    :destroyOnClose="true"
  >
    <a-steps :current="currentStep" size="small" style="margin-bottom: 24px">
      <a-step title="基本信息" />
      <a-step title="告警条件" />
      <a-step title="观察窗口" />
      <a-step title="生效设置" />
    </a-steps>

    <!-- Step 1: Basic Info -->
    <div v-show="currentStep === 0">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="规则名称" required>
              <a-input v-model:value="form.rule_name" placeholder="建议格式：网元类型-指标-条件" :maxLength="50" showCount :status="nameCheckStatus === 'invalid' ? 'error' : ''" />
              <div v-if="nameCheckStatus === 'invalid'" style="color:#ff4d4f;font-size:12px;margin-top:2px">{{ nameCheckMsg }}</div>
              <div v-else-if="nameCheckStatus === 'valid'" style="color:#52c41a;font-size:12px;margin-top:2px">名称可用</div>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="网元类型" required>
              <a-select v-model:value="form.ne_type" placeholder="请选择" @change="onNeTypeChange">
                <a-select-option v-for="t in neTypeList" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="告警等级" required>
              <a-select v-model:value="form.severity" placeholder="请选择">
                <a-select-option :value="1"><span style="color:#ff4d4f">🔴 1级 - 紧急</span> 影响大面积用户</a-select-option>
                <a-select-option :value="2"><span style="color:#faad14">🟠 2级 - 严重</span> 影响局部区域</a-select-option>
                <a-select-option :value="3"><span style="color:#faad14">🟡 3级 - 一般</span> 性能劣化</a-select-option>
                <a-select-option :value="4"><span style="color:#1677ff">🔵 4级 - 提示</span> 需关注</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="应用场景">
              <a-checkbox-group v-model:value="form.scene">
                <a-checkbox value="fault_dispatch">故障派单</a-checkbox>
                <a-checkbox value="biz_monitor">业务受损监控</a-checkbox>
                <a-checkbox value="auto_remediation">动网自动化</a-checkbox>
              </a-checkbox-group>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="规则描述">
              <a-textarea v-model:value="form.description" :rows="2" :maxLength="200" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <!-- Step 2: Conditions -->
    <div v-show="currentStep === 1">
      <div class="condition-canvas">
        <div class="condition-list">
          <div
            v-for="(cond, idx) in form.conditions"
            :key="idx"
            :class="['condition-card', { active: activeCondition === idx }]"
            @click="activeCondition = idx"
          >
            <div class="card-header">
              <span class="metric-name">📊 {{ cond.metric_name || '未选择指标' }}</span>
              <span class="card-summary">{{ thresholdTypeMap[cond.threshold_type] || '' }} {{ cond.operator }}{{ cond.threshold_value }}{{ cond.metric_unit === 'percent' ? '%' : '' }}</span>
              <close-outlined v-if="form.conditions.length > 1" class="card-close" @click.stop="removeCondition(idx)" />
            </div>
          </div>
          <a-button type="dashed" block @click="addCondition" :disabled="form.conditions.length >= 5">+ 添加条件</a-button>
        </div>

        <!-- Logic Operator -->
        <div class="logic-preview" v-if="form.conditions.length > 1">
          <a-select v-model:value="form.logic_operator" size="small" style="width: 80px">
            <a-select-option value="AND">AND</a-select-option>
            <a-select-option value="OR">OR</a-select-option>
          </a-select>
          <span style="margin-left: 8px; color: #8c8c8c; font-size: 12px">
            编排逻辑: {{ logicPreview }}
          </span>
        </div>
      </div>

      <!-- Condition Detail -->
      <div v-if="form.conditions[activeCondition]" class="condition-detail">
        <a-divider>条件详情 — {{ form.conditions[activeCondition].metric_name || '未选择' }}</a-divider>
        <a-form layout="vertical">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="指标" required>
                <a-select v-model:value="form.conditions[activeCondition].metric_code" placeholder="请选择指标" @change="onMetricChange">
                  <a-select-option v-for="m in metricList" :key="m.metric_code" :value="m.metric_code">{{ m.metric_name }} ({{ m.metric_unit === 'percent' ? '%' : '数值' }})</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="阈值类型" required>
                <a-radio-group v-model:value="form.conditions[activeCondition].threshold_type">
                  <a-radio value="absolute">绝对值</a-radio>
                  <a-radio value="qoq">环比</a-radio>
                  <a-radio value="yoy">同比</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="运算符" required>
                <a-select v-model:value="form.conditions[activeCondition].operator">
                  <a-select-option value="lt">&lt;</a-select-option>
                  <a-select-option value="lte">&lt;=</a-select-option>
                  <a-select-option value="gt">&gt;</a-select-option>
                  <a-select-option value="gte">&gt;=</a-select-option>
                  <a-select-option value="eq">=</a-select-option>
                  <a-select-option value="ne">!=</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="阈值" required>
                <a-input-number v-model:value="form.conditions[activeCondition].threshold_value" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="单位">
                <a-radio-group v-model:value="form.conditions[activeCondition].metric_unit">
                  <a-radio value="percent">%</a-radio>
                  <a-radio value="value">数值</a-radio>
                </a-radio-group>
              </a-form-item>
            </a-col>
          </a-row>
          <a-alert
            v-if="form.conditions[activeCondition].threshold_type === 'qoq'"
            type="info"
            :message="`当前含义: ${form.conditions[activeCondition].metric_name || '指标'}与1分钟前相比下降超过${form.conditions[activeCondition].threshold_value || 0}%`"
            show-icon
            style="margin-top: 8px"
          />

          <!-- Distribution chart -->
          <div v-if="distributionInfo" style="margin-top: 12px">
            <a-divider orientation="left" style="font-size:12px">阈值可视化参考（最近24h指标分布）</a-divider>
            <div ref="distributionChartRef" style="height:180px;width:100%"></div>
            <div style="font-size:12px;color:#8c8c8c;margin-top:4px">
              {{ distributionInfo.threshold_coverage_description || `当前阈值将覆盖约${distributionInfo.threshold_coverage}%的采集点` }}
            </div>
          </div>
        </a-form>
      </div>
    </div>

    <!-- Step 3: Observe Window -->
    <div v-show="currentStep === 2">
      <a-form layout="vertical">
        <a-form-item label="触发窗口" required>
          <a-input-group compact>
            <span style="line-height: 32px; margin-right: 8px">连续</span>
            <a-select v-model:value="form.observe_window" style="width: 120px">
              <a-select-option v-for="n in [1,2,3,5,10,15,30]" :key="n" :value="n">{{ n }}个采集点</a-select-option>
            </a-select>
            <span style="line-height: 32px; margin-left: 8px">满足条件才触发告警 ({{ form.observe_window }}分钟)</span>
          </a-input-group>
        </a-form-item>
        <a-form-item label="恢复窗口" required>
          <a-input-group compact>
            <span style="line-height: 32px; margin-right: 8px">连续</span>
            <a-select v-model:value="form.recovery_window" style="width: 120px">
              <a-select-option v-for="n in [1,2,3,5,10,15,30]" :key="n" :value="n">{{ n }}个采集点</a-select-option>
            </a-select>
            <span style="line-height: 32px; margin-left: 8px">恢复正常才解除告警 ({{ form.recovery_window }}分钟)</span>
          </a-input-group>
        </a-form-item>
        <a-alert type="info" show-icon style="margin-top: 8px">
          <template #message>
            <div>推荐配置: 当前等级{{ severityLabel(form.severity) }} → 触发{{ recommendWindow.trigger }}点/恢复{{ recommendWindow.recovery }}点
              <a-button type="link" size="small" @click="applyRecommend">应用推荐</a-button>
            </div>
          </template>
        </a-alert>
      </a-form>
    </div>

    <!-- Step 4: Effective Settings -->
    <div v-show="currentStep === 3">
      <a-form layout="vertical">
        <a-form-item label="生效时段">
          <a-radio-group v-model:value="form.effective_type">
            <a-radio value="always">全天候生效</a-radio>
            <a-radio value="cutover">割接时段</a-radio>
            <a-radio value="non_cutover">非割接时段</a-radio>
            <a-radio value="custom">自定义时段</a-radio>
          </a-radio-group>
        </a-form-item>

        <template v-if="form.effective_type === 'custom'">
          <a-form-item label="每日生效时间">
            <a-time-range-picker v-model:value="effectiveTimeRange" format="HH:mm" :minuteStep="5" />
          </a-form-item>
          <a-form-item label="生效日">
            <a-checkbox-group v-model:value="effectiveWeekdays">
              <a-checkbox :value="1">一</a-checkbox>
              <a-checkbox :value="2">二</a-checkbox>
              <a-checkbox :value="3">三</a-checkbox>
              <a-checkbox :value="4">四</a-checkbox>
              <a-checkbox :value="5">五</a-checkbox>
              <a-checkbox :value="6">六</a-checkbox>
              <a-checkbox :value="7">日</a-checkbox>
            </a-checkbox-group>
            <a-button type="link" size="small" @click="effectiveWeekdays = [1,2,3,4,5]">仅工作日</a-button>
            <a-button type="link" size="small" @click="effectiveWeekdays = [1,2,3,4,5,6,7]">全选</a-button>
          </a-form-item>
          <a-form-item label="例外日期">
            <div v-for="(d, i) in form.exception_dates" :key="i" style="margin-bottom: 4px">
              <a-tag closable @close="form.exception_dates.splice(i, 1)">📅 {{ d.date }} {{ d.name }}</a-tag>
            </div>
            <a-button type="dashed" size="small" @click="addExceptionDate">+ 添加例外日期</a-button>
          </a-form-item>
        </template>

        <a-form-item label="处置建议">
          <a-textarea v-model:value="form.sop_template" :rows="3" :maxLength="500" placeholder="1. 检查进程状态&#10;2. 查看接口日志&#10;3. 联系厂商支持" />
        </a-form-item>

        <a-form-item label="保存后立即启用">
          <a-radio-group v-model:value="form.status">
            <a-radio :value="1">是</a-radio>
            <a-radio :value="0">否（保存为草稿）</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </div>

    <!-- Footer Buttons -->
    <div class="modal-footer">
      <a-button v-if="currentStep > 0" @click="currentStep--">← 上一步</a-button>
      <div style="flex:1"></div>
      <a-button @click="handleClose">取消</a-button>
      <a-button v-if="currentStep < 3" type="primary" @click="nextStep">下一步 →</a-button>
      <template v-if="currentStep === 3">
        <a-button @click="handleSimulate">效果模拟</a-button>
        <a-button type="primary" @click="handleSave">{{ editData ? '保存修改' : '保存' }}</a-button>
      </template>
    </div>

    <!-- Exception Date Modal -->
    <a-modal v-model:open="exceptionDateVisible" title="添加例外日期" @ok="confirmExceptionDate" size="small">
      <a-form layout="vertical">
        <a-form-item label="日期">
          <a-date-picker v-model:value="exceptionDateForm.date" style="width: 100%" />
        </a-form-item>
        <a-form-item label="备注">
          <a-input v-model:value="exceptionDateForm.name" placeholder="节假日名称（可选）" />
        </a-form-item>
        <a-form-item label="重复">
          <a-radio-group v-model:value="exceptionDateForm.repeat_yearly">
            <a-radio :value="false">仅当年</a-radio>
            <a-radio :value="true">每年重复</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Simulate Modal -->
    <a-modal
      v-model:open="simulateVisible"
      :title="`效果模拟 — ${form.rule_name || '新规则'}`"
      :width="720"
      :footer="null"
      :destroyOnClose="true"
    >
      <a-form layout="inline" style="margin-bottom: 16px">
        <a-form-item label="模拟时间范围">
          <a-select v-model:value="simulateRange" style="width: 140px">
            <a-select-option value="1d">最近1天</a-select-option>
            <a-select-option value="7d">最近7天</a-select-option>
            <a-select-option value="30d">最近30天</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" :loading="simulateLoading" @click="runSimulate">开始模拟</a-button>
        </a-form-item>
      </a-form>

      <template v-if="simulateResult">
        <a-row :gutter="12" style="margin-bottom: 16px">
          <a-col :span="8">
            <a-card>
              <a-statistic title="触发告警" :value="simulateResult.triggered_count" :value-style="{ color: '#ff4d4f' }">
                <template #prefix>🔔</template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card>
              <a-statistic title="正常过滤" :value="simulateResult.filtered_normal_count" :value-style="{ color: '#52c41a' }">
                <template #prefix>✅</template>
              </a-statistic>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card>
              <a-statistic title="闪断过滤" :value="simulateResult.filtered_flash_count" :value-style="{ color: '#faad14' }">
                <template #prefix>⚡</template>
              </a-statistic>
            </a-card>
          </a-col>
        </a-row>

        <a-divider>告警触发详情 ({{ simulateResult.triggered_count }}次)</a-divider>
        <a-table
          :dataSource="simulateResult.triggered_events"
          :columns="[
            { title: '#', key: 'index', width: 40, customRender: ({ index }: any) => index + 1 },
            { title: '网元', dataIndex: 'ne_name', key: 'ne_name', width: 120 },
            { title: '触发时间', dataIndex: 'triggered_at', key: 'triggered_at', width: 150 },
            { title: '持续', dataIndex: 'duration_minutes', key: 'duration_minutes', width: 80, customRender: ({ text }: any) => `${text}min` },
            { title: '等级', key: 'severity', width: 80, customRender: ({ text }: any) => severityLabel(text) },
          ]"
          :pagination="false"
          size="small"
          bordered
          rowKey="triggered_at"
        />

        <a-divider>模拟评估</a-divider>
        <div v-if="simulateResult.assessment" class="simulate-assessment">
          <p>• 日均告警 {{ simulateResult.assessment.daily_avg_triggers }} 次，频率{{ simulateResult.assessment.daily_avg_triggers > 5 ? '偏高' : '合理' }}</p>
          <p>• 闪断过滤率 {{ (simulateResult.assessment.flash_filter_rate * 100).toFixed(0) }}%，窗口配置{{ simulateResult.assessment.flash_filter_rate > 0.5 ? '有效' : '需优化' }}</p>
          <p>• 最长持续告警 {{ simulateResult.assessment.max_duration_minutes }} 分钟 ({{ simulateResult.assessment.max_duration_ne }})，建议关注</p>
          <a-alert v-if="simulateResult.assessment.recommendation" :message="simulateResult.assessment.recommendation" type="info" show-icon style="margin-top: 8px" />
        </div>
      </template>
      <a-empty v-else-if="!simulateLoading" description="点击【开始模拟】查看规则历史命中情况" />
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { message } from 'ant-design-vue';
import { CloseOutlined } from '@ant-design/icons-vue';
import { createRule, updateRule, checkRuleName } from '@/api/rules';
import { simulateRule, simulateExistingRule } from '@/api/rules';
import { getNeTypes, getMetricsByType } from '@/api/common';
import { getMetricsDistribution } from '@/api/metrics';
import * as echarts from 'echarts';
import dayjs from 'dayjs';

const props = defineProps<{ open: boolean; editData?: any }>();
const emit = defineEmits(['update:open', 'saved']);

const currentStep = ref(0);
const neTypeList = ref<any[]>([]);
const metricList = ref<any[]>([]);
const activeCondition = ref(0);
const exceptionDateVisible = ref(false);
const exceptionDateForm = reactive({ date: null as any, name: '', repeat_yearly: true });
const effectiveTimeRange = ref<any>(null);
const effectiveWeekdays = ref<number[]>([1, 2, 3, 4, 5]);

// Simulate state
const simulateVisible = ref(false);
const simulateLoading = ref(false);
const simulateRange = ref('7d');
const simulateResult = ref<any>(null);

// Rule name uniqueness check
const nameCheckStatus = ref<'' | 'valid' | 'invalid'>('');
const nameCheckMsg = ref('');
let nameCheckTimer: ReturnType<typeof setTimeout> | null = null;

// Distribution chart
const distributionChartRef = ref<HTMLElement>();
let distributionChart: echarts.ECharts | null = null;
const distributionInfo = ref<any>(null);

const thresholdTypeMap: Record<string, string> = { absolute: '绝对值', qoq: '环比', yoy: '同比' };

const defaultCondition = () => ({
  metric_code: '',
  metric_name: '',
  metric_unit: 'percent',
  threshold_type: 'absolute',
  operator: 'lt',
  threshold_value: 0,
  offset_percent: 0,
});

const form = reactive({
  rule_name: '',
  ne_type: '',
  description: '',
  severity: 2,
  scene: [] as string[],
  conditions: [defaultCondition()],
  logic_operator: 'AND',
  observe_window: 3,
  recovery_window: 3,
  effective_type: 'always' as string,
  effective_periods: { start_time: '08:00', end_time: '20:00' },
  effective_weekdays: '1,2,3,4,5',
  exception_dates: [] as any[],
  sop_template: '',
  status: 1,
});

watch(() => props.open, (val) => {
  if (val) {
    loadNeTypes();
    if (props.editData) {
      Object.assign(form, { ...props.editData });
      effectiveWeekdays.value = props.editData.effective_weekdays?.split(',').map(Number) || [1,2,3,4,5];
      activeCondition.value = 0;
    } else {
      resetForm();
    }
    currentStep.value = 0;
  }
});

function resetForm() {
  form.rule_name = '';
  form.ne_type = '';
  form.description = '';
  form.severity = 2;
  form.scene = [];
  form.conditions = [defaultCondition()];
  form.logic_operator = 'AND';
  form.observe_window = 3;
  form.recovery_window = 3;
  form.effective_type = 'always';
  form.sop_template = '';
  form.status = 1;
  form.exception_dates = [];
  activeCondition.value = 0;
}

async function loadNeTypes() {
  try {
    const res: any = await getNeTypes();
    neTypeList.value = res || [];
  } catch {}
}

async function onNeTypeChange(neType: string) {
  try {
    const res: any = await getMetricsByType(neType);
    metricList.value = res || [];
  } catch {}
}

function onMetricChange(val: string) {
  const m = metricList.value.find((item: any) => item.metric_code === val);
  if (m) {
    form.conditions[activeCondition.value].metric_name = m.metric_name;
    form.conditions[activeCondition.value].metric_unit = m.metric_unit;
  }
  // Load distribution chart for selected metric
  loadDistribution(val);
}

// Rule name uniqueness check with debounce
watch(() => form.rule_name, (val) => {
  if (!val || val.length < 2) { nameCheckStatus.value = ''; nameCheckMsg.value = ''; return; }
  if (nameCheckTimer) clearTimeout(nameCheckTimer);
  nameCheckTimer = setTimeout(async () => {
    try {
      const res: any = await checkRuleName({
        rule_name: val,
        ne_type: form.ne_type,
        exclude_rule_id: props.editData?.rule_id,
      });
      nameCheckStatus.value = res.available ? 'valid' : 'invalid';
      nameCheckMsg.value = res.available ? '' : '规则名称已存在，请修改';
    } catch {
      nameCheckStatus.value = '';
    }
  }, 500);
});

async function loadDistribution(metricCode: string) {
  if (!form.ne_type || !metricCode) return;
  try {
    const res: any = await getMetricsDistribution({ ne_type: form.ne_type, metric_code: metricCode, period: '24h' });
    distributionInfo.value = res;
    await nextTick();
    renderDistributionChart(res);
  } catch {}
}

function renderDistributionChart(data: any) {
  if (!distributionChartRef.value || !data?.percentiles) return;
  distributionChart?.dispose();
  distributionChart = echarts.init(distributionChartRef.value);
  const p = data.percentiles;
  const categories = ['P5', 'P25', 'P50', 'P75', 'P95'];
  const values = [p.p5, p.p25, p.p50, p.p75, p.p95];
  const unit = data.metric_unit === 'percent' ? '%' : '';
  const currentThreshold = form.conditions[activeCondition.value]?.threshold_value;

  distributionChart.setOption({
    grid: { top: 15, right: 15, bottom: 30, left: 45 },
    xAxis: { type: 'category', data: categories, axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: `{value}${unit}` }, splitLine: { lineStyle: { type: 'dashed' } }, min: (v: any) => Math.floor(v.min - 2) },
    series: [{
      type: 'bar', data: values, barWidth: '50%',
      itemStyle: { color: '#d9e9fb', borderRadius: [3, 3, 0, 0] },
      markLine: currentThreshold != null ? {
        silent: true, symbol: 'none',
        data: [{ yAxis: currentThreshold, lineStyle: { color: '#ff4d4f', type: 'dashed', width: 1.5 }, label: { formatter: `当前阈值: ${currentThreshold}${unit}`, fontSize: 10, position: 'insideEndTop' } }],
      } : undefined,
    }],
    tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].name}: ${params[0].value}${unit}` },
  });
}

function addCondition() {
  if (form.conditions.length < 5) {
    form.conditions.push(defaultCondition());
    activeCondition.value = form.conditions.length - 1;
  }
}

function removeCondition(idx: number) {
  form.conditions.splice(idx, 1);
  if (activeCondition.value >= form.conditions.length) {
    activeCondition.value = form.conditions.length - 1;
  }
}

const logicPreview = computed(() => {
  return form.conditions.map((c) => `(${c.metric_name || '?'} ${thresholdTypeMap[c.threshold_type] || ''}${c.operator}${c.threshold_value})`).join(` ${form.logic_operator} `);
});

const recommendWindow = computed(() => {
  const s = form.severity;
  if (s === 1) return { trigger: 2, recovery: 5 };
  if (s <= 3) return { trigger: 3, recovery: 3 };
  return { trigger: 5, recovery: 2 };
});

function applyRecommend() {
  form.observe_window = recommendWindow.value.trigger;
  form.recovery_window = recommendWindow.value.recovery;
}

function severityLabel(s: number) {
  return ['', '1级-紧急', '2级-严重', '3级-一般', '4级-提示'][s] || '';
}

function addExceptionDate() {
  exceptionDateForm.date = null;
  exceptionDateForm.name = '';
  exceptionDateForm.repeat_yearly = true;
  exceptionDateVisible.value = true;
}

function confirmExceptionDate() {
  if (!exceptionDateForm.date) return message.warning('请选择日期');
  form.exception_dates.push({
    date: dayjs(exceptionDateForm.date).format('YYYY-MM-DD'),
    name: exceptionDateForm.name,
    repeat_yearly: exceptionDateForm.repeat_yearly,
  });
  exceptionDateVisible.value = false;
}

function nextStep() {
  if (currentStep.value === 0) {
    if (!form.rule_name || !form.ne_type || !form.severity) {
      return message.warning('请填写必填项');
    }
  }
  if (currentStep.value === 1) {
    const empty = form.conditions.find((c) => !c.metric_code || c.threshold_value === undefined);
    if (empty) return message.warning('请完善告警条件');
  }
  currentStep.value++;
}

async function handleSave() {
  try {
    const payload: any = {
      ...form,
      effective_weekdays: effectiveWeekdays.value.join(','),
    };
    if (form.effective_type === 'custom' && effectiveTimeRange.value) {
      payload.effective_periods = {
        start_time: effectiveTimeRange.value[0]?.format('HH:mm'),
        end_time: effectiveTimeRange.value[1]?.format('HH:mm'),
      };
    }
    if (props.editData) {
      await updateRule(props.editData.rule_id, payload);
      message.success('修改成功');
    } else {
      await createRule(payload);
      message.success('创建成功');
    }
    handleClose();
    emit('saved');
  } catch {}
}

function handleSimulate() {
  simulateResult.value = null;
  simulateVisible.value = true;
}

async function runSimulate() {
  simulateLoading.value = true;
  try {
    const payload = {
      conditions: form.conditions,
      logic_operator: form.logic_operator,
      observe_window: form.observe_window,
      recovery_window: form.recovery_window,
      ne_type: form.ne_type,
      severity: form.severity,
      simulation_range: simulateRange.value,
      ne_scope: 'all',
    };
    let res: any;
    if (props.editData?.rule_id) {
      res = await simulateExistingRule(props.editData.rule_id, { simulation_range: simulateRange.value, ne_scope: 'all' });
    } else {
      res = await simulateRule(payload);
    }
    simulateResult.value = res;
  } catch {} finally {
    simulateLoading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
  resetForm();
}
</script>

<style lang="less" scoped>
.condition-canvas {
  .condition-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .condition-card {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 12px;
    cursor: pointer;
    transition: all 0.2s;
    &.active { border-color: #006be6; background: #e6f4ff; }
    &:hover { border-color: #006be6; }
    .card-header { display: flex; align-items: center; gap: 8px; }
    .metric-name { font-weight: 500; }
    .card-summary { color: #8c8c8c; font-size: 12px; }
    .card-close { margin-left: auto; color: #8c8c8c; &:hover { color: #ff4d4f; } }
  }
  .logic-preview { margin-top: 8px; display: flex; align-items: center; }
}
.condition-detail { margin-top: 16px; }
.modal-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
.simulate-assessment {
  font-size: 13px;
  line-height: 2;
  p { margin: 0; }
}
</style>
