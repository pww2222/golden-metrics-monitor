import request from './request';

// 聚合规则列表
export function getAggRules(params: Record<string, any>) {
  return request.get('/agg-rules', { params });
}

// 聚合规则详情
export function getAggRuleDetail(ruleId: number) {
  return request.get(`/agg-rules/${ruleId}`);
}

// 创建聚合规则
export function createAggRule(data: Record<string, any>) {
  return request.post('/agg-rules', data);
}

// 更新聚合规则
export function updateAggRule(ruleId: number, data: Record<string, any>) {
  return request.put(`/agg-rules/${ruleId}`, data);
}

// 删除聚合规则
export function deleteAggRule(ruleId: number) {
  return request.delete(`/agg-rules/${ruleId}`);
}

// 批量启用/停用聚合规则
export function batchUpdateAggRuleStatus(data: { rule_ids: number[]; status: number }) {
  return request.put('/agg-rules/batch-status', data);
}

// 聚合规则名称唯一性检查
export function checkAggRuleName(params: { rule_name: string; ne_type: string; exclude_rule_id?: number }) {
  return request.get('/agg-rules/check-name', { params });
}
