const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');

function getOrGenerateSessionSecret() {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  const secretPath = path.join(__dirname, '../data/.session_secret');
  try {
    if (fs.existsSync(secretPath)) {
      const existing = fs.readFileSync(secretPath, 'utf8').trim();
      if (existing && existing.length >= 32) {
        return existing;
      }
    }
    const generated = crypto.randomBytes(32).toString('hex');
    const dataDir = path.dirname(secretPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(secretPath, generated, { encoding: 'utf8' });
    return generated;
  } catch {
    return 'rka-pharmacy-session-hmac-secret-agoo-la-union-2026';
  }
}

// Secret for cryptographic HMAC session signatures
const SESSION_SECRET = getOrGenerateSessionSecret();

// In-memory active session cache
const activeSessions = new Map();

/**
 * Generates a cryptographically signed session token for an authenticated user.
 * Format: rka_session_<base64Payload>_<hmacSignature>
 */
function createSessionToken(user) {
  if (!user || !user.id) {
    throw new Error('User object with id is required to create a session token.');
  }

  const payload = JSON.stringify({
    uid: user.id,
    uname: user.username,
    role: user.role,
    ts: Date.now()
  });

  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
  const token = `rka_session_${payloadB64}_${signature}`;

  // Store in active sessions map
  activeSessions.set(token, {
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    },
    createdAt: Date.now()
  });

  return token;
}

/**
 * Validates a session token. Supports cryptographically signed tokens
 * and active session registry.
 * Returns the authenticated user object or null.
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  // 1. Check in-memory active session registry
  if (activeSessions.has(token)) {
    const session = activeSessions.get(token);
    // Expire session after 7 days of inactivity
    if (Date.now() - session.createdAt < 7 * 24 * 60 * 60 * 1000) {
      return session.user;
    } else {
      activeSessions.delete(token);
    }
  }

  // 2. Validate cryptographic signature
  if (token.startsWith('rka_session_')) {
    const rest = token.slice('rka_session_'.length);
    const lastUnderscore = rest.lastIndexOf('_');
    if (lastUnderscore !== -1) {
      const payloadB64 = rest.slice(0, lastUnderscore);
      const signature = rest.slice(lastUnderscore + 1);
      if (signature && signature.length === 64 && /^[0-9a-fA-F]{64}$/.test(signature)) {
        try {
          const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('hex');
          const sigBuf = Buffer.from(signature, 'hex');
          const expBuf = Buffer.from(expectedSig, 'hex');

          if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
            const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
            const user = db.prepare('SELECT id, username, full_name, role FROM users WHERE id = ?').get(payload.uid);
            if (user) {
              // Re-cache in active sessions
              activeSessions.set(token, { user, createdAt: Date.now() });
              return user;
            }
          }
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

/**
 * Invalidates / logs out a session token.
 */
function invalidateSessionToken(token) {
  if (token) {
    activeSessions.delete(token);
  }
}

/**
 * Authentication Middleware:
 * Protects all mutating operations (POST, PUT, DELETE, PATCH).
 * Rejects unauthenticated requests with HTTP 401 Unauthorized.
 */
function authMiddleware(req, res, next) {
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

  // Safe / read-only methods pass through
  if (!mutatingMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  // Exempt public endpoints: authentication & simulation analytics (non-mutating)
  const pathWithoutQuery = (req.originalUrl || req.path || '').split('?')[0];
  if (
    pathWithoutQuery === '/api/auth/login' ||
    pathWithoutQuery === '/auth/login' ||
    pathWithoutQuery === '/api/auth/logout' ||
    pathWithoutQuery === '/auth/logout' ||
    pathWithoutQuery === '/api/backup/exit' ||
    pathWithoutQuery === '/backup/exit' ||
    pathWithoutQuery.startsWith('/api/simulation') ||
    pathWithoutQuery.startsWith('/simulation')
  ) {
    return next();
  }

  // Extract session token from Authorization or custom headers
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-session-token']) {
    token = req.headers['x-session-token'];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication session token is required for mutating operations.',
      code: 'AUTH_REQUIRED',
      hint: 'Include Authorization: Bearer <session_token> header from /api/auth/login'
    });
  }

  const user = verifySessionToken(token);
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired operator session token.',
      code: 'AUTH_INVALID',
      hint: 'Session may have expired. Please authenticate via /api/auth/login'
    });
  }

  // Attach verified user to request
  req.user = user;
  next();
}

/**
 * Role-Based Access Control (RBAC) Middleware:
 * Enforces administrator privileges for sensitive operations.
 */
function requireAdminRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized: Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  const role = (req.user.role || '').toLowerCase();
  const isAdmin = role.includes('admin') || role.includes('owner');

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden: Administrator privileges required for this operation.',
      code: 'ADMIN_ROLE_REQUIRED'
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  requireAdminRole,
  createSessionToken,
  verifySessionToken,
  invalidateSessionToken,
  activeSessions
};
