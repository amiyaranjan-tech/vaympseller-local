// FontSize/LineHeight scales mirror the Consumer app's theme/typography.ts
// exactly. No custom font bundling here (unlike Consumer's Sansation
// family) — the system font is fine per spec, so weight is expressed via
// FontWeight instead of a font-family map.
export const FontSize = {
  xxxs: 8,
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 19,
  xxl: 22,
  xxxl: 26,
  display: 30,
  hero: 36,
} as const;

export const LineHeight = {
  xxxs: 12,
  xxs: 14,
  xs: 16,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 28,
  xxl: 32,
  xxxl: 36,
  display: 40,
  hero: 46,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
