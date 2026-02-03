import { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth";
import { Spinner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Mzansi Market account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner size="lg" />}>
      <LoginForm />
    </Suspense>
  );
}
