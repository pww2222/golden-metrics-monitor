import request from './request';

// 衍生告警列表
export function getDerivedAlarms(params: Record<string, any>) {
  return request.get('/derived-alarms', { params });
}

// 衍生告警详情
export function getDerivedAlarmDetail(derivedId: number) {
  return request.get(`/derived-alarms/${derivedId}`);
}

// 聚合视图（监控页专用）
export function getDerivedAlarmsAggregateView(params: Record<string, any>) {
  return request.get('/derived-alarms/aggregate-view', { params });
}

// 获取大区级全局配置
export function getSystemConfig(configKey: string) {
  return request.get(`/system-config/${configKey}`);
}

// 更新大区级全局配置
export function updateSystemConfig(configKey: string, data: Record<string, any>) {
  return request.put(`/system-config/${configKey}`, data);
}
