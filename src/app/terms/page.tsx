import { Metadata } from "next";
import { Header, Footer } from "@/components/layout";

export const metadata: Metadata = {
  title: "Terms and Conditions | Mzansi Market",
  description: "Read the terms and conditions for using Mzansi Market services.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">Terms and Conditions</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 2024</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using Mzansi Market (&quot;the Platform&quot;), you agree to be bound by these
                  Terms and Conditions. If you do not agree to these terms, please do not use our services.
                </p>
                <p className="text-muted-foreground">
                  These terms apply to all users, including customers, service providers, and visitors.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Services</h2>
                <p className="text-muted-foreground mb-4">
                  Mzansi Market is an online marketplace that connects service providers with customers
                  seeking various services. We facilitate the discovery, booking, and communication
                  between parties but are not a party to any agreements between users.
                </p>
                <p className="text-muted-foreground">
                  We do not provide the services listed on the platform directly. Service providers
                  are independent contractors and not employees or agents of Mzansi Market.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">Registration</h3>
                <p className="text-muted-foreground mb-4">
                  To use certain features, you must create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground mb-4 space-y-2">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mb-3">Account Types</h3>
                <p className="text-muted-foreground">
                  Users may register as Customers (to book services) or Service Providers (to offer services).
                  Each account type has specific features and obligations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Service Provider Terms</h2>
                <p className="text-muted-foreground mb-4">As a service provider, you agree to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate descriptions of your services</li>
                  <li>Honor all confirmed bookings</li>
                  <li>Maintain appropriate licenses and permits</li>
                  <li>Deliver services professionally and safely</li>
                  <li>Respond to customer inquiries promptly</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not discriminate against customers</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Customer Terms</h2>
                <p className="text-muted-foreground mb-4">As a customer, you agree to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Provide accurate booking information</li>
                  <li>Be available at the scheduled time</li>
                  <li>Pay for services as agreed</li>
                  <li>Treat service providers with respect</li>
                  <li>Provide honest reviews and feedback</li>
                  <li>Report any issues promptly</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Bookings and Payments</h2>
                <h3 className="text-xl font-medium text-foreground mb-3">Booking Process</h3>
                <p className="text-muted-foreground mb-4">
                  Bookings are confirmed once accepted by the service provider. Confirmation details
                  will be sent via email and visible in your dashboard.
                </p>

                <h3 className="text-xl font-medium text-foreground mb-3">Cancellation Policy</h3>
                <p className="text-muted-foreground mb-4">
                  Cancellations made more than 24 hours before the appointment are eligible for a
                  full refund. Late cancellations may be subject to a cancellation fee.
                </p>

                <h3 className="text-xl font-medium text-foreground mb-3">Payments</h3>
                <p className="text-muted-foreground">
                  Payments are processed securely through our platform. Service providers receive
                  payment after successful completion of services, minus applicable fees.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Reviews and Content</h2>
                <p className="text-muted-foreground mb-4">
                  Users may post reviews, ratings, and other content. By posting content, you:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Grant us a license to use, display, and distribute the content</li>
                  <li>Confirm the content is accurate and not misleading</li>
                  <li>Agree not to post defamatory, offensive, or illegal content</li>
                  <li>Accept that we may remove content that violates these terms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Prohibited Activities</h2>
                <p className="text-muted-foreground mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Use the platform for illegal purposes</li>
                  <li>Post false or misleading information</li>
                  <li>Harass or abuse other users</li>
                  <li>Circumvent platform fees or processes</li>
                  <li>Attempt to hack or disrupt the platform</li>
                  <li>Scrape or collect user data without permission</li>
                  <li>Use automated systems to access the platform</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Intellectual Property</h2>
                <p className="text-muted-foreground">
                  All content, trademarks, and intellectual property on the platform belong to
                  Mzansi Market or its licensors. You may not use, copy, or distribute any content
                  without prior written permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">10. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  To the maximum extent permitted by law, Mzansi Market shall not be liable for:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                  <li>Quality, safety, or legality of services provided</li>
                  <li>Actions or omissions of service providers or customers</li>
                  <li>Indirect, incidental, or consequential damages</li>
                  <li>Loss of data, profits, or business opportunities</li>
                  <li>Service interruptions or platform unavailability</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">11. Dispute Resolution</h2>
                <p className="text-muted-foreground mb-4">
                  In case of disputes between users, we encourage resolution through our platform&apos;s
                  support system. If unresolved, disputes may be submitted to mediation or arbitration
                  in accordance with South African law.
                </p>
                <p className="text-muted-foreground">
                  These terms are governed by the laws of the Republic of South Africa.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">12. Termination</h2>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate accounts that violate these terms.
                  You may close your account at any time through your account settings. Certain
                  provisions survive termination, including liability limitations.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">13. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We may modify these terms at any time. Material changes will be communicated via
                  email or platform notification. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground mb-4">14. Contact Information</h2>
                <p className="text-muted-foreground mb-4">
                  For questions about these terms, contact us:
                </p>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> legal@mzansimarket.co.za</li>
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
