export const mockNeTypes = [
  { code: 'AMF', name: 'AMF', metric_count: 10 },
  { code: 'SMF', name: 'SMF', metric_count: 10 },
  { code: 'UPF', name: 'UPF', metric_count: 10 },
  { code: 'MME', name: 'MME', metric_count: 8 },
  { code: 'S-GW', name: 'S-GW', metric_count: 6 },
  { code: 'P-GW', name: 'P-GW', metric_count: 6 },
  { code: 'HSS', name: 'HSS', metric_count: 5 },
  { code: 'UDM', name: 'UDM', metric_count: 5 },
  { code: 'AUSF', name: 'AUSF', metric_count: 4 },
  { code: 'PCF', name: 'PCF', metric_count: 4 },
  { code: 'NRF', name: 'NRF', metric_count: 3 },
  { code: 'NSSF', name: 'NSSF', metric_count: 3 },
  { code: 'BSF', name: 'BSF', metric_count: 3 },
  { code: 'CHF', name: 'CHF', metric_count: 3 },
  { code: 'NEF', name: 'NEF', metric_count: 3 },
  { code: 'SEPP', name: 'SEPP', metric_count: 2 },
  { code: 'SCP', name: 'SCP', metric_count: 2 },
  { code: 'DRA', name: 'DRA', metric_count: 3 },
  { code: 'DNS', name: 'DNS', metric_count: 2 },
  { code: 'NTP', name: 'NTP', metric_count: 2 },
];

