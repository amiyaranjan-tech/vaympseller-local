// Light palette — semantic tokens only. Never import raw hex into a screen;
// consume everything through useThemeColors().colors. Base key set (primary,
// background, surface, card, textPrimary/Secondary/Light, grey50-900,
// success/warning/error/info + *10, border, primary10/20/30/50, overlay,
// shadow) mirrors the Consumer app's theme/color.ts one-for-one so the two
// apps stay visually/structurally consistent; everything below that line is
// a Seller-app-only addition (status badges, charts, nav, sheets).
export const Colors = {
  // Backgrounds
  background: '#F7F8FA',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  overlay: 'rgba(15, 18, 25, 0.5)',

  // Text
  textPrimary: '#14161A',
  textSecondary: '#5B6472',
  textLight: '#8A93A2',
  textInverse: '#FFFFFF',
  textLink: '#2F6FED',

  // Borders / dividers
  border: '#E4E7EC',
  borderStrong: '#C7CCD6',
  divider: '#EEF0F3',

  // Grey scale (matches Consumer app's grey50-900 ramp)
  grey50: '#FAFAFA',
  grey100: '#F5F5F5',
  grey200: '#EEEEEE',
  grey300: '#E0E0E0',
  grey400: '#BDBDBD',
  grey500: '#9E9E9E',
  grey600: '#757575',
  grey700: '#616161',
  grey800: '#424242',
  grey900: '#212121',

  // Brand
  primary: '#1F2A44',
  primary10: 'rgba(31, 42, 68, 0.1)',
  primary20: 'rgba(31, 42, 68, 0.2)',
  primary30: 'rgba(31, 42, 68, 0.3)',
  primary50: 'rgba(31, 42, 68, 0.5)',
  accent: '#2F6FED',
  accent10: 'rgba(47, 111, 237, 0.1)',

  // Shadow
  shadow: '#000000',

  // Inputs
  inputBackground: '#FFFFFF',
  inputBorder: '#D8DCE3',
  inputBorderFocused: '#2F6FED',
  inputPlaceholder: '#9AA3B2',

  // Buttons
  buttonPrimaryBg: '#1F2A44',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondaryBg: '#EEF0F3',
  buttonSecondaryText: '#1F2A44',
  buttonDangerBg: '#D92D20',
  buttonDangerText: '#FFFFFF',
  buttonDisabledBg: '#E4E7EC',
  buttonDisabledText: '#9AA3B2',

  // Status
  success: '#12805C',
  success10: 'rgba(18, 128, 92, 0.1)',
  warning: '#B54708',
  warning10: 'rgba(181, 71, 8, 0.1)',
  error: '#D92D20',
  error10: 'rgba(217, 45, 32, 0.1)',
  info: '#2F6FED',
  info10: 'rgba(47, 111, 237, 0.1)',
  neutral: '#5B6472',
  neutral10: 'rgba(91, 100, 114, 0.1)',

  // Bottom sheets / modals
  sheetBackground: '#FFFFFF',
  sheetHandle: '#D8DCE3',
  modalBackground: '#FFFFFF',

  // Navigation
  navBackground: '#FFFFFF',
  navBorder: '#E4E7EC',
  navIconActive: '#1F2A44',
  navIconInactive: '#9AA3B2',
  navLabelActive: '#1F2A44',
  navLabelInactive: '#9AA3B2',

  // Charts
  chartLine: '#2F6FED',
  chartFill: 'rgba(47, 111, 237, 0.12)',
  chartGrid: '#EEF0F3',
  chartAxis: '#8A93A2',
  chartPalette: ['#2F6FED', '#12805C', '#B54708', '#7A5AF8', '#D92D20'],

  // Empty / loading states
  emptyIcon: '#C7CCD6',
  skeletonBase: '#EEF0F3',
  skeletonHighlight: '#F7F8FA',

  // Status badges — product review workflow
  statusDraft: '#5B6472',
  statusDraftBg: 'rgba(91, 100, 114, 0.1)',
  statusPendingReview: '#B54708',
  statusPendingReviewBg: 'rgba(181, 71, 8, 0.1)',
  statusApproved: '#2F6FED',
  statusApprovedBg: 'rgba(47, 111, 237, 0.1)',
  statusPublished: '#12805C',
  statusPublishedBg: 'rgba(18, 128, 92, 0.1)',
  statusRejected: '#D92D20',
  statusRejectedBg: 'rgba(217, 45, 32, 0.1)',
  statusHidden: '#8A93A2',
  statusHiddenBg: 'rgba(138, 147, 162, 0.1)',
  statusArchived: '#5B6472',
  statusArchivedBg: 'rgba(91, 100, 114, 0.1)',

  // Status badges — order fulfillment
  fulfillmentPending: '#8A93A2',
  fulfillmentPendingBg: 'rgba(138, 147, 162, 0.1)',
  fulfillmentConfirmed: '#2F6FED',
  fulfillmentConfirmedBg: 'rgba(47, 111, 237, 0.1)',
  fulfillmentProcessing: '#7A5AF8',
  fulfillmentProcessingBg: 'rgba(122, 90, 248, 0.1)',
  fulfillmentPacked: '#B54708',
  fulfillmentPackedBg: 'rgba(181, 71, 8, 0.1)',
  fulfillmentShipped: '#0E7490',
  fulfillmentShippedBg: 'rgba(14, 116, 144, 0.1)',
  fulfillmentOutForDelivery: '#B54708',
  fulfillmentOutForDeliveryBg: 'rgba(181, 71, 8, 0.1)',
  fulfillmentDelivered: '#12805C',
  fulfillmentDeliveredBg: 'rgba(18, 128, 92, 0.1)',
  fulfillmentCancelled: '#D92D20',
  fulfillmentCancelledBg: 'rgba(217, 45, 32, 0.1)',

  // Seller verification status (blockedReason gate — see useSellerAccess)
  sellerPending: '#B54708',
  sellerPendingBg: 'rgba(181, 71, 8, 0.1)',
  sellerActive: '#12805C',
  sellerActiveBg: 'rgba(18, 128, 92, 0.1)',
  sellerSuspended: '#D92D20',
  sellerSuspendedBg: 'rgba(217, 45, 32, 0.1)',
  sellerRejected: '#D92D20',
  sellerRejectedBg: 'rgba(217, 45, 32, 0.1)',
  sellerInactive: '#8A93A2',
  sellerInactiveBg: 'rgba(138, 147, 162, 0.1)',

  // Payout status
  payoutPending: '#B54708',
  payoutPendingBg: 'rgba(181, 71, 8, 0.1)',
  payoutProcessing: '#7A5AF8',
  payoutProcessingBg: 'rgba(122, 90, 248, 0.1)',
  payoutPaid: '#12805C',
  payoutPaidBg: 'rgba(18, 128, 92, 0.1)',
  payoutFailed: '#D92D20',
  payoutFailedBg: 'rgba(217, 45, 32, 0.1)',
};
// Deliberately not `as const` — every value stays widened to `string`
// (chartPalette to `string[]`) so theme/darkColor.ts's DarkColors can hold
// different literal values under the same keys.

export type ColorToken = keyof typeof Colors;
