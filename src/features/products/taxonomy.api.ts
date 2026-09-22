import { request } from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import type { UploadedImage } from '../../api/uploads.api';

// Backend's DropdownOption is the single shared taxonomy store the admin
// panel already reads/writes from (see models/DropdownOption.js) — these
// mirror its read-only seller-scoped passthrough (routes/sellerTaxonomy.
// routes.js) plus the one write a seller is allowed: adding a brand.

export function getGenders(): Promise<string[]> {
  return request<string[]>({ url: ENDPOINTS.sellerTaxonomy.genders, method: 'GET' });
}

export function getCategories(gender: string): Promise<string[]> {
  return request<string[]>({
    url: ENDPOINTS.sellerTaxonomy.categories,
    method: 'GET',
    params: { gender },
  });
}

export function getSubcategories(gender: string, category: string): Promise<string[]> {
  return request<string[]>({
    url: ENDPOINTS.sellerTaxonomy.subcategories,
    method: 'GET',
    params: { gender, category },
  });
}

// Generic passthrough for the unscoped/scoped DropdownOption fields a
// seller only ever picks from — brand, color, season, and size (size is
// scoped by subcategory; pass it as `scope`).
export function getOptions(field: string, scope?: string): Promise<string[]> {
  return request<string[]>({
    url: ENDPOINTS.sellerTaxonomy.options,
    method: 'GET',
    params: scope ? { field, scope } : { field },
  });
}

export interface Brand {
  value: string;
  image: UploadedImage;
}

// The one taxonomy field a seller can add to, not just pick from — a shop
// may carry a brand no one else has listed yet. Case-insensitively
// upserts server-side, so calling this with an existing name just
// attaches/replaces its logo rather than erroring.
export function createBrand(name: string, image?: UploadedImage): Promise<Brand> {
  return request<Brand>({
    url: ENDPOINTS.sellerTaxonomy.createBrand,
    method: 'POST',
    data: { name, image },
  });
}
