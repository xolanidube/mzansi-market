// Payment providers configuration
export const PAYMENT_PROVIDERS = {
  YOCO: "YOCO",
  PAYFAST: "PAYFAST",
  MANUAL: "MANUAL",
  WALLET: "WALLET",
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export interface PaymentInitiation {
  amount: number;
  currency?: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  redirectUrl?: string;
  error?: string;
  providerRef?: string;
  providerData?: Record<string, unknown>;
}

export interface PaymentVerification {
  success: boolean;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  providerRef?: string;
  amount?: number;
  error?: string;
  providerData?: Record<string, unknown>;
}

// Environment variables
export const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
export const YOCO_PUBLIC_KEY = process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY;
export const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
export const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
export const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE;
export const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX === "true";

/**
 * Check if a payment provider is configured
 */
export function isProviderConfigured(provider: PaymentProvider): boolean {
  switch (provider) {
    case "YOCO":
      return !!(YOCO_SECRET_KEY && YOCO_PUBLIC_KEY);
    case "PAYFAST":
      return !!(PAYFAST_MERCHANT_ID && PAYFAST_MERCHANT_KEY);
    case "MANUAL":
    case "WALLET":
      return true;
    default:
      return false;
  }
}

/**
 * Get available payment providers
 */
export function getAvailableProviders(): PaymentProvider[] {
  return (Object.keys(PAYMENT_PROVIDERS) as PaymentProvider[]).filter(isProviderConfigured);
}
