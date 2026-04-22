import request from './request';

export function getAlarms(params: Record<string, any>) {
  return request.get('/alarms', { params });
}

export function getAlarmDetail(eventId: number) {
  return request.get(`/alarms/${eventId}`);
}

export function confirmAlarm(eventId: number, data: { handle_note: string }) {
  return request.put(`/alarms/${eventId}/confirm`, data);
}

export function markFalseAlarm(eventId: number, data: { handle_note: string }) {
  return request.put(`/alarms/${eventId}/false-alarm`, data);
}

export function transferAlarm(eventId: number, data: { transfer_to: string; handle_note: string }) {
  return request.put(`/alarms/${eventId}/transfer`, data);
}

export function escalateAlarm(eventId: number, data: { handle_note: string; target_severity?: number }) {
  return request.put(`/alarms/${eventId}/escalate`, data);
}

export function closeAlarm(eventId: number, data: { handle_note: string }) {
  return request.put(`/alarms/${eventId}/close`, data);
}

export function batchConfirmAlarms(data: { event_ids: number[]; handle_note: string }) {
  return request.put('/alarms/batch-confirm', data);
}

export function batchTransferAlarms(data: { event_ids: number[]; transfer_to: string; handle_note: string }) {
  return request.put('/alarms/batch-transfer', data);
}

export function batchFalseAlarm(data: { event_ids: number[]; handle_note: string }) {
  return request.put('/alarms/batch-false-alarm', data);
}

export function getAlarmsAggregated(params: Record<string, any>) {
  return request.get('/alarms/aggregated', { params });
}
