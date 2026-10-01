/**
 * API Request Interceptor for RKA Pharmacy IMS
 * Automatically injects active session token into all outgoing /api requests.
 */

const originalFetch = window.fetch;

export function getActiveSessionToken() {
  try {
    return sessionStorage.getItem('rka_auth_token');
  } catch {
    return null;
  }
}

export function setActiveSessionToken(token) {
  try {
    if (token) {
      sessionStorage.setItem('rka_auth_token', token);
    } else {
      sessionStorage.removeItem('rka_auth_token');
    }
  } catch {
    // Ignore storage quota or access errors in restricted iframe
  }
}

export function getIsDemoMode() {
  try {
    return localStorage.getItem('rka_demo_mode') === 'true';
  } catch {
    return false;
  }
}

export function setIsDemoMode(enabled) {
  try {
    if (enabled) {
      localStorage.setItem('rka_demo_mode', 'true');
    } else {
      localStorage.removeItem('rka_demo_mode');
    }
    window.dispatchEvent(new CustomEvent('rka_demo_mode_changed', { detail: { isDemo: !!enabled } }));
  } catch {
    // Ignore storage quota or access errors
  }
}

// Monkey-patch window.fetch to automatically include authentication and demo headers
window.fetch = async function (input, init = {}) {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.pathname;
  } else if (input && typeof input.url === 'string') {
    url = input.url;
  }

  // Intercept requests directed to /api
  const isApiRequest = url.startsWith('/api') || url.includes('/api/');
  const isLoginRequest = url.includes('/api/auth/login');
  const isDemo = getIsDemoMode();

  if (isApiRequest) {
    const token = (!isLoginRequest) ? getActiveSessionToken() : null;

    if (token || isDemo) {
      init = { ...init };
      if (!init.headers) {
        init.headers = {};
      }

      if (init.headers instanceof Headers) {
        if (token) {
          if (!init.headers.has('Authorization')) init.headers.set('Authorization', `Bearer ${token}`);
          if (!init.headers.has('X-Session-Token')) init.headers.set('X-Session-Token', token);
        }
        if (isDemo && !init.headers.has('X-Demo-Mode')) {
          init.headers.set('X-Demo-Mode', 'true');
        }
      } else if (Array.isArray(init.headers)) {
        if (token) {
          if (!init.headers.some(([k]) => k.toLowerCase() === 'authorization')) init.headers.push(['Authorization', `Bearer ${token}`]);
          if (!init.headers.some(([k]) => k.toLowerCase() === 'x-session-token')) init.headers.push(['X-Session-Token', token]);
        }
        if (isDemo && !init.headers.some(([k]) => k.toLowerCase() === 'x-demo-mode')) {
          init.headers.push(['X-Demo-Mode', 'true']);
        }
      } else {
        if (token) {
          if (!init.headers['Authorization'] && !init.headers['authorization']) init.headers['Authorization'] = `Bearer ${token}`;
          if (!init.headers['X-Session-Token'] && !init.headers['x-session-token']) init.headers['X-Session-Token'] = token;
        }
        if (isDemo && !init.headers['X-Demo-Mode'] && !init.headers['x-demo-mode']) {
          init.headers['X-Demo-Mode'] = 'true';
        }
      }
    }
  }

  const response = await originalFetch.call(this, input, init);

  // If unauthorized, notify the app to show login modal
  if (response.status === 401 && isApiRequest && !isLoginRequest) {
    window.dispatchEvent(new CustomEvent('rka_session_unauthorized', {
      detail: { url, status: 401 }
    }));
  }

  return response;
};

export default window.fetch;
