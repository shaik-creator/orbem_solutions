const axios = require('axios');
const { query } = require('../config/db');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { assertPhone, createHttpError } = require('../utils/validators');

const DEFAULT_SETTINGS = {
  profile: {
    avatarUrl: '',
    bio: '',
    department: '',
    designation: ''
  },
  privacy: {
    showEmail: true,
    showPhone: false,
    showOnlineStatus: true,
    showLastActive: true,
    allowTaskHistory: true,
    allowAssistantActivity: true
  },
  notifications: {
    shipmentDelay: true,
    pendingDocuments: true,
    paymentOverdue: true,
    bookingCreated: true,
    statusUpdate: true,
    dailySummary: false,
    weeklyRevenue: false,
    aiSuggestions: true,
    email: false,
    inApp: true,
    browserPush: false,
    morningSummaryTime: '09:00',
    reminderBeforeDeadline: '1 day',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00'
  },
  appearance: {
    theme: 'light',
    sidebarMode: 'expanded',
    density: 'comfortable',
    tableRowSize: 'medium',
    dashboardCardStyle: 'simple',
    cardRadius: 'rounded',
    fontSize: 'medium',
    accentColor: 'blue'
  },
  security: {
    twoFactor: false,
    loginAlerts: true,
    deviceHistory: true
  },
  assistant: {
    enabled: true,
    tone: 'professional',
    allowDashboardSummary: true,
    allowCustomerMessages: true
  },
  reports: {
    defaultFormat: 'csv',
    includeCompanyHeader: true,
    includeGeneratedDate: true,
    includeFiltersSummary: true,
    monthlyReminder: false,
    defaultDateRange: 'this_month'
  },
  accessibility: {
    highContrast: false,
    reduceMotion: false,
    largeTapTargets: false
  },
  language: {
    preferred: 'en',
    region: 'en-IN'
  },
  updates: {
    showReleaseNotes: true,
    notify: false
  }
};

const OPTION_VALUES = {
  'notifications.reminderBeforeDeadline': ['1 hour', '3 hours', '6 hours', '1 day', '2 days'],
  'appearance.theme': ['light', 'dark', 'system'],
  'appearance.sidebarMode': ['expanded', 'compact'],
  'appearance.density': ['comfortable', 'compact'],
  'appearance.tableRowSize': ['small', 'medium', 'large'],
  'appearance.dashboardCardStyle': ['simple', 'detailed'],
  'appearance.cardRadius': ['compact', 'rounded', 'large'],
  'appearance.fontSize': ['small', 'medium', 'large'],
  'appearance.accentColor': ['blue', 'green', 'purple', 'orange', 'slate'],
  'assistant.tone': ['professional', 'short', 'detailed'],
  'reports.defaultFormat': ['csv', 'pdf-ready'],
  'reports.defaultDateRange': ['today', 'this_week', 'this_month', 'custom'],
  'language.preferred': ['en'],
  'language.region': ['en-IN', 'en-US']
};

const TIME_KEYS = new Set([
  'notifications.morningSummaryTime',
  'notifications.quietHoursStart',
  'notifications.quietHoursEnd'
]);

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function flattenSettings(settings, prefix = '') {
  return Object.entries(settings || {}).reduce((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(acc, flattenSettings(value, path));
    } else {
      acc[path] = value;
    }
    return acc;
  }, {});
}

const DEFAULT_FLAT_SETTINGS = flattenSettings(DEFAULT_SETTINGS);
const ALLOWED_KEYS = new Set(Object.keys(DEFAULT_FLAT_SETTINGS));

function setDeep(target, key, value) {
  const parts = key.split('.');
  let current = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    current[parts[index]] = current[parts[index]] || {};
    current = current[parts[index]];
  }
  current[parts[parts.length - 1]] = value;
}

function parseSettingValue(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    is_active: user.is_active,
    status_message: user.status_message || '',
    created_at: user.created_at || null,
    updated_at: user.updated_at || null,
    last_login_at: user.last_login_at || null,
    password_updated_at: user.password_updated_at || null
  };
}

function validateSettingKey(key) {
  if (!ALLOWED_KEYS.has(key)) {
    throw createHttpError(`Setting key "${key}" is not allowed.`, 400);
  }
}

function validateSettingValue(key, value) {
  validateSettingKey(key);
  const defaultValue = DEFAULT_FLAT_SETTINGS[key];

  if (typeof defaultValue === 'boolean') {
    if (typeof value !== 'boolean') throw createHttpError(`${key} must be true or false.`, 400);
    return value;
  }

  if (typeof defaultValue === 'string') {
    const text = String(value ?? '').trim();
    const maxLength = key === 'profile.avatarUrl' ? 60000 : 4000;
    if (text.length > maxLength) throw createHttpError(`${key} is too long.`, 400);
    if (TIME_KEYS.has(key) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) {
      throw createHttpError(`${key} must use HH:mm format.`, 400);
    }
    if (OPTION_VALUES[key] && !OPTION_VALUES[key].includes(text)) {
      throw createHttpError(`${key} is not a supported option.`, 400);
    }
    return text;
  }

  throw createHttpError(`${key} cannot be saved.`, 400);
}

