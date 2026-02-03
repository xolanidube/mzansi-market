import crypto from "crypto";
import {
  PAYFAST_MERCHANT_ID,
  PAYFAST_MERCHANT_KEY,
  PAYFAST_PASSPHRASE,
  PAYFAST_SANDBOX,
  PaymentInitiation,
  PaymentResult,
  PaymentVerification,
} from "./index";

const PAYFAST_URL = PAYFAST_SANDBOX
  ? "https://sandbox.payfast.co.za/eng/process"
  : "https://www.payfast.co.za/eng/process";

const PAYFAST_VALIDATE_URL = PAYFAST_SANDBOX
  ? "https://sandbox.payfast.co.za/eng/query/validate"
  : "https://www.payfast.co.za/eng/query/validate";

interface PayFastData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first?: string;
  name_last?: string;
  email_address?: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  signature?: string;
}

interface PayFastITNData {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  merchant_id: string;
  signature: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
}

/**
 * Generate PayFast signature
 */
function generatePayFastSignature(
  data: Record<string, string>,
  passphrase?: string
): string {
  // Create parameter string
  let paramString = Object.keys(data)
    .filter((key) => key !== "signature" && data[key] !== "")
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`)
    .join("&");

  // Add passphrase if provided
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }

  return crypto.createHash("md5").update(paramString).digest("hex");
}

/**
 * Initiate a PayFast payment
 */
export async function initiatePayFastPayment(
  params: PaymentInitiation & {
    customerEmail?: string;
    customerFirstName?: string;
    customerLastName?: string;
  }
): Promise<PaymentResult> {
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    return {
      success: false,
      error: "PayFast is not configured",
    };
  }

  try {
    const paymentId = params.reference || `PF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payFastData: PayFastData = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: params.returnUrl || `${process.env.NEXTAUTH_URL}/payment/success`,
      cancel_url: params.cancelUrl || `${process.env.NEXTAUTH_URL}/payment/cancel`,
      notify_url: params.notifyUrl || `${process.env.NEXTAUTH_URL}/api/payments/webhook/payfast`,
      m_payment_id: paymentId,
      amount: params.amount.toFixed(2),
      item_name: params.description || "Payment",
    };

    if (params.customerEmail) {
      payFastData.email_address = params.customerEmail;
    }
    if (params.customerFirstName) {
      payFastData.name_first = params.customerFirstName;
    }
    if (params.customerLastName) {
      payFastData.name_last = params.customerLastName;
    }

    // Store metadata in custom fields
    if (params.metadata) {
      const metadataStr = JSON.stringify(params.metadata);
      if (metadataStr.length <= 255) {
        payFastData.custom_str1 = metadataStr;
      }
    }

    // Generate signature
    const dataForSignature: Record<string, string> = {};
    Object.entries(payFastData).forEach(([key, value]) => {
      if (value !== undefined) {
        dataForSignature[key] = value;
      }
    });

    payFastData.signature = generatePayFastSignature(
      dataForSignature,
      PAYFAST_PASSPHRASE
    );

    // Build redirect URL with query parameters
    const queryString = Object.entries(payFastData)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
      .join("&");

    const redirectUrl = `${PAYFAST_URL}?${queryString}`;

    return {
      success: true,
      paymentId,
      redirectUrl,
      providerRef: paymentId,
      providerData: payFastData as unknown as Record<string, unknown>,
    };
  } catch (error) {
    console.error("PayFast payment initiation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to initiate payment",
    };
  }
}

/**
 * Verify PayFast ITN (Instant Transaction Notification)
 */
export async function verifyPayFastITN(
  itnData: PayFastITNData,
  requestIp: string
): Promise<PaymentVerification> {
  if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
    return {
      success: false,
      status: "FAILED",
      error: "PayFast is not configured",
    };
  }

  try {
    // Verify merchant ID
    if (itnData.merchant_id !== PAYFAST_MERCHANT_ID) {
      return {
        success: false,
        status: "FAILED",
        error: "Invalid merchant ID",
      };
    }

    // Verify signature
    const dataForSignature: Record<string, string> = {};
    Object.entries(itnData).forEach(([key, value]) => {
      if (key !== "signature" && value !== undefined) {
        dataForSignature[key] = value;
      }
    });

    const calculatedSignature = generatePayFastSignature(
      dataForSignature,
      PAYFAST_PASSPHRASE
    );

    if (calculatedSignature !== itnData.signature) {
      return {
        success: false,
        status: "FAILED",
        error: "Invalid signature",
      };
    }

    // Validate with PayFast server
    const validateResponse = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: Object.entries(itnData)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join("&"),
    });

    const validateResult = await validateResponse.text();

    if (validateResult !== "VALID") {
      return {
        success: false,
        status: "FAILED",
        error: "Payment validation failed",
      };
    }

    // Map payment status
    const statusMap: Record<string, PaymentVerification["status"]> = {
      COMPLETE: "COMPLETED",
      FAILED: "FAILED",
      PENDING: "PENDING",
      CANCELLED: "CANCELLED",
    };

    const status = statusMap[itnData.payment_status] || "PENDING";

    return {
      success: itnData.payment_status === "COMPLETE",
      status,
      providerRef: itnData.pf_payment_id,
      amount: parseFloat(itnData.amount_gross),
      providerData: itnData as unknown as Record<string, unknown>,
    };
  } catch (error) {
    console.error("PayFast ITN verification error:", error);
    return {
      success: false,
      status: "FAILED",
      error: error instanceof Error ? error.message : "Failed to verify payment",
    };
  }
}

/**
 * Get PayFast allowed IP addresses for ITN validation
 */
export function getPayFastAllowedIPs(): string[] {
  if (PAYFAST_SANDBOX) {
    return [
      "197.97.145.144",
      "197.97.145.145",
      "197.97.145.146",
      "197.97.145.147",
    ];
  }
  return [
    "197.97.145.144",
    "197.97.145.145",
    "197.97.145.146",
    "197.97.145.147",
    "41.74.179.194",
    "41.74.179.195",
    "41.74.179.196",
    "41.74.179.197",
  ];
}
