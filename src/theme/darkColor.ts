// Dark-mode counterpart to theme/color.ts's Colors — identical key set,
// different values. See store/themeStore.ts's useThemeColors for how a
// screen picks between the two based on the resolved mode.
export const DarkColors: typeof import('./color').Colors = {
  // Backgrounds
  background: '#0B0C0F',
  backgroundSecondary: '#15161B',
  surface: '#15161B',
  card: '#1B1D23',
  overlay: 'rgba(0, 0, 0, 0.72)',

  // Text
  textPrimary: '#F2F3F5',
  textSecondary: '#A7ADB8',
  textLight: '#767D8A',
  textInverse: '#14161A',
  textLink: '#6C9DFF',

  // Borders / dividers
  border: '#2A2D35',
  borderStrong: '#3A3E48',
  divider: '#22242A',

  // Grey scale (inverted ramp — same semantic usage as light)
  grey50: '#17181D',
  grey100: '#1E2027',
  grey200: '#282A32',
  grey300: '#34363F',
  grey400: '#4A4D58',
  grey500: '#63677A',
  grey600: '#7C8194',
  grey700: '#9CA0AF',
  grey800: '#C0C3CE',
  grey900: '#E5E6EA',

  // Brand — slightly brighter for contrast on dark surfaces
  primary: '#5B78D9',
  primary10: 'rgba(91, 120, 217, 0.14)',
  primary20: 'rgba(91, 120, 217, 0.24)',
  primary30: 'rgba(91, 120, 217, 0.34)',
  primary50: 'rgba(91, 120, 217, 0.5)',
  accent: '#6C9DFF',
  accent10: 'rgba(108, 157, 255, 0.14)',

  // Shadow
  shadow: '#000000',

  // Inputs
  inputBackground: '#1B1D23',
  inputBorder: '#34363F',
  inputBorderFocused: '#6C9DFF',
  inputPlaceholder: '#767D8A',

  // Buttons
  buttonPrimaryBg: '#5B78D9',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#282A32',
  buttonSecondaryText: '#F2F3F5',
  buttonDangerBg: '#F0554A',
  buttonDangerText: '#FFFFFF',
  buttonDisabledBg: '#22242A',
  buttonDisabledText: '#63677A',

  // Status — brighter for readability on dark surfaces
  success: '#2FBF8F',
  success10: 'rgba(47, 191, 143, 0.14)',
  warning: '#EFA33D',
  warning10: 'rgba(239, 163, 61, 0.14)',
  error: '#F0554A',
  error10: 'rgba(240, 85, 74, 0.14)',
  info: '#6C9DFF',
  info10: 'rgba(108, 157, 255, 0.14)',
  neutral: '#A7ADB8',
  neutral10: 'rgba(167, 173, 184, 0.14)',

  // Bottom sheets / modals
  sheetBackground: '#1B1D23',
  sheetHandle: '#3A3E48',
  modalBackground: '#1B1D23',

  // Navigation
  navBackground: '#15161B',
  navBorder: '#2A2D35',
  navIconActive: '#F2F3F5',
  navIconInactive: '#63677A',
  navLabelActive: '#F2F3F5',
  navLabelInactive: '#63677A',

  // Charts
  chartLine: '#6C9DFF',
  chartFill: 'rgba(108, 157, 255, 0.18)',
  chartGrid: '#22242A',
  chartAxis: '#767D8A',
  chartPalette: ['#6C9DFF', '#2FBF8F', '#EFA33D', '#9C89F5', '#F0554A'],

  // Empty / loading states
  emptyIcon: '#3A3E48',
  skeletonBase: '#22242A',
  skeletonHighlight: '#2A2D35',

  // Status badges — product review workflow
  statusDraft: '#A7ADB8',
  statusDraftBg: 'rgba(167, 173, 184, 0.14)',
  statusPendingReview: '#EFA33D',
  statusPendingReviewBg: 'rgba(239, 163, 61, 0.14)',
  statusApproved: '#6C9DFF',
  statusApprovedBg: 'rgba(108, 157, 255, 0.14)',
  statusPublished: '#2FBF8F',
  statusPublishedBg: 'rgba(47, 191, 143, 0.14)',
  statusRejected: '#F0554A',
  statusRejectedBg: 'rgba(240, 85, 74, 0.14)',
  statusHidden: '#767D8A',
  statusHiddenBg: 'rgba(118, 125, 138, 0.14)',
  statusArchived: '#A7ADB8',
  statusArchivedBg: 'rgba(167, 173, 184, 0.14)',

  // Status badges — order fulfillment
  fulfillmentPending: '#767D8A',
  fulfillmentPendingBg: 'rgba(118, 125, 138, 0.14)',
  fulfillmentConfirmed: '#6C9DFF',
  fulfillmentConfirmedBg: 'rgba(108, 157, 255, 0.14)',
  fulfillmentProcessing: '#9C89F5',
  fulfillmentProcessingBg: 'rgba(156, 137, 245, 0.14)',
  fulfillmentPacked: '#EFA33D',
  fulfillmentPackedBg: 'rgba(239, 163, 61, 0.14)',
  fulfillmentShipped: '#3FB8D6',
  fulfillmentShippedBg: 'rgba(63, 184, 214, 0.14)',
  fulfillmentOutForDelivery: '#EFA33D',
  fulfillmentOutForDeliveryBg: 'rgba(239, 163, 61, 0.14)',
  fulfillmentDelivered: '#2FBF8F',
  fulfillmentDeliveredBg: 'rgba(47, 191, 143, 0.14)',
  fulfillmentCancelled: '#F0554A',
  fulfillmentCancelledBg: 'rgba(240, 85, 74, 0.14)',

  // Seller verification status
  sellerPending: '#EFA33D',
  sellerPendingBg: 'rgba(239, 163, 61, 0.14)',
  sellerActive: '#2FBF8F',
  sellerActiveBg: 'rgba(47, 191, 143, 0.14)',
  sellerSuspended: '#F0554A',
  sellerSuspendedBg: 'rgba(240, 85, 74, 0.14)',
  sellerRejected: '#F0554A',
  sellerRejectedBg: 'rgba(240, 85, 74, 0.14)',
  sellerInactive: '#767D8A',
  sellerInactiveBg: 'rgba(118, 125, 138, 0.14)',

  // Payout status
  payoutPending: '#EFA33D',
  payoutPendingBg: 'rgba(239, 163, 61, 0.14)',
  payoutProcessing: '#9C89F5',
  payoutProcessingBg: 'rgba(156, 137, 245, 0.14)',
  payoutPaid: '#2FBF8F',
  payoutPaidBg: 'rgba(47, 191, 143, 0.14)',
  payoutFailed: '#F0554A',
  payoutFailedBg: 'rgba(240, 85, 74, 0.14)',
};
