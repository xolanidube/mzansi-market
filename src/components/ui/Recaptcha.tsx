"use client";

import { useEffect, useCallback, useRef } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

interface RecaptchaProps {
  siteKey?: string;
  action: string;
  onVerify: (token: string) => void;
  onError?: (error: Error) => void;
}

export function Recaptcha({ siteKey, action, onVerify, onError }: RecaptchaProps) {
  const scriptLoaded = useRef(false);
  const effectiveSiteKey = siteKey || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!effectiveSiteKey) {
      console.warn("reCAPTCHA site key not configured");
      return;
    }

    // Don't load script multiple times
    if (scriptLoaded.current) return;

    // Check if script already exists
    const existingScript = document.querySelector(
      'script[src^="https://www.google.com/recaptcha/api.js"]'
    );

    if (existingScript) {
      scriptLoaded.current = true;
      return;
    }

    // Load reCAPTCHA v3 script
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${effectiveSiteKey}`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      // Cleanup is optional for reCAPTCHA
    };
  }, [effectiveSiteKey]);

  return null; // reCAPTCHA v3 doesn't render anything visible
}

/**
 * Hook to execute reCAPTCHA verification
 */
export function useRecaptcha(action: string) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const execute = useCallback(async (): Promise<string | null> => {
    if (!siteKey) {
      console.warn("reCAPTCHA site key not configured - skipping");
      return null;
    }

    if (typeof window === "undefined" || !window.grecaptcha) {
      console.warn("reCAPTCHA not loaded");
      return null;
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(siteKey, { action });
          resolve(token);
        } catch (error) {
          console.error("reCAPTCHA execution error:", error);
          reject(error);
        }
      });
    });
  }, [siteKey, action]);

  return { execute, isConfigured: !!siteKey };
}

/**
 * Higher-order component to add reCAPTCHA to forms
 */
export function withRecaptcha<T extends { recaptchaToken?: string }>(
  WrappedComponent: React.ComponentType<T>,
  action: string
) {
  return function RecaptchaWrapper(props: Omit<T, "recaptchaToken">) {
    const { execute } = useRecaptcha(action);

    const handleSubmit = async (formData: T) => {
      const token = await execute();
      return { ...formData, recaptchaToken: token };
    };

    return <WrappedComponent {...(props as T)} />;
  };
}
