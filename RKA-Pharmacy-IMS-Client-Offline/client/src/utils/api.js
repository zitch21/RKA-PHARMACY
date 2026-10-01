import { getActiveSessionToken } from './apiInterceptor';

/**
 * Robust API Request Wrapper with automatic session token injection and error handling.
 */
export async function apiFetch(url, options = {}) {
  const token = getActiveSessionToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  return res;
}

export async function apiJson(url, options = {}) {
  const res = await apiFetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export default apiFetch;
