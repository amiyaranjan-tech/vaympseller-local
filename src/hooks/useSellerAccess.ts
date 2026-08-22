import { useAuthStore } from '../store/useAuthStore';
import type { SellerStatus } from '../types/seller';

const BLOCKED_MESSAGES: Record<Exclude<SellerStatus, 'active'>, string> = {
  pending: 'Your shop is awaiting verification.',
  suspended: 'Your account has been suspended.',
  inactive: 'Your account has been deactivated.',
  rejected: 'Your shop registration was rejected.',
};

// Screens/actions that require an active, verified shop (creating a
// product, updating stock, shipping an order, ...) should check this
// before calling a mutation — the backend enforces the same rule via
// middleware/requireActiveSeller.js, this is purely for UX (hiding/
// disabling actions), never the source of truth.
export function useSellerAccess() {
  const seller = useAuthStore(state => state.seller);

  const status = seller?.status ?? 'pending';
  const isVerified = seller?.isVerified ?? false;
  const isActive = status === 'active' && isVerified;

  return {
    seller,
    isActive,
    isVerified,
    isPending: status === 'pending',
    isRejected: status === 'rejected',
    isSuspended: status === 'suspended',
    isInactive: status === 'inactive',
    blockedReason: isActive
      ? null
      : seller?.rejectionReason && status === 'rejected'
        ? seller.rejectionReason
        : BLOCKED_MESSAGES[status as Exclude<SellerStatus, 'active'>],
  };
}
