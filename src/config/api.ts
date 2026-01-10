// API Configuration
// Replace this with your actual Xano API base URL
export const API_CONFIG = {
  // Authentication API group
  authBaseUrl: import.meta.env.VITE_XANO_AUTH_API_URL || 'https://xvbw-gmwd-n88y.m2.xano.io/api:uQIHqxbu',
  // Leads API group
  leadsBaseUrl: import.meta.env.VITE_XANO_LEADS_API_URL || 'https://xvbw-gmwd-n88y.m2.xano.io/api:K30Zqmzm',
  // Outreach API group (for email operations)
  outreachBaseUrl: import.meta.env.VITE_XANO_OUTREACH_API_URL || 'https://xvbw-gmwd-n88y.m2.xano.io/api:7LQrWOIv',
  // Dashboard API group (for statistics)
  dashboardBaseUrl: import.meta.env.VITE_XANO_DASHBOARD_API_URL || 'https://xvbw-gmwd-n88y.m2.xano.io/api:r3nwZox8',
  // Campaigns API group
  campaignsBaseUrl: import.meta.env.VITE_XANO_CAMPAIGNS_API_URL || 'https://xvbw-gmwd-n88y.m2.xano.io/api:yczRp3UK',
  // Default base URL (auth)
  baseUrl: import.meta.env.VITE_XANO_API_URL || 'https://xvbw-gmwd-n88y.m2.xano.io/api:uQIHqxbu',
  endpoints: {
    auth: {
      signup: '/auth/signup',
      login: '/auth/login',
      me: '/auth/me',
      requestReset: '/reset/request-reset-link',
      magicLogin: '/reset/magic-link-login',
      updatePassword: '/reset/update_password',
    },
    leads: {
      list: '/leads',
      withStats: '/leads/with-stats',
      contacts: '/leads/{place_id}/contacts',
      contactMessages: '/contacts/{lead_email_id}/messages',
    },
    outreach: {
      sendEmail: '/contacts/{lead_email_id}/send',
      inbox: '/inbox/conversations',
    },
  },
} as const;

export type ApiEndpoints = typeof API_CONFIG.endpoints;
