import { http, HttpResponse, delay } from 'msw';
import { mockRules, mockTemplates } from './data/rules';
import { mockAlarms, mockAlarmDetail, generateSeveritySummary, mockAggregatedAlarms } from './data/alarms';
import { mockMetricsSeries, mockMetricsTable, mockMetricsSummary, mockMetricsDistribution } from './data/metrics';
import { mockFilterOptions, mockNeTypes, mockMetricsByType, mockNeSearchResults, mockOperators } from './data/common';

// MSW 2.x requires absolute URLs for request matching.
const BASE = `${window.location.origin}/api/v1`;

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as any;
    if (body.username && body.password) {
      return HttpResponse.json({
        code: 0,
        message: 'success',
        data: {
          token: 'mock_jwt_token_' + Date.now(),
          expires_in: 7200,
          refresh_token: 'mock_refresh_token',
          user: {
            user_id: 'u001',
            username: body.username,
            display_name: body.username === 'admin' ? '管理员' : '张三',
            role: body.username === 'admin' ? 'GROUP_ADMIN' : 'PROVINCE_ADMIN',
            province_code: 'GD',
            province_name: '广东',
            permissions: ['rule:create', 'rule:edit', 'rule:delete', 'rule:list', 'alarm:confirm', 'alarm:list', 'report:view', 'report:export', 'alarm:export'],
          },
        },
      });
    }
    return HttpResponse.json({ code: 401, message: '用户名或密码错误', data: null });
  }),

  http.post(`${BASE}/auth/refresh`, async () => {
    await delay(200);
    return HttpResponse.json({ code: 0, message: 'success', data: { token: 'mock_jwt_token_refreshed', expires_in: 7200 } });
  }),

  http.get(`${BASE}/auth/me`, async () => {
    await delay(200);
    return HttpResponse.json({
      code: 0, message: 'success',
      data: {
        user_id: 'u001', username: 'zhangsan', display_name: '张三',
        role: 'PROVINCE_ADMIN', province_code: 'GD', province_name: '广东',
        permissions: ['rule:create', 'rule:edit', 'rule:delete', 'rule:list', 'alarm:confirm', 'alarm:list', 'report:view', 'report:export', 'alarm:export'],
      },
    });
  }),

  // Rules
  http.get(`${BASE}/rules`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const neType = url.searchParams.get('ne_type');
    const status = url.searchParams.get('status');
    const ruleName = url.searchParams.get('rule_name');
    const scene = url.searchParams.get('scene');
    const severity = url.searchParams.get('severity');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('page_size') || '20');

    let filtered = [...mockRules];
    if (neType) filtered = filtered.filter(r => r.ne_type === neType);
    if (status !== null) filtered = filtered.filter(r => r.status === Number(status));
    if (ruleName) filtered = filtered.filter(r => r.rule_name.includes(ruleName));
    if (severity) filtered = filtered.filter(r => r.severity === Number(severity));
    if (scene) {
      const scenes = scene.split(',');
      filtered = filtered.filter(r => r.scene?.some((s: string) => scenes.includes(s)));
    }

    const total = filtered.length;
    const list = filtered.slice((page - 1) * pageSize, page * pageSize);

    return HttpResponse.json({ code: 0, message: 'success', data: { total, page, page_size: pageSize, list } });
  }),

  http.get(`${BASE}/rules/:id`, async ({ params }) => {
    await delay(300);
    const rule = mockRules.find(r => r.rule_id === Number(params.id));
    if (rule) return HttpResponse.json({ code: 0, message: 'success', data: rule });
    return HttpResponse.json({ code: 10007, message: '规则不存在', data: null });
  }),

  http.post(`${BASE}/rules`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as any;
    const newRule = { ...body, rule_id: Date.now(), created_at: new Date().toISOString().slice(0, 19).replace('T', ' '), updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ') };
    return HttpResponse.json({ code: 0, message: 'success', data: { rule_id: newRule.rule_id, rule_name: newRule.rule_name } });
  }),

  http.put(`${BASE}/rules/:id`, async ({ params }) => {
    await delay(500);
    return HttpResponse.json({ code: 0, message: 'success', data: { rule_id: Number(params.id), affected_events: 2, message: '此修改将影响2条正在生效的告警事件' } });
  }),

  http.delete(`${BASE}/rules/:id`, async () => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: null });
  }),

  http.put(`${BASE}/rules/batch-status`, async () => {
    await delay(400);
    return HttpResponse.json({ code: 0, message: 'success', data: { success_count: 3, fail_count: 0 } });
  }),

  http.delete(`${BASE}/rules/batch`, async () => {
    await delay(400);
    return HttpResponse.json({ code: 0, message: 'success', data: { success_count: 2, fail_count: 0, fail_rules: [] } });
  }),

  http.get(`${BASE}/rules/check-name`, async () => {
    await delay(200);
    return HttpResponse.json({ code: 0, message: 'success', data: { available: true } });
  }),

  http.post(`${BASE}/rules/simulate`, async () => {
    await delay(1500);
    return HttpResponse.json({
      code: 0, message: 'success',
      data: {
        triggered_count: 12,
        filtered_flash_count: 23,
        filtered_normal_count: 47,
        triggered_events: [
          { ne_id: 'NE-AMF-GD-001', ne_name: 'AMF-GD-01', triggered_at: '2026-04-12 10:23:00', duration_minutes: 15, severity: 2 },
          { ne_id: 'NE-AMF-GD-001', ne_name: 'AMF-GD-01', triggered_at: '2026-04-13 14:05:00', duration_minutes: 8, severity: 2 },
          { ne_id: 'NE-AMF-HN-003', ne_name: 'AMF-HN-03', triggered_at: '2026-04-14 09:17:00', duration_minutes: 45, severity: 2 },
          { ne_id: 'NE-AMF-BJ-002', ne_name: 'AMF-BJ-02', triggered_at: '2026-04-14 16:42:00', duration_minutes: 12, severity: 2 },
        ],
        assessment: {
          daily_avg_triggers: 1.7,
          flash_filter_rate: 0.66,
          max_duration_minutes: 45,
          max_duration_ne: 'AMF-HN-03',
          recommendation: '日均告警频率合理，闪断过滤率66%窗口配置有效',
        },
      },
    });
  }),

  http.post(`${BASE}/rules/:id/simulate`, async () => {
    await delay(1500);
    return HttpResponse.json({
      code: 0, message: 'success',
      data: {
        triggered_count: 8,
        filtered_flash_count: 15,
        filtered_normal_count: 32,
        triggered_events: [
          { ne_id: 'NE-AMF-GD-001', ne_name: 'AMF-GD-01', triggered_at: '2026-04-12 10:23:00', duration_minutes: 15, severity: 2 },
        ],
        assessment: {
          daily_avg_triggers: 1.1,
          flash_filter_rate: 0.55,
          max_duration_minutes: 28,
          max_duration_ne: 'AMF-GD-02',
          recommendation: '日均告警频率合理，闪断过滤率55%，可考虑增大观察窗口',
        },
      },
    });
  }),

  // Templates
  http.get(`${BASE}/templates`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const neType = url.searchParams.get('ne_type');
    let filtered = [...mockTemplates];
    if (neType) filtered = filtered.filter(t => t.ne_type === neType);
    return HttpResponse.json({ code: 0, message: 'success', data: { total: filtered.length, page: 1, page_size: 20, list: filtered } });
  }),

  http.get(`${BASE}/templates/:id`, async ({ params }) => {
    await delay(300);
    const t = mockTemplates.find(t => t.template_id === Number(params.id));
    if (t) return HttpResponse.json({ code: 0, message: 'success', data: t });
    return HttpResponse.json({ code: 10009, message: '模板不存在', data: null });
  }),

  http.post(`${BASE}/templates/:id/create-rule`, async () => {
    await delay(600);
    return HttpResponse.json({ code: 0, message: 'success', data: { rule_id: Date.now(), rule_name: '从模板创建的规则' } });
  }),

  // Metrics
  http.get(`${BASE}/metrics/query`, async ({ request }) => {
    await delay(600);
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    if (page) {
      return HttpResponse.json({ code: 0, message: 'success', data: mockMetricsTable });
    }
    return HttpResponse.json({ code: 0, message: 'success', data: mockMetricsSeries });
  }),

  http.get(`${BASE}/metrics/summary`, async () => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: mockMetricsSummary });
  }),

  http.get(`${BASE}/metrics/distribution`, async () => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: mockMetricsDistribution });
  }),

  // Alarms
  http.get(`${BASE}/alarms`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const scene = url.searchParams.get('scene');
    let filtered = [...mockAlarms];
    if (severity) {
      const levels = severity.split(',').map(Number);
      filtered = filtered.filter(a => levels.includes(a.severity));
    }
    if (status) {
      const statuses = status.split(',');
      filtered = filtered.filter(a => statuses.includes(a.status));
    }
    if (scene) {
      const scenes = scene.split(',');
      filtered = filtered.filter(a => a.scene?.some((s: string) => scenes.includes(s)));
    }
    return HttpResponse.json({
      code: 0, message: 'success',
      data: { total: filtered.length, page: 1, page_size: 20, severity_summary: generateSeveritySummary(), list: filtered },
    });
  }),

  // Alarms Aggregated (MUST be before /alarms/:id to avoid route collision)
  http.get(`${BASE}/alarms/aggregated`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const severity = url.searchParams.get('severity');
    let filtered = [...mockAggregatedAlarms];
    if (severity) {
      const levels = severity.split(',').map(Number);
      filtered = filtered.filter(a => levels.includes(a.severity));
    }
    return HttpResponse.json({
      code: 0, message: 'success',
      data: { total: filtered.length, severity_summary: generateSeveritySummary(), list: filtered },
    });
  }),

  http.get(`${BASE}/alarms/:id`, async ({ params }) => {
    await delay(400);
    const alarm = mockAlarmDetail(Number(params.id));
    return HttpResponse.json({ code: 0, message: 'success', data: alarm });
  }),

  http.put(`${BASE}/alarms/:id/confirm`, async ({ params }) => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: { event_id: Number(params.id), status: 'confirmed' } });
  }),

  http.put(`${BASE}/alarms/:id/false-alarm`, async ({ params }) => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: { event_id: Number(params.id), status: 'false_alarm' } });
  }),

  http.put(`${BASE}/alarms/:id/transfer`, async ({ params }) => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: { event_id: Number(params.id), status: 'pending', handler: '王五' } });
  }),

  http.put(`${BASE}/alarms/:id/escalate`, async ({ params }) => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: { event_id: Number(params.id), severity: 1 } });
  }),

  http.put(`${BASE}/alarms/:id/close`, async ({ params }) => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: { event_id: Number(params.id), status: 'closed', resolved_at: new Date().toISOString().slice(0, 19).replace('T', ' ') } });
  }),

  http.put(`${BASE}/alarms/batch-confirm`, async () => {
    await delay(400);
    return HttpResponse.json({ code: 0, message: 'success', data: { success_count: 3, fail_count: 0 } });
  }),

  http.put(`${BASE}/alarms/batch-transfer`, async () => {
    await delay(400);
    return HttpResponse.json({ code: 0, message: 'success', data: { success_count: 2, fail_count: 0 } });
  }),

  http.put(`${BASE}/alarms/batch-false-alarm`, async () => {
    await delay(400);
    return HttpResponse.json({ code: 0, message: 'success', data: { success_count: 2, fail_count: 0 } });
  }),

  // Exports
  http.post(`${BASE}/exports`, async () => {
    await delay(300);
    return HttpResponse.json({ code: 0, message: 'success', data: { task_id: 'export_' + Date.now(), status: 'processing', estimated_rows: 14400, estimated_seconds: 15 } });
  }),

  http.get(`${BASE}/exports/:id`, async () => {
    await delay(200);
    return HttpResponse.json({
      code: 0, message: 'success',
      data: { task_id: 'export_001', export_type: 'metric_report', status: 'completed', progress: 100, total_rows: 14400, file_name: '黄金指标报表_20260416.xlsx', file_size: '2.3MB', download_url: '/api/v1/exports/export_001/download?token=xxx', created_at: '2026-04-16 18:00:00', completed_at: '2026-04-16 18:00:12' },
    });
  }),

  http.get(`${BASE}/exports`, async () => {
    await delay(200);
    return HttpResponse.json({
      code: 0, message: 'success',
      data: { total: 1, page: 1, page_size: 10, list: [{ task_id: 'export_001', export_type: 'metric_report', status: 'completed', file_name: '黄金指标报表_20260416.xlsx', created_at: '2026-04-16 18:00:00' }] },
    });
  }),

  // Common
  http.get(`${BASE}/common/ne-types`, async () => {
    await delay(200);
    return HttpResponse.json({ code: 0, message: 'success', data: mockNeTypes });
  }),

  http.get(`${BASE}/common/metrics`, async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const neType = url.searchParams.get('ne_type');
    return HttpResponse.json({ code: 0, message: 'success', data: mockMetricsByType(neType || 'AMF') });
  }),

  http.get(`${BASE}/common/filter-options`, async () => {
    await delay(200);
    return HttpResponse.json({ code: 0, message: 'success', data: mockFilterOptions });
  }),

  http.get(`${BASE}/common/ne-search`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const keyword = url.searchParams.get('keyword') || '';
    return HttpResponse.json({ code: 0, message: 'success', data: mockNeSearchResults(keyword) });
  }),

  http.get(`${BASE}/common/operators`, async () => {
    await delay(200);
    return HttpResponse.json({ code: 0, message: 'success', data: mockOperators });
  }),
];
