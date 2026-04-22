import request from './request';

export function login(data: { username: string; password: string }) {
  return request.post('/auth/login', data);
}

export function refreshToken(refresh_token: string) {
  return request.post('/auth/refresh', { refresh_token });
}

export function getMe() {
  return request.get('/auth/me');
}