const metricsMap: Record<string, { metric_code: string; metric_name: string; metric_unit: string; description: string }[]> = {
  AMF: [
    { metric_code: 'registration_rate', metric_name: '注册成功率', metric_unit: 'percent', description: 'AMF注册成功次数/总注册请求次数×100%' },
    { metric_code: 'session_setup_rate', metric_name: '会话建立率', metric_unit: 'percent', description: '会话建立成功次数/总会话建立请求×100%' },
    { metric_code: 'handover_rate', metric_name: '切换成功率', metric_unit: 'percent', description: '切换成功次数/总切换请求×100%' },
    { metric_code: 'n2_interface_delay', metric_name: 'N2接口延迟', metric_unit: 'value', description: 'N2接口平均响应时延(ms)' },
    { metric_code: 'paging_rate', metric_name: '寻呼成功率', metric_unit: 'percent', description: '寻呼成功次数/总寻呼请求×100%' },
    { metric_code: 'cpu_usage', metric_name: 'CPU使用率', metric_unit: 'percent', description: 'AMF进程CPU占用率' },
    { metric_code: 'memory_usage', metric_name: '内存使用率', metric_unit: 'percent', description: 'AMF进程内存占用率' },
    { metric_code: 'active_ue_count', metric_name: '在线UE数', metric_unit: 'value', description: '当前在线用户设备数' },
    { metric_code: 'registration_attempt', metric_name: '注册请求次数', metric_unit: 'value', description: '1分钟内注册请求总数' },
    { metric_code: 'handover_attempt', metric_name: '切换请求次数', metric_unit: 'value', description: '1分钟内切换请求总数' },
  ],
  SMF: [
    { metric_code: 'session_setup_rate', metric_name: '会话建立率', metric_unit: 'percent', description: 'SMF会话建立成功率' },
    { metric_code: 'n2_interface_delay', metric_name: 'N2接口延迟', metric_unit: 'value', description: 'N2接口平均时延(ms)' },
    { metric_code: 'n4_interface_delay', metric_name: 'N4接口延迟', metric_unit: 'value', description: 'N4接口平均时延(ms)' },
    { metric_code: 'session_release_rate', metric_name: '会话释放率', metric_unit: 'percent', description: '异常会话释放比例' },
    { metric_code: 'active_session_count', metric_name: '活跃会话数', metric_unit: 'value', description: '当前活跃PDU会话数' },
    { metric_code: 'cpu_usage', metric_name: 'CPU使用率', metric_unit: 'percent', description: 'SMF进程CPU占用率' },
    { metric_code: 'memory_usage', metric_name: '内存使用率', metric_unit: 'percent', description: 'SMF进程内存占用率' },
    { metric_code: 'session_create_attempt', metric_name: '会话创建请求', metric_unit: 'value', description: '1分钟内会话创建请求数' },
    { metric_code: 'policy_control_rate', metric_name: '策略控制成功率', metric_unit: 'percent', description: 'PCF策略执行成功率' },
    { metric_code: 'charging_success_rate', metric_name: '计费成功率', metric_unit: 'percent', description: 'CHF计费交互成功率' },
  ],
  UPF: [
    { metric_code: 'session_setup_rate', metric_name: '会话建立率', metric_unit: 'percent', description: 'UPF会话建立成功率' },
    { metric_code: 'throughput', metric_name: '吞吐量', metric_unit: 'value', description: 'UPF数据面吞吐量(Mbps)' },
    { metric_code: 'packet_loss_rate', metric_name: '丢包率', metric_unit: 'percent', description: 'UPF数据面丢包率' },
    { metric_code: 'n4_interface_delay', metric_name: 'N4接口延迟', metric_unit: 'value', description: 'N4接口平均时延(ms)' },
    { metric_code: 'active_session_count', metric_name: '活跃会话数', metric_unit: 'value', description: '当前活跃PDU会话数' },
    { metric_code: 'downlink_throughput', metric_name: '下行吞吐量', metric_unit: 'value', description: '下行数据吞吐量(Mbps)' },
    { metric_code: 'uplink_throughput', metric_name: '上行吞吐量', metric_unit: 'value', description: '上行数据吞吐量(Mbps)' },
    { metric_code: 'cpu_usage', metric_name: 'CPU使用率', metric_unit: 'percent', description: 'UPF进程CPU占用率' },
    { metric_code: 'memory_usage', metric_name: '内存使用率', metric_unit: 'percent', description: 'UPF进程内存占用率' },
    { metric_code: 'delay', metric_name: '转发时延', metric_unit: 'value', description: '数据包平均转发时延(ms)' },
  ],
  MME: [
    { metric_code: 'attach_rate', metric_name: '附着成功率', metric_unit: 'percent', description: 'MME附着成功率' },
    { metric_code: 'handover_rate', metric_name: '切换成功率', metric_unit: 'percent', description: 'MME切换成功率' },
    { metric_code: 's1_interface_delay', metric_name: 'S1-MME延迟', metric_unit: 'value', description: 'S1-MME接口时延(ms)' },
    { metric_code: 'paging_rate', metric_name: '寻呼成功率', metric_unit: 'percent', description: '寻呼成功率' },
    { metric_code: 'tau_rate', metric_name: 'TAU成功率', metric_unit: 'percent', description: '跟踪区更新成功率' },
    { metric_code: 'active_ue_count', metric_name: '在线UE数', metric_unit: 'value', description: '当前在线UE数' },
    { metric_code: 'cpu_usage', metric_name: 'CPU使用率', metric_unit: 'percent', description: 'MME进程CPU占用率' },
    { metric_code: 'memory_usage', metric_name: '内存使用率', metric_unit: 'percent', description: 'MME进程内存占用率' },
  ],
  HSS: [
    { metric_code: 'auth_rate', metric_name: '鉴权成功率', metric_unit: 'percent', description: 'HSS鉴权成功率' },
    { metric_code: 'subscriber_query_rate', metric_name: '用户查询成功率', metric_unit: 'percent', description: '用户数据查询成功率' },
    { metric_code: 'diameter_delay', metric_name: 'Diameter延迟', metric_unit: 'value', description: 'Diameter接口平均时延(ms)' },
    { metric_code: 'cpu_usage', metric_name: 'CPU使用率', metric_unit: 'percent', description: 'HSS进程CPU占用率' },
    { metric_code: 'memory_usage', metric_name: '内存使用率', metric_unit: 'percent', description: 'HSS进程内存占用率' },
  ],
  UDM: [
    { metric_code: 'registration_rate', metric_name: '注册成功率', metric_unit: 'percent', description: 'UDM注册成功率' },
    { metric_code: 'subscription_rate', metric_name: '订阅成功率', metric_unit: 'percent', description: 'UDM订阅操作成功率' },
    { metric_code: 'sbi_delay', metric_name: 'SBI接口延迟', metric_unit: 'value', description: 'SBI接口平均时延(ms)' },
    { metric_code: 'cpu_usage', metric_name: 'CPU使用率', metric_unit: 'percent', description: 'UDM进程CPU占用率' },
    { metric_code: 'memory_usage', metric_name: '内存使用率', metric_unit: 'percent', description: 'UDM进程内存占用率' },
  ],
};