async function getSavedSettings(userId) {
  const rows = await query('SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?', [userId]);
  const settings = cloneDefaults();
  for (const row of rows) {
    if (ALLOWED_KEYS.has(row.setting_key)) {
      setDeep(settings, row.setting_key, validateSettingValue(row.setting_key, parseSettingValue(row.setting_value)));
    }
  }
  return settings;
}

async function saveSetting(userId, key, value) {
  const cleanedValue = validateSettingValue(key, value);
  await query(
    `INSERT INTO user_settings (user_id, setting_key, setting_value)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [userId, key, JSON.stringify(cleanedValue)]
  );
  return cleanedValue;
}

async function loadUser(userId) {
  const users = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!users.length) throw createHttpError('User account was not found.', 404);
  return safeUser(users[0]);
}

const getSettings = asyncHandler(async (req, res) => {
  const settings = await getSavedSettings(req.user.id);
  const user = await loadUser(req.user.id);
  res.json({ settings, user });
});

const updateSettings = asyncHandler(async (req, res) => {
  const payload = req.body.settings || req.body;
  const flat = flattenSettings(payload);
  const keys = Object.keys(flat);
  if (!keys.length) throw createHttpError('No settings were provided.', 400);

  for (const key of keys) validateSettingValue(key, flat[key]);
  for (const key of keys) await saveSetting(req.user.id, key, flat[key]);

  const settings = await getSavedSettings(req.user.id);
  res.json({ message: 'Settings saved.', settings });
});

const updateSetting = asyncHandler(async (req, res) => {
  const key = req.params.key;
  const value = Object.prototype.hasOwnProperty.call(req.body, 'value') ? req.body.value : req.body.setting_value;
  await saveSetting(req.user.id, key, value);
  const settings = await getSavedSettings(req.user.id);
  res.json({ message: 'Setting saved.', settings });
});

const deleteSetting = asyncHandler(async (req, res) => {
  const key = req.params.key;
  validateSettingKey(key);
  await query('DELETE FROM user_settings WHERE user_id = ? AND setting_key = ?', [req.user.id, key]);
  const settings = await getSavedSettings(req.user.id);
  res.json({ message: 'Setting reset.', settings });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, status_message, bio, department, designation, avatarUrl } = req.body;
  const updates = [];
  const params = [];

  if (name !== undefined) {
    const cleanName = String(name).trim();
    if (!cleanName) throw createHttpError('Name is required.', 400);
    if (cleanName.length > 120) throw createHttpError('Name is too long.', 400);
    updates.push('name = ?');
    params.push(cleanName);
  }

  if (phone !== undefined) {
    const cleanPhone = String(phone || '').trim();
    if (cleanPhone) assertPhone(cleanPhone);
    updates.push('phone = ?');
    params.push(cleanPhone || null);
  }

  if (status_message !== undefined) {
    const cleanStatus = String(status_message || '').trim();
    if (cleanStatus.length > 150) throw createHttpError('Status message is too long.', 400);
    updates.push('status_message = ?');
    params.push(cleanStatus || null);
  }

  if (updates.length) {
    params.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  const profileSettings = {
    'profile.bio': bio,
    'profile.department': department,
    'profile.designation': designation,
    'profile.avatarUrl': avatarUrl
  };

  for (const [key, value] of Object.entries(profileSettings)) {
    if (value !== undefined) await saveSetting(req.user.id, key, value);
  }

  const settings = await getSavedSettings(req.user.id);
  const user = await loadUser(req.user.id);
  res.json({ message: 'Profile updated.', user, settings });
});

async function getOllamaStatus() {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  if (!baseUrl) return { provider: 'Ollama local', status: 'unavailable', detail: 'Not configured' };

  try {
    await axios.get(`${baseUrl.replace(/\/$/, '')}/api/tags`, { timeout: 1200 });
    return {
      provider: 'Ollama local',
      status: 'connected',
      detail: process.env.OLLAMA_MODEL || 'Local model configured'
    };
  } catch {
    return {
      provider: 'Ollama local',
      status: 'unavailable',
      detail: 'Configured but not reachable'
    };
  }
}

const aiStatus = asyncHandler(async (req, res) => {
  const ollama = await getOllamaStatus();
  res.json({
    providers: [
      { provider: 'Rule-based fallback', status: 'connected', detail: 'Always available' },
      ollama,
      {
        provider: 'Gemini optional',
        status: process.env.GEMINI_API_KEY ? 'configured' : 'unavailable',
        detail: process.env.GEMINI_API_KEY ? 'API key configured on backend' : 'No backend API key configured'
      }
    ]
  });
});

const securitySummary = asyncHandler(async (req, res) => {
  const user = await loadUser(req.user.id);
  res.json({
    lastLoginAt: user.last_login_at,
    currentDevice: req.headers['user-agent'] || 'Current browser',
    accountRole: user.role,
    passwordUpdatedAt: user.password_updated_at,
    activeSessions: [
      {
        id: 'current',
        label: 'This device',
        browser: req.headers['user-agent'] || 'Current browser',
        lastActiveAt: new Date().toISOString()
      }
    ],
    loginActivity: [
      {
        id: 'last-login',
        label: 'Last successful login',
        created_at: user.last_login_at
      }
    ].filter((item) => item.created_at)
  });
});

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
  updateSetting,
  deleteSetting,
  updateProfile,
  aiStatus,
  securitySummary
};
