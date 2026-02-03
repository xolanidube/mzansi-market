import { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Mzansi Market account password",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
