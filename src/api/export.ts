import request from './request';

export function createExport(data: Record<string, any>) {
  return request.post('/exports', data);
}

export function getExportStatus(taskId: string) {
  return request.get(`/exports/${taskId}`);
}

export function downloadExport(taskId: string, token: string) {
  return `/api/v1/exports/${taskId}/download?token=${token}`;
}

export function cancelExport(taskId: string) {
  return request.put(`/exports/${taskId}/cancel`);
}

export function getExportList(params: Record<string, any>) {
  return request.get('/exports', { params });
}
