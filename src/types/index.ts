// Re-export Prisma types for convenience
export type {
  User,
  Shop,
  Service,
  Job,
  JobApplication,
  Appointment,
  Message,
  Review,
  Product,
  Order,
  OrderItem,
  Wallet,
  Transaction,
  Category,
} from "@prisma/client";

// Enum types
export type UserType = "CLIENT" | "SERVICE_PROVIDER" | "ADMIN";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type JobType =
  | "FIX"
  | "HOURLY"
  | "FREELANCE"
  | "FULLTIME"
  | "PARTTIME"
  | "INTERNSHIP"
  | "TEMPORARY"
  | "CUSTOM";
export type JobStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "CLOSED";
export type ApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";
export type MessageStatus = "UNREAD" | "READ" | "ARCHIVED" | "DELETED";
export type ProductStatus = "AVAILABLE" | "OUT_OF_STOCK" | "DISCONTINUED";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";
export type TransactionType = "CREDIT" | "DEBIT" | "REFUND" | "WITHDRAWAL";

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// User with relations
export interface UserWithShop {
  id: string;
  email: string;
  username: string;
  phone: string | null;
  gender: Gender | null;
  userType: UserType;
  picture: string | null;
  uniqueKey: string;
  isVerified: boolean;
  createdAt: Date;
  shop: ShopBasic | null;
}

export interface ShopBasic {
  id: string;
  name: string;
  address: string | null;
  rating: number;
  totalReviews: number;
  profileUrl: string | null;
}

// Service with provider
export interface ServiceWithProvider {
  id: string;
  uniqueKey: string;
  name: string;
  description: string | null;
  price: number;
  chargeTime: number;
  picture: string | null;
  isActive: boolean;
  createdAt: Date;
  provider: {
    id: string;
    username: string;
    picture: string | null;
    shop: ShopBasic | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
}

// Job with poster
export interface JobWithPoster {
  id: string;
  title: string;
  description: string;
  skills: string[];
  jobType: JobType;
  budgetMin: number | null;
  budgetMax: number | null;
  estimatedBudget: string | null;
  deliveryDays: number | null;
  preferredLocation: string | null;
  status: JobStatus;
  createdAt: Date;
  poster: {
    id: string;
    username: string;
    picture: string | null;
  };
  category: {
    id: string;
    name: string;
  } | null;
  _count: {
    applications: number;
  };
}

// Appointment with details
export interface AppointmentWithDetails {
  id: string;
  date: Date;
  time: string;
  address: string | null;
  note: string | null;
  paymentMode: string | null;
  services: string[];
  status: AppointmentStatus;
  createdAt: Date;
  requester: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
    picture: string | null;
  };
  provider: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
    picture: string | null;
    shop: ShopBasic | null;
  };
  service: {
    id: string;
    name: string;
    price: number;
  } | null;
}

// Message with users
export interface MessageWithUsers {
  id: string;
  subject: string | null;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    picture: string | null;
  };
  receiver: {
    id: string;
    username: string;
    picture: string | null;
  };
}

// Review with users
export interface ReviewWithUsers {
  id: string;
  rating: number;
  text: string | null;
  createdAt: Date;
  sender: {
    id: string;
    username: string;
    picture: string | null;
  };
  receiver: {
    id: string;
    username: string;
    picture: string | null;
  };
}

// Cart types for e-commerce
export interface CartItem {
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string | null;
    quantity: number;
  };
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: "price_asc" | "price_desc" | "date_asc" | "date_desc" | "rating";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// Dashboard stats
export interface DashboardStats {
  totalServices: number;
  totalJobs: number;
  totalAppointments: number;
  pendingAppointments: number;
  unreadMessages: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
}

// Notification types
export interface Notification {
  id: string;
  type:
    | "appointment"
    | "message"
    | "review"
    | "job_application"
    | "order"
    | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  link?: string;
}
