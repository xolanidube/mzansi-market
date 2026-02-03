import { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth";
import { Spinner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Mzansi Market to find or offer services",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner size="lg" />}>
      <RegisterForm />
    </Suspense>
  );
}
