import api from './api';

export const APPEARANCE_STORAGE_KEY = 'orbem_appearance_settings';
export const APPEARANCE_EVENT = 'orbem:appearance-changed';

export const defaultSettings = {
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
    accentColor: 'green'
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

const accentColors = {
  blue: '#2563eb',
  green: '#1d9e75',
  purple: '#7c3aed',
  orange: '#d97706',
  slate: '#475569'
};

function mergeSettings(base, incoming) {
  return Object.entries(incoming || {}).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value && typeof value === 'object' && !Array.isArray(value) ? mergeSettings(acc[key] || {}, value) : value
    }),
    { ...base }
  );
}

export function getStoredAppearanceSettings() {
  try {
    return {
      ...defaultSettings.appearance,
      ...JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) || '{}')
    };
  } catch {
    return defaultSettings.appearance;
  }
}

export function applyAppearanceSettings(appearance = getStoredAppearanceSettings()) {
  const next = { ...defaultSettings.appearance, ...appearance };
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const resolvedTheme = next.theme === 'system' ? (systemDark ? 'dark' : 'light') : next.theme;

  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.dataset.sidebarMode = next.sidebarMode;
  document.documentElement.dataset.density = next.density;
  document.documentElement.dataset.tableRowSize = next.tableRowSize;
  document.documentElement.dataset.dashboardCardStyle = next.dashboardCardStyle;
  document.documentElement.dataset.cardRadius = next.cardRadius;
  document.documentElement.dataset.fontSize = next.fontSize;
  document.documentElement.style.setProperty('--orbem-accent', accentColors[next.accentColor] || accentColors.blue);
}

export function storeAppearanceSettings(appearance) {
  const next = { ...defaultSettings.appearance, ...appearance };
  localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(next));
  applyAppearanceSettings(next);
  window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: next }));
  return next;
}

export const settingsService = {
  get: async () => {
    const response = await api.get('/settings');
    return {
      ...response.data,
      settings: mergeSettings(defaultSettings, response.data.settings || {})
    };
  },
  updateAll: async (settings) => {
    const response = await api.put('/settings', { settings });
    return {
      ...response.data,
      settings: mergeSettings(defaultSettings, response.data.settings || {})
    };
  },
  updateOne: async (key, value) => {
    const response = await api.put(`/settings/${encodeURIComponent(key)}`, { value });
    return {
      ...response.data,
      settings: mergeSettings(defaultSettings, response.data.settings || {})
    };
  },
  resetOne: async (key) => {
    const response = await api.delete(`/settings/${encodeURIComponent(key)}`);
    return {
      ...response.data,
      settings: mergeSettings(defaultSettings, response.data.settings || {})
    };
  },
  updateProfile: async (payload) => {
    const response = await api.put('/settings/profile', payload);
    return {
      ...response.data,
      settings: mergeSettings(defaultSettings, response.data.settings || {})
    };
  },
  aiStatus: () => api.get('/settings/ai-status').then((response) => response.data),
  securitySummary: () => api.get('/settings/security-summary').then((response) => response.data)
};

export function buildAccountDataDownload(user, settings, security) {
  return {
    exportedAt: new Date().toISOString(),
    user,
    settings,
    security
  };
}
