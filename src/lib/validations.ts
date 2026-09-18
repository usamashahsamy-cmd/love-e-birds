import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
  email: z.string().email("Invalid email address"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
  countryCode: z.string().min(1, "Country code is required").max(5, "Invalid country code"),
  phone: z.string().min(7, "Phone number must be at least 7 digits").max(15, "Phone number is too long").regex(/^[0-9]+$/, "Phone number must only contain digits"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  referralCode: z.string().max(50).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const profileEditSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
});

export const rechargeSchema = z.object({
  amount: z.number().min(10, "Minimum recharge is ₹10").max(100000, "Maximum recharge is ₹1,00,000"),
  paymentMethod: z.string().min(1, "Select a payment method"),
});

export const withdrawSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal is ₹100"),
  paymentMethodId: z.string().min(1, "Select a payment method"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Must contain at least one letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const reportSchema = z.object({
  type: z.enum(["SPAM", "HARASSMENT", "FAKE_PROFILE", "INAPPROPRIATE", "OTHER"]),
  reason: z.string().min(10, "Please provide more details"),
});

export const paymentMethodSchema = z.object({
  type: z.enum(["UPI", "BANK_CARD", "BANK_ACCOUNT", "WALLET"]),
  label: z.string().min(1, "Label is required"),
  details: z.string().min(5, "Payment details are required"),
});

export const verificationSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  idType: z.enum(["AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID"]),
  documentUrl: z.string().min(1, "ID document is required"),
  selfieUrl: z.string().optional(),
});

export const bannerSchema = z.object({
  id: z.string().optional(),
  slug: z.string().max(50).optional().or(z.literal("")),
  title: z.string().min(1, "Title is required").max(100),
  subtitle: z.string().max(200).optional().or(z.literal("")),
  imageUrl: z.string().min(1, "Image URL is required").url("Invalid image URL"),
  linkUrl: z.string().max(200).optional().or(z.literal("")),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileEditInput = z.infer<typeof profileEditSchema>;
export type RechargeInput = z.infer<typeof rechargeSchema>;
export type WithdrawInput = z.infer<typeof withdrawSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
export type VerificationInput = z.infer<typeof verificationSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;