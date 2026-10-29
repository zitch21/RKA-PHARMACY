const express = require('express');
const router = express.Router();
const { db, logAudit, hashPassword, verifyPassword } = require('../db');
const { createSessionToken, invalidateSessionToken, verifySessionToken } = require('../middleware/authMiddleware');

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
    if (!user || !verifyPassword(password, user.password_hash)) {
      logAudit(
        'FAILED_LOGIN_ATTEMPT',
        'AUTH',
        username,
        { attempted_username: username, ip: req.ip },
        username
      );
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Update last login
    db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

    logAudit(
      'USER_LOGIN',
      'AUTH',
      user.id,
      { username: user.username, full_name: user.full_name, role: user.role },
      user.full_name
    );

    // Generate authenticated session token
    const token = createSessionToken(user);
    const isDefaultPassword = password === 'rka2026';

    // Return session payload
    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      },
      token,
      requires_password_change: isDefaultPassword
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    const { username, full_name } = req.body || {};
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7).trim()
      : req.headers['x-session-token'];
    if (token) {
      invalidateSessionToken(token);
    }

    logAudit(
      'USER_LOGOUT',
      'AUTH',
      username || 'admin',
      { username, full_name },
      full_name || 'Lourdes Gincen L. Cesista'
    );
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session status (verifies active session token; no auto-login)
router.get('/session', (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.slice(7).trim()
      : req.headers['x-session-token'];

    const user = verifySessionToken(token);
    if (!user) {
      return res.status(401).json({ authenticated: false, error: 'No active authenticated session.' });
    }
    res.json({ authenticated: true, active_operator: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password
router.post('/change-password', (req, res) => {
  try {
    const { username, current_password, new_password } = req.body || {};

    if (!username || !current_password || !new_password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (!verifyPassword(current_password, user.password_hash)) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const newHash = hashPassword(new_password);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);

    logAudit(
      'PASSWORD_CHANGED',
      'USER',
      user.id,
      { username: user.username, full_name: user.full_name },
      user.full_name
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
