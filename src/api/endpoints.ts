// Central path list so a route rename only touches one file. seller-auth
// and seller/products exist on the backend as of this pass — every other
// group is a documented contract for follow-up passes, not a route that
// resolves today (see PROJECT_NOTES.md).
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
  sellerProducts: {
    list: '/seller/products',
    detail: (id: string) => `/seller/products/${id}`,
    status: (id: string) => `/seller/products/${id}/status`,
  },
  sellerUploads: {
    sign: '/seller/uploads/sign',
  },
  sellerOrders: {
    list: '/seller/orders',
    detail: (id: string) => `/seller/orders/${id}`,
    status: (id: string) => `/seller/orders/${id}/status`,
    notifyRider: (id: string) => `/seller/orders/${id}/notify-rider`,
  },
  sellerNotifications: {
    registerDevice: '/seller/notifications/devices/register',
    unregisterDevice: '/seller/notifications/devices/unregister',
  },
} as const;
