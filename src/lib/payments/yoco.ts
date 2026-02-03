import {
  YOCO_SECRET_KEY,
  PaymentInitiation,
  PaymentResult,
  PaymentVerification,
} from "./index";

const YOCO_API_URL = "https://online.yoco.com/v1";

interface YocoCheckoutRequest {
  amount: number;
  currency: string;
  cancelUrl: string;
  successUrl: string;
  failureUrl: string;
  metadata?: Record<string, unknown>;
}

interface YocoCheckoutResponse {
  id: string;
  redirectUrl: string;
  status: string;
}

interface YocoPaymentResponse {
  id: string;
  status: "pending" | "successful" | "failed";
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
  createdDate: string;
  errorMessage?: string;
}

/**
 * Initiate a Yoco checkout session
 */
export async function initiateYocoPayment(
  params: PaymentInitiation
): Promise<PaymentResult> {
  if (!YOCO_SECRET_KEY) {
    return {
      success: false,
      error: "Yoco is not configured",
    };
  }

  try {
    const checkoutRequest: YocoCheckoutRequest = {
      amount: Math.round(params.amount * 100), // Yoco expects amount in cents
      currency: params.currency || "ZAR",
      cancelUrl: params.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
      successUrl: params.returnUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
      failureUrl: params.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/failed`,
      metadata: params.metadata,
    };

    const response = await fetch(`${YOCO_API_URL}/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
      },
      body: JSON.stringify(checkoutRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to initiate Yoco payment",
      };
    }

    const data: YocoCheckoutResponse = await response.json();

    return {
      success: true,
      paymentId: data.id,
      redirectUrl: data.redirectUrl,
      providerRef: data.id,
      providerData: data as unknown as Record<string, unknown>,
    };
  } catch (error) {
    console.error("Yoco payment initiation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate payment",
    };
  }
}

/**
 * Verify a Yoco payment status
 */
export async function verifyYocoPayment(
  checkoutId: string
): Promise<PaymentVerification> {
  if (!YOCO_SECRET_KEY) {
    return {
      success: false,
      status: "FAILED",
      error: "Yoco is not configured",
    };
  }

  try {
    const response = await fetch(`${YOCO_API_URL}/checkouts/${checkoutId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        status: "FAILED",
        error: "Failed to verify payment",
      };
    }

    const data: YocoPaymentResponse = await response.json();

    const statusMap: Record<string, PaymentVerification["status"]> = {
      pending: "PENDING",
      successful: "COMPLETED",
      failed: "FAILED",
    };

    return {
      success: data.status === "successful",
      status: statusMap[data.status] || "PENDING",
      providerRef: data.id,
      amount: data.amount / 100, // Convert back from cents
      providerData: data as unknown as Record<string, unknown>,
      error: data.errorMessage,
    };
  } catch (error) {
    console.error("Yoco payment verification error:", error);
    return {
      success: false,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Failed to verify payment",
    };
  }
}

/**
 * Generate Yoco inline checkout configuration
 */
export function getYocoInlineConfig(
  amount: number,
  currency: string = "ZAR"
): Record<string, unknown> {
  return {
    publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY,
    amountInCents: Math.round(amount * 100),
    currency,
  };
}
