import { Metadata } from "next";
import { Header, Footer } from "@/components/layout";

export const metadata: Metadata = {
  title: "Privacy Policy | Mzansi Market",
  description: "Read our privacy policy to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                <p className="text-muted-foreground mb-4">
                  Mzansi Market (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                  when you use our website and services.
                </p>
                <p className="text-muted-foreground">
                  By using Mzansi Market, you agree to the collection and use of information in accordance
                  with this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">Personal Information</h3>
                <p className="text-muted-foreground mb-4">
                  We may collect personally identifiable information that you voluntarily provide, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Name and surname</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Physical address</li>
                  <li>Payment information</li>
                  <li>Profile photos</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">Usage Information</h3>
                <p className="text-muted-foreground mb-4">
                  We automatically collect certain information when you use our platform:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent</li>
                  <li>Search queries and interactions</li>
                  <li>Location data (with your permission)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">We use the collected information to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Process bookings and payments</li>
                  <li>Connect customers with service providers</li>
                  <li>Send important notifications and updates</li>
                  <li>Improve our platform and user experience</li>
                  <li>Respond to inquiries and provide customer support</li>
                  <li>Detect and prevent fraud or abuse</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing</h2>
                <p className="text-muted-foreground mb-4">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li><strong>With Service Providers:</strong> When you book a service, your contact information is shared with the provider</li>
                  <li><strong>With Customers:</strong> If you&apos;re a service provider, your business information is visible to potential customers</li>
                  <li><strong>With Third Parties:</strong> We may use trusted third-party services for payment processing, analytics, and communication</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate security measures to protect your personal information, including:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication mechanisms</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and monitoring</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  However, no method of transmission over the Internet is 100% secure, and we cannot
                  guarantee absolute security.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
                <p className="text-muted-foreground mb-4">Under POPIA, you have the right to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Withdraw consent at any time</li>
                  <li>Lodge a complaint with the Information Regulator</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar technologies to enhance your experience. These help us:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Remember your preferences</li>
                  <li>Understand how you use our platform</li>
                  <li>Provide personalized content</li>
                  <li>Analyze traffic and trends</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  You can control cookies through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Children&apos;s Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not intended for children under 18. We do not knowingly collect
                  personal information from children. If we become aware of any such data, we will
                  delete it promptly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any
                  changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  If you have questions about this Privacy Policy, please contact us:
                </p>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> privacy@mzansimarket.co.za</li>
                  <li><strong>Phone:</strong> +27 11 123 4567</li>
                  <li><strong>Address:</strong> 123 Main Street, Sandton, Johannesburg</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
