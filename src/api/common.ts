import request from './request';

export function getNeTypes() {
  return request.get('/common/ne-types');
}

export function getMetricsByType(neType: string) {
  return request.get('/common/metrics', { params: { ne_type: neType } });
}

export function getFilterOptions(params?: Record<string, any>) {
  return request.get('/common/filter-options', { params });
}

export function searchNe(params: { keyword: string; province_code?: string; ne_type?: string; limit?: number }) {
  return request.get('/common/ne-search', { params });
}

export function getOperators(provinceCode?: string) {
  return request.get('/common/operators', { params: { province_code: provinceCode } });
}
