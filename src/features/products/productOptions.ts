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
