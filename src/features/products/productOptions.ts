// Flat, hardcoded picklists shared by AddProductScreen and
// ProductDetailsScreen — no taxonomy/brand endpoint is wired up in this
// app yet (see products.api.ts). Swap these for a real fetched list once
// that contract lands; SelectField doesn't care where its options came
// from.
export const BRAND_OPTIONS = ['Nike', 'Adidas', 'Puma', 'Levis', 'H&M', 'Zara', 'Other'];
export const GENDER_OPTIONS = ['Men', 'Women', 'Kids', 'Unisex'];
export const CATEGORY_OPTIONS = ['Topwear', 'Bottomwear', 'Ethnic Wear', 'Footwear', 'Accessories'];
export const SUBCATEGORY_OPTIONS = ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Sarees', 'Sneakers'];
export const COLOR_OPTIONS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Multicolor'];
export const SEASON_OPTIONS = ['Summer', 'Winter', 'Monsoon', 'All Season'];

// Mirrors the shape of the admin panel's per-subcategory size picker
// (src/pages/products/ProductForm.tsx's sizeOptions), just flattened —
// there's no real subcategory taxonomy wired up here yet (see above), so
// this is one shared list rather than scoped per subcategory.
export const SIZE_OPTIONS = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'Free Size',
  '28',
  '30',
  '32',
  '34',
  '36',
  '38',
  '40',
  '42',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
];
