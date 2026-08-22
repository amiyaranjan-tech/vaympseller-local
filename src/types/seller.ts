export type SellerStatus =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'inactive'
  | 'rejected';

export type ShopStatusMode = 'auto' | 'manual';

export type ShopStatus = 'open' | 'closed' | 'opening_soon' | 'closing_soon';

export type WorkingDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface SellerImage {
  url: string;
  publicId: string;
}

export interface SellerBank {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface SellerWorkingHours {
  open: string;
  close: string;
}

// Mirrors models/Seller.js on the backend, minus password (server strips it).
export interface SellerProfile {
  _id: string;
  shopName: string;
  ownerName: string;
  shopCategory: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  gstNumber: string;
  businessRegistration: string;
  description: string;
  logo: SellerImage;
  cover: SellerImage;
  workingDays: WorkingDay[];
  workingHours: SellerWorkingHours;
  bank: SellerBank;
  revenue: number;
  commission: number;
  commissionRate: number | null;
  orders: number;
  returns: number;
  refunds: number;
  products: number;
  status: SellerStatus;
  rejectionReason: string;
  shopStatusMode: ShopStatusMode;
  shopStatus: ShopStatus;
  isVerified: boolean;
  tryAndBuy: boolean;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
