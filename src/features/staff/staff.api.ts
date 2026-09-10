import { request } from '../../api/client';

// Mirrors models/SellerStaff.js + routes/sellerStaff.routes.js on the
// backend — owner-only helper-account management.
export interface SellerStaffMember {
  _id: string;
  seller: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffPayload {
  name: string;
  email: string;
  password: string;
}

export function getStaff(): Promise<{ staff: SellerStaffMember[] }> {
  return request<{ staff: SellerStaffMember[] }>({
    url: '/seller/staff',
    method: 'GET',
  });
}

export function createStaff(payload: CreateStaffPayload): Promise<{ staff: SellerStaffMember }> {
  return request<{ staff: SellerStaffMember }>({
    url: '/seller/staff',
    method: 'POST',
    data: payload,
  });
}

export function updateStaffStatus(
  id: string,
  status: 'active' | 'inactive',
): Promise<{ staff: SellerStaffMember }> {
  return request<{ staff: SellerStaffMember }>({
    url: `/seller/staff/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
}

export function removeStaff(id: string): Promise<null> {
  return request<null>({ url: `/seller/staff/${id}`, method: 'DELETE' });
}
