// reCAPTCHA v3 verification utility

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Verify a reCAPTCHA token on the server side
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - The expected action name (optional)
 * @param minScore - Minimum score threshold (default 0.5)
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string,
  minScore: number = 0.5
): Promise<{ success: boolean; score?: number; error?: string }> {
  // If reCAPTCHA is not configured, skip verification (development mode)
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn("reCAPTCHA not configured - skipping verification");
    return { success: true, score: 1.0 };
  }

  if (!token) {
    return { success: false, error: "No reCAPTCHA token provided" };
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${data["error-codes"]?.join(", ") || "Unknown error"}`,
      };
    }

    // Check score for v3
    if (data.score !== undefined && data.score < minScore) {
      return {
        success: false,
        score: data.score,
        error: `reCAPTCHA score too low: ${data.score}`,
      };
    }

    // Check action if specified
    if (expectedAction && data.action !== expectedAction) {
      return {
        success: false,
        error: `reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`,
      };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return { success: false, error: "Failed to verify reCAPTCHA" };
  }
}

/**
 * Get the reCAPTCHA site key for client-side use
 */
export function getRecaptchaSiteKey(): string | undefined {
  return RECAPTCHA_SITE_KEY;
}

/**
 * Check if reCAPTCHA is configured
 */
export function isRecaptchaConfigured(): boolean {
  return !!(RECAPTCHA_SECRET_KEY && RECAPTCHA_SITE_KEY);
}
