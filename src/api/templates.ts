import request from './request';

export function getTemplates(params: Record<string, any>) {
  return request.get('/templates', { params });
}

export function getTemplateDetail(templateId: number) {
  return request.get(`/templates/${templateId}`);
}

export function createRuleFromTemplate(templateId: number, data: Record<string, any>) {
  return request.post(`/templates/${templateId}/create-rule`, data);
}