export function mockMetricsByType(neType: string) {
  return metricsMap[neType] || metricsMap['AMF'];
}

export const mockFilterOptions = {
  provinces: [
    { code: 'GD', name: '广东' }, { code: 'BJ', name: '北京' }, { code: 'SH', name: '上海' },
    { code: 'HN', name: '河南' }, { code: 'ZJ', name: '浙江' }, { code: 'JS', name: '江苏' },
    { code: 'SD', name: '山东' }, { code: 'SC', name: '四川' }, { code: 'HB', name: '湖北' },
    { code: 'FJ', name: '福建' },
  ],
  majors: [
    { code: '5G', name: '5G' }, { code: '4G', name: '4G' }, { code: 'IMS', name: 'IMS' },
  ],
  ne_types: [
    { code: 'AMF', name: 'AMF' }, { code: 'SMF', name: 'SMF' }, { code: 'UPF', name: 'UPF' },
    { code: 'MME', name: 'MME' }, { code: 'HSS', name: 'HSS' }, { code: 'UDM', name: 'UDM' },
  ],
  vendors: [
    { code: 'huawei', name: '华为' }, { code: 'zte', name: '中兴' }, { code: 'ericsson', name: '爱立信' },
    { code: 'nokia', name: '诺基亚' },
  ],
};

export function mockNeSearchResults(keyword: string) {
  const allNes = [
    { ne_id: 'NE-AMF-GD-001', ne_name: 'AMF-GD-01', ne_type: 'AMF', province_code: 'GD', province_name: '广东', vendor: 'huawei', pool_name: 'Pool-GD-AMF-01' },
    { ne_id: 'NE-AMF-GD-002', ne_name: 'AMF-GD-02', ne_type: 'AMF', province_code: 'GD', province_name: '广东', vendor: 'zte', pool_name: 'Pool-GD-AMF-01' },
    { ne_id: 'NE-AMF-GD-003', ne_name: 'AMF-GD-03', ne_type: 'AMF', province_code: 'GD', province_name: '广东', vendor: 'huawei', pool_name: 'Pool-GD-AMF-02' },
    { ne_id: 'NE-AMF-BJ-001', ne_name: 'AMF-BJ-01', ne_type: 'AMF', province_code: 'BJ', province_name: '北京', vendor: 'ericsson', pool_name: 'Pool-BJ-AMF-01' },
    { ne_id: 'NE-SMF-GD-001', ne_name: 'SMF-GD-01', ne_type: 'SMF', province_code: 'GD', province_name: '广东', vendor: 'huawei', pool_name: 'Pool-GD-SMF-01' },
    { ne_id: 'NE-SMF-BJ-002', ne_name: 'SMF-BJ-02', ne_type: 'SMF', province_code: 'BJ', province_name: '北京', vendor: 'zte', pool_name: 'Pool-BJ-SMF-01' },
    { ne_id: 'NE-UPF-GD-003', ne_name: 'UPF-GD-03', ne_type: 'UPF', province_code: 'GD', province_name: '广东', vendor: 'huawei', pool_name: 'Pool-GD-UPF-01' },
    { ne_id: 'NE-MME-SH-001', ne_name: 'MME-SH-01', ne_type: 'MME', province_code: 'SH', province_name: '上海', vendor: 'ericsson', pool_name: 'Pool-SH-MME-01' },
  ];
  if (!keyword) return allNes.slice(0, 5);
  const kw = keyword.toLowerCase();
  return allNes.filter(ne => ne.ne_name.toLowerCase().includes(kw) || ne.ne_id.toLowerCase().includes(kw));
}

export const mockOperators = [
  { user_id: 'u002', display_name: '王五', role: 'PROVINCE_OPERATOR', province_code: 'GD' },
  { user_id: 'u003', display_name: '赵六', role: 'PROVINCE_OPERATOR', province_code: 'GD' },
  { user_id: 'u004', display_name: '孙七', role: 'PROVINCE_ADMIN', province_code: 'GD' },
];
