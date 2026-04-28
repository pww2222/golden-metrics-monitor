import request from './request';

export function getRules(params: Record<string, any>) {
  return request.get('/rules', { params });
}

export function getRuleDetail(ruleId: number) {
  return request.get(`/rules/${ruleId}`);
}

export function createRule(data: Record<string, any>) {
  return request.post('/rules', data);
}

export function updateRule(ruleId: number, data: Record<string, any>) {
  return request.put(`/rules/${ruleId}`, data);
}

export function deleteRule(ruleId: number) {
  return request.delete(`/rules/${ruleId}`);
}

export function batchUpdateStatus(data: { rule_ids: number[]; status: number }) {
  return request.put('/rules/batch-status', data);
}

export function batchDeleteRules(data: { rule_ids: number[] }) {
  return request.delete('/rules/batch', { data });
}

export function checkRuleName(params: { rule_name: string; ne_type: string; exclude_rule_id?: number }) {
  return request.get('/rules/check-name', { params });
}

export function simulateRule(data: Record<string, any>) {
  return request.post('/rules/simulate', data);
}

export function simulateExistingRule(ruleId: number, data: Record<string, any>) {
  return request.post(`/rules/${ruleId}/simulate`, data);
}

export function copyRule(ruleId: number) {
  return request.post(`/rules/${ruleId}/copy`);
}
