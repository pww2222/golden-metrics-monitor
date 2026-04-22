// 应用场景枚举
export const sceneOptions = [
  { value: 'fault_dispatch', label: '故障派单' },
  { value: 'biz_monitor', label: '业务受损监控' },
  { value: 'auto_remediation', label: '动网自动化' },
] as const;

export const mockRules = [
  {
    rule_id: 1001, rule_name: 'AMF注册成功率异常监控', ne_type: 'AMF', severity: 2,
    scene: ['fault_dispatch', 'biz_monitor'],
    conditions: [{ metric_code: 'registration_rate', metric_name: '注册成功率', metric_unit: 'percent', threshold_type: 'qoq', operator: 'lt', threshold_value: -20, offset_percent: -20 }],
    logic_operator: 'AND', observe_window: 3, recovery_window: 3,
    effective_type: 'custom', effective_periods: { start_time: '08:00', end_time: '20:00' },
    effective_weekdays: '1,2,3,4,5',
    exception_dates: [{ date: '2026-05-01', name: '劳动节', repeat_yearly: true }],
    status: 1, sop_template: '1. 检查AMF进程状态\n2. 查看注册接口日志\n3. 检查HSS/UDM连接状态',
    created_by: 'zhangsan', created_at: '2026-04-10 14:30:00', updated_at: '2026-04-16 09:15:00',
  },
  {
    rule_id: 1002, rule_name: 'AMF会话建立率监控', ne_type: 'AMF', severity: 1,
    scene: ['fault_dispatch'],
    conditions: [{ metric_code: 'session_setup_rate', metric_name: '会话建立率', metric_unit: 'percent', threshold_type: 'absolute', operator: 'lt', threshold_value: 95 }],
    logic_operator: 'AND', observe_window: 3, recovery_window: 5,
    effective_type: 'always', effective_periods: null, effective_weekdays: '', exception_dates: [],
    status: 1, sop_template: '1. 检查SMF连接\n2. 查看会话建立日志', created_by: 'zhangsan', created_at: '2026-04-11 10:00:00', updated_at: '2026-04-15 16:20:00',
  },
  {
    rule_id: 1003, rule_name: 'AMF切换成功率下降检测', ne_type: 'AMF', severity: 3,
    scene: ['biz_monitor'],
    conditions: [{ metric_code: 'handover_rate', metric_name: '切换成功率', metric_unit: 'percent', threshold_type: 'yoy', operator: 'lt', threshold_value: -15, offset_percent: -15 }],
    logic_operator: 'AND', observe_window: 5, recovery_window: 3,
    effective_type: 'custom', effective_periods: { start_time: '08:00', end_time: '22:00' }, effective_weekdays: '1,2,3,4,5', exception_dates: [],
    status: 0, sop_template: '', created_by: 'lisi', created_at: '2026-04-12 09:00:00', updated_at: '2026-04-14 11:30:00',
  },
  {
    rule_id: 1004, rule_name: 'SMF N2接口异常检测', ne_type: 'SMF', severity: 1,
    scene: ['fault_dispatch', 'biz_monitor', 'auto_remediation'],
    conditions: [
      { metric_code: 'n2_interface_delay', metric_name: 'N2接口延迟', metric_unit: 'value', threshold_type: 'absolute', operator: 'gt', threshold_value: 500 },
      { metric_code: 'session_setup_rate', metric_name: '会话建立率', metric_unit: 'percent', threshold_type: 'absolute', operator: 'lt', threshold_value: 90 },
    ],
    logic_operator: 'AND', observe_window: 3, recovery_window: 3,
    effective_type: 'cutover', effective_periods: null, effective_weekdays: '', exception_dates: [],
    status: 1, sop_template: '1. 检查N2接口状态\n2. 查看SMF日志\n3. 联系华为支持', created_by: 'zhangsan', created_at: '2026-04-13 08:30:00', updated_at: '2026-04-16 10:00:00',
  },
  {
    rule_id: 1005, rule_name: 'UPF吞吐量异常监控', ne_type: 'UPF', severity: 2,
    scene: ['biz_monitor', 'auto_remediation'],
    conditions: [{ metric_code: 'throughput', metric_name: '吞吐量', metric_unit: 'value', threshold_type: 'qoq', operator: 'lt', threshold_value: -30, offset_percent: -30 }],
    logic_operator: 'AND', observe_window: 5, recovery_window: 5,
    effective_type: 'always', effective_periods: null, effective_weekdays: '', exception_dates: [],
    status: 1, sop_template: '1. 检查UPF负载\n2. 查看数据面日志', created_by: 'lisi', created_at: '2026-04-14 14:00:00', updated_at: '2026-04-15 09:30:00',
  },
  {
    rule_id: 1006, rule_name: 'MME附着成功率监控', ne_type: 'MME', severity: 2,
    scene: ['fault_dispatch'],
    conditions: [{ metric_code: 'attach_rate', metric_name: '附着成功率', metric_unit: 'percent', threshold_type: 'absolute', operator: 'lt', threshold_value: 97 }],
    logic_operator: 'AND', observe_window: 3, recovery_window: 3,
    effective_type: 'always', effective_periods: null, effective_weekdays: '', exception_dates: [],
    status: 1, sop_template: '1. 检查MME进程\n2. 查看S1-MME接口', created_by: 'zhangsan', created_at: '2026-04-15 10:00:00', updated_at: '2026-04-16 08:00:00',
  },
  {
    rule_id: 1007, rule_name: 'SMF会话建立率联合检测', ne_type: 'SMF', severity: 1,
    scene: ['auto_remediation'],
    conditions: [
      { metric_code: 'session_setup_rate', metric_name: '会话建立率', metric_unit: 'percent', threshold_type: 'absolute', operator: 'lt', threshold_value: 95 },
      { metric_code: 'n2_interface_delay', metric_name: 'N2接口延迟', metric_unit: 'value', threshold_type: 'absolute', operator: 'gt', threshold_value: 300 },
    ],
    logic_operator: 'OR', observe_window: 2, recovery_window: 3,
    effective_type: 'non_cutover', effective_periods: { start_time: '00:00', end_time: '23:59' }, effective_weekdays: '1,2,3,4,5,6,7', exception_dates: [],
    status: 1, sop_template: '1. 检查SMF状态\n2. 查看N2接口\n3. 检查UPF连接', created_by: 'zhangsan', created_at: '2026-04-15 15:00:00', updated_at: '2026-04-16 11:00:00',
  },
  {
    rule_id: 1008, rule_name: 'UPF会话建立率低告警', ne_type: 'UPF', severity: 1,
    scene: ['fault_dispatch', 'auto_remediation'],
    conditions: [{ metric_code: 'session_setup_rate', metric_name: '会话建立率', metric_unit: 'percent', threshold_type: 'absolute', operator: 'lt', threshold_value: 95 }],
    logic_operator: 'AND', observe_window: 3, recovery_window: 3,
    effective_type: 'always', effective_periods: null, effective_weekdays: '', exception_dates: [],
    status: 1, sop_template: '1. 检查UPF进程状态\n2. 查看N4接口日志', created_by: 'lisi', created_at: '2026-04-16 08:00:00', updated_at: '2026-04-16 09:00:00',
  },
  {
    rule_id: 1009, rule_name: 'HSS鉴权成功率监控', ne_type: 'HSS', severity: 3,
    scene: ['biz_monitor'],
    conditions: [{ metric_code: 'auth_rate', metric_name: '鉴权成功率', metric_unit: 'percent', threshold_type: 'absolute', operator: 'lt', threshold_value: 98 }],
    logic_operator: 'AND', observe_window: 5, recovery_window: 3,
    effective_type: 'always', effective_periods: null, effective_weekdays: '', exception_dates: [],
    status: 0, sop_template: '', created_by: 'zhangsan', created_at: '2026-04-16 09:00:00', updated_at: '2026-04-16 10:00:00',
  },
  {
    rule_id: 1010, rule_name: 'UDM注册率异常检测', ne_type: 'UDM', severity: 2,
    scene: ['fault_dispatch', 'biz_monitor', 'auto_remediation'],
    conditions: [{ metric_code: 'registration_rate', metric_name: '注册成功率', metric_unit: 'percent', threshold_type: 'qoq', operator: 'lt', threshold_value: -15, offset_percent: -15 }],
    logic_operator: 'AND', observe_window: 3, recovery_window: 3,
    effective_type: 'always', effective_periods: null, effective_weekdays: '', exception_dates: [],
    status: 1, sop_template: '1. 检查UDM进程\n2. 查看订阅接口日志', created_by: 'lisi', created_at: '2026-04-16 10:00:00', updated_at: '2026-04-16 11:00:00',
  },
];

