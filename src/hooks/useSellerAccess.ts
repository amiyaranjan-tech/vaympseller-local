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
//
// isAccountActive vs isActive: a seller can be status "active" but
// isVerified false (an admin can unverify without suspending — see
// services/seller.service.js#updateVerification on the backend). That
// seller should still reach the main app (isAccountActive), just with
// verified-only actions like adding a product gated off (isActive).
export function useSellerAccess() {
  const seller = useAuthStore(state => state.seller);

  const status = seller?.status ?? 'pending';
  const isVerified = seller?.isVerified ?? false;
  const isAccountActive = status === 'active';
  const isActive = isAccountActive && isVerified;

  return {
    seller,
    isAccountActive,
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
