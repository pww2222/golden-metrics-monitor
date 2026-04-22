import request from './request';

export function queryMetrics(params: Record<string, any>) {
  return request.get('/metrics/query', { params });
}

export function getMetricsSummary(params: Record<string, any>) {
  return request.get('/metrics/summary', { params });
}

export function getMetricsDistribution(params: Record<string, any>) {
  return request.get('/metrics/distribution', { params });
}
