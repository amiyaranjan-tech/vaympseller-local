import { z } from 'zod';

// Mirrors validations/sellerAuth.validation.js on the backend so form
// errors surface before a round trip, not instead of server validation.
const bankSchema = z.object({
  accountName: z.string().trim().min(1, 'Account holder name is required'),
  accountNumber: z.string().trim().min(1, 'Account number is required'),
  ifsc: z.string().trim().min(1, 'IFSC code is required'),
  bankName: z.string().trim().min(1, 'Bank name is required'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    shopName: z.string().trim().min(1, 'Shop name is required'),
    ownerName: z.string().trim().min(1, 'Owner name is required'),
    email: z.string().trim().email('Enter a valid email address'),
    phone: z.string().trim().min(6, 'Enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    address: z.string().trim().min(1, 'Address is required'),
    city: z.string().trim().min(1, 'City is required'),
    state: z.string().trim().min(1, 'State is required'),
    postalCode: z.string().trim().min(1, 'Postal code is required'),
    // Required — mirrors the admin app's own seller.schema.ts
    // (gstNumber/businessRegistration are `.required()` in BOTH
    // validations/sellerAuth.validation.js AND validations/seller.validation.js's
    // createSellerSchema on the backend, so a seller self-registering isn't
    // held to a looser standard than one an admin provisions manually).
    // Previously unvalidated here (bare z.string().trim()), which let an
    // empty submission pass client-side only to fail against the backend's
    // real requirement — same min-length rules as the admin form. GSTIN is
    // always exactly 15 characters, so that's the one extra check worth
    // adding here — NOT the full letter/digit-position GSTIN pattern:
    // neither the admin form nor the backend enforce that real-world shape
    // today (both just check presence), so holding self-registration to a
    // stricter bar than either of those would reject values an admin could
    // still enter by hand.
    gstNumber: z.string().trim().toUpperCase().length(15, 'GST number must be 15 characters'),
    businessRegistration: z.string().trim().min(3, 'Business registration number is required'),
    bank: bankSchema,
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string(),
  })
  .refine(values => values.newPassword === values.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmNewPassword: z.string(),
  })
  .refine(values => values.newPassword === values.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
