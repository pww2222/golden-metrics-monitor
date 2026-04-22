function generateTimeSeries(hours: number, baseValue: number, variance: number, alarmStart?: number, alarmEnd?: number) {
  const points: { time: string; value: number; is_alarm: boolean }[] = [];
  const now = new Date();
  const totalPoints = hours * 60;
  for (let i = totalPoints; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60000);
    const timeStr = t.toISOString().slice(0, 19).replace('T', ' ');
    let value = baseValue + (Math.random() - 0.5) * variance;
    const minuteIdx = totalPoints - i;
    const isAlarm = alarmStart !== undefined && alarmEnd !== undefined && minuteIdx >= alarmStart && minuteIdx <= alarmEnd;
    if (isAlarm) {
      value = baseValue - variance * (1.5 + Math.random());
    }
    value = Math.round(value * 100) / 100;
    points.push({ time: timeStr, value, is_alarm: isAlarm });
  }
  return points;
}

export const mockMetricsSeries = {
  metric_unit: 'percent',
  series: [
    {
      ne_id: 'NE-AMF-GD-001', ne_name: 'AMF-GD-01', metric_code: 'registration_rate', metric_name: '注册成功率',
      data_points: generateTimeSeries(24, 98.5, 3, 300, 320),
    },
    {
      ne_id: 'NE-AMF-GD-002', ne_name: 'AMF-GD-02', metric_code: 'registration_rate', metric_name: '注册成功率',
      data_points: generateTimeSeries(24, 97.8, 2.5),
    },
    {
      ne_id: 'NE-AMF-GD-003', ne_name: 'AMF-GD-03', metric_code: 'registration_rate', metric_name: '注册成功率',
      data_points: generateTimeSeries(24, 99.1, 1.8, 500, 510),
    },
  ],
  threshold_lines: [
    { rule_id: 1001, rule_name: 'AMF注册成功率异常监控', metric_code: 'registration_rate', threshold_type: 'absolute', threshold_value: 95, operator: 'lt' },
  ],
  alarm_zones: [
    { rule_id: 1001, start_time: '2026-04-17 10:23:00', end_time: '2026-04-17 10:38:00', severity: 2 },
  ],
};

export const mockMetricsTable = {
  total: 150,
  page: 1,
  page_size: 50,
  columns: [
    { key: 'ne_name', title: '网元名称', width: 160 },
    { key: 'metric_registration_rate', title: '注册成功率', width: 120 },
    { key: 'metric_session_setup_rate', title: '会话建立率', width: 120 },
    { key: 'metric_handover_rate', title: '切换成功率', width: 120 },
    { key: 'alarm_status', title: '状态', width: 80 },
  ],
  list: [
    { ne_id: 'NE-AMF-GD-001', ne_name: 'AMF-GD-01', metric_registration_rate: { value: 87.3, is_alarm: true }, metric_session_setup_rate: { value: 98.2, is_alarm: false }, metric_handover_rate: { value: 99.1, is_alarm: false }, alarm_status: 'alarm', alarm_severity: 2 },
    { ne_id: 'NE-AMF-GD-002', ne_name: 'AMF-GD-02', metric_registration_rate: { value: 96.5, is_alarm: false }, metric_session_setup_rate: { value: 97.8, is_alarm: false }, metric_handover_rate: { value: 98.9, is_alarm: false }, alarm_status: 'normal', alarm_severity: null },
    { ne_id: 'NE-AMF-GD-003', ne_name: 'AMF-GD-03', metric_registration_rate: { value: 94.1, is_alarm: true }, metric_session_setup_rate: { value: 96.3, is_alarm: true }, metric_handover_rate: { value: 99.5, is_alarm: false }, alarm_status: 'alarm', alarm_severity: 3 },
    { ne_id: 'NE-AMF-GD-004', ne_name: 'AMF-GD-04', metric_registration_rate: { value: 98.7, is_alarm: false }, metric_session_setup_rate: { value: 99.1, is_alarm: false }, metric_handover_rate: { value: 99.8, is_alarm: false }, alarm_status: 'normal', alarm_severity: null },
    { ne_id: 'NE-AMF-BJ-001', ne_name: 'AMF-BJ-01', metric_registration_rate: { value: 97.5, is_alarm: false }, metric_session_setup_rate: { value: 98.0, is_alarm: false }, metric_handover_rate: { value: 99.3, is_alarm: false }, alarm_status: 'normal', alarm_severity: null },
  ],
};

export const mockMetricsSummary = {
  alarm_ne_count: 23,
  normal_ne_count: 7977,
  top5_alarms: [
    { ne_id: 'NE-AMF-GD-001', ne_name: 'APP-HBBADsxAMF003BZX-08AZX011', ne_type: 'AMF', severity: 1, event_title: 'AMF（黄金指标）AMF排除用户原因的初始注册成功率低于三级门限' },
    { ne_id: 'NE-UPF-GD-003', ne_name: 'UPF-GD-03', ne_type: 'UPF', severity: 1, event_title: '会话建立率低' },
    { ne_id: 'NE-SMF-BJ-002', ne_name: 'APP-XNCDgzSMF015BZX-11AZX012', ne_type: 'SMF', severity: 2, event_title: 'SMF（黄金指标）5G SA会话建立成功率低于四级门限' },
    { ne_id: 'NE-MME-SH-001', ne_name: 'MME-SH-01', ne_type: 'MME', severity: 3, event_title: '切换成功率低' },
    { ne_id: 'NE-AMF-HN-005', ne_name: 'AMF-HN-05', ne_type: 'AMF', severity: 4, event_title: 'AMF（黄金指标）AMF排除用户原因的初始注册成功率低于三级门限' },
  ],
  anomaly_trend: [
    { time: '2026-04-17 09:00:00', count: 3 },
    { time: '2026-04-17 09:15:00', count: 5 },
    { time: '2026-04-17 09:30:00', count: 7 },
    { time: '2026-04-17 09:45:00', count: 10 },
    { time: '2026-04-17 10:00:00', count: 8 },
    { time: '2026-04-17 10:15:00', count: 12 },
    { time: '2026-04-17 10:30:00', count: 9 },
    { time: '2026-04-17 10:45:00', count: 6 },
  ],
};

export const mockMetricsDistribution = {
  metric_code: 'registration_rate',
  metric_name: '注册成功率',
  metric_unit: 'percent',
  percentiles: { p5: 94.2, p25: 97.1, p50: 98.5, p75: 99.1, p95: 99.7 },
  sample_count: 1440,
  threshold_coverage: 2.1,
  threshold_coverage_description: '当前阈值将覆盖约2.1%的采集点(历史统计)',
};
