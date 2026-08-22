// Central path list so a route rename only touches one file. Only
// seller-auth exists on the backend as of this pass — every other group is
// a documented contract for follow-up passes, not a route that resolves
// today (see PROJECT_NOTES.md).
export const ENDPOINTS = {
  sellerAuth: {
    register: '/seller-auth/register',
    login: '/seller-auth/login',
    me: '/seller-auth/me',
    forgotPassword: '/seller-auth/forgot-password',
    resetPassword: '/seller-auth/reset-password',
    changePassword: '/seller-auth/change-password',
    logout: '/seller-auth/logout',
    logoutAll: '/seller-auth/logout-all',
  },
} as const;
