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
    gstNumber: z.string().trim().min(1, 'GST number is required'),
    businessRegistration: z
      .string()
      .trim()
      .min(1, 'Business registration number is required'),
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
