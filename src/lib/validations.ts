import { z } from "zod";

// ==================== AUTH SCHEMAS ====================

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z.string().optional(),
    userType: z.enum(["CLIENT", "SERVICE_PROVIDER"]).default("CLIENT"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ==================== USER SCHEMAS ====================

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

// ==================== SHOP SCHEMAS ====================

export const shopSchema = z.object({
  name: z.string().min(2, "Shop name must be at least 2 characters").max(100),
  description: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
  contact: z.string().optional(),
  tax: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  openingDays: z.array(z.string()).optional(),
  allowedBooking: z.boolean().default(true),
});

// ==================== SERVICE SCHEMAS ====================

export const serviceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters").max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive("Price must be a positive number"),
  chargeTime: z.number().int().positive("Charge time must be a positive integer"),
  categoryId: z.string().optional(),
});

// ==================== JOB SCHEMAS ====================

export const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters").max(5000),
  categoryId: z.string().optional(),
  subCategory: z.string().optional(),
  skills: z.array(z.string()).max(10, "Maximum 10 skills allowed"),
  jobType: z.enum([
    "FIX",
    "HOURLY",
    "FREELANCE",
    "FULLTIME",
    "PARTTIME",
    "INTERNSHIP",
    "TEMPORARY",
    "CUSTOM",
  ]),
  customJobType: z.string().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  deliveryDays: z.number().int().positive().optional(),
  preferredLocation: z.string().optional(),
});

export const jobApplicationSchema = z.object({
  proposal: z.string().min(50, "Proposal must be at least 50 characters").max(2000),
  bidAmount: z.number().positive("Bid amount must be positive").optional(),
});

// ==================== APPOINTMENT SCHEMAS ====================

export const appointmentSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  address: z.string().optional(),
  note: z.string().max(1000).optional(),
  paymentMode: z.string().optional(),
  services: z.array(z.string()).min(1, "At least one service is required"),
  providerId: z.string().min(1, "Provider is required"),
  serviceId: z.string().optional(),
});

// ==================== MESSAGE SCHEMAS ====================

export const messageSchema = z.object({
  receiverId: z.string().min(1, "Recipient is required"),
  subject: z.string().max(200).optional(),
  content: z.string().min(1, "Message content is required").max(5000),
});

// ==================== REVIEW SCHEMAS ====================

export const reviewSchema = z.object({
  receiverId: z.string().min(1, "Recipient is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  text: z.string().max(1000).optional(),
});

// ==================== PRODUCT SCHEMAS ====================

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters").max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive("Price must be a positive number"),
  categoryId: z.string().optional(),
  quantity: z.number().int().nonnegative().default(0),
});

// ==================== ORDER SCHEMAS ====================

export const orderItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  address: z.string().min(10, "Delivery address is required"),
  notes: z.string().max(500).optional(),
});

// ==================== SEARCH SCHEMAS ====================

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  location: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ShopInput = z.infer<typeof shopSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