export const mockTemplates = [
  { template_id: 1, template_name: 'AMF注册成功率异常监控', ne_type: 'AMF', metric_code: 'registration_rate', metric_name: '注册成功率', threshold_type: 'qoq', threshold_value: -20, operator: 'lt', observe_window: 3, recovery_window: 3, severity: 2, usage_count: 156, description: 'AMF注册成功率环比下降超过20%时触发告警' },
  { template_id: 2, template_name: 'AMF会话建立率监控', ne_type: 'AMF', metric_code: 'session_setup_rate', metric_name: '会话建立率', threshold_type: 'absolute', threshold_value: 95, operator: 'lt', observe_window: 3, recovery_window: 5, severity: 1, usage_count: 203, description: 'AMF会话建立率低于95%时触发告警' },
  { template_id: 3, template_name: 'SMF N2接口异常检测', ne_type: 'SMF', metric_code: 'n2_interface_delay', metric_name: 'N2接口延迟', threshold_type: 'absolute', threshold_value: 500, operator: 'gt', observe_window: 3, recovery_window: 3, severity: 1, usage_count: 89, description: 'N2接口延迟超过500ms时触发告警' },
  { template_id: 4, template_name: 'UPF会话建立率监控', ne_type: 'UPF', metric_code: 'session_setup_rate', metric_name: '会话建立率', threshold_type: 'absolute', threshold_value: 95, operator: 'lt', observe_window: 5, recovery_window: 3, severity: 1, usage_count: 178, description: 'UPF会话建立率低于95%时触发告警' },
  { template_id: 5, template_name: 'MME附着成功率监控', ne_type: 'MME', metric_code: 'attach_rate', metric_name: '附着成功率', threshold_type: 'absolute', threshold_value: 97, operator: 'lt', observe_window: 3, recovery_window: 3, severity: 2, usage_count: 134, description: 'MME附着成功率低于97%时触发告警' },
  { template_id: 6, template_name: 'SMF会话建立率联合检测', ne_type: 'SMF', metric_code: 'session_setup_rate', metric_name: '会话建立率+N2延迟联合', threshold_type: 'absolute', threshold_value: 90, operator: 'lt', observe_window: 2, recovery_window: 3, severity: 1, usage_count: 67, description: '会话建立率<90%或N2延迟>300ms时触发' },
  { template_id: 7, template_name: 'HSS鉴权成功率监控', ne_type: 'HSS', metric_code: 'auth_rate', metric_name: '鉴权成功率', threshold_type: 'absolute', threshold_value: 98, operator: 'lt', observe_window: 5, recovery_window: 3, severity: 3, usage_count: 45, description: 'HSS鉴权成功率低于98%时触发告警' },
  { template_id: 8, template_name: 'UDM注册成功率监控', ne_type: 'UDM', metric_code: 'registration_rate', metric_name: '注册成功率', threshold_type: 'qoq', threshold_value: -15, operator: 'lt', observe_window: 3, recovery_window: 3, severity: 2, usage_count: 112, description: 'UDM注册成功率环比下降超过15%时触发' },
];
