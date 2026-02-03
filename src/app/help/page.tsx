import { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent, Button } from "@/components/ui";
import { Search, MessageCircle, Phone, Mail, FileText, HelpCircle, Users, CreditCard, Calendar, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center | Mzansi Market",
  description: "Find answers to common questions and get support for Mzansi Market.",
};

const categories = [
  {
    title: "Getting Started",
    icon: <HelpCircle className="w-6 h-6" />,
    articles: [
      { title: "How to create an account", href: "#" },
      { title: "Setting up your profile", href: "#" },
      { title: "Browsing and searching services", href: "#" },
      { title: "Understanding service listings", href: "#" },
    ],
  },
  {
    title: "Booking Services",
    icon: <Calendar className="w-6 h-6" />,
    articles: [
      { title: "How to book a service", href: "#" },
      { title: "Managing your bookings", href: "#" },
      { title: "Cancellation and refunds", href: "#" },
      { title: "Rescheduling appointments", href: "#" },
    ],
  },
  {
    title: "For Service Providers",
    icon: <Users className="w-6 h-6" />,
    articles: [
      { title: "Becoming a service provider", href: "#" },
      { title: "Setting up your shop", href: "#" },
      { title: "Creating service listings", href: "#" },
      { title: "Managing bookings and calendar", href: "#" },
    ],
  },
  {
    title: "Payments & Billing",
    icon: <CreditCard className="w-6 h-6" />,
    articles: [
      { title: "Payment methods accepted", href: "#" },
      { title: "Understanding fees", href: "#" },
      { title: "Withdrawing earnings", href: "#" },
      { title: "Invoices and receipts", href: "#" },
    ],
  },
  {
    title: "Trust & Safety",
    icon: <Shield className="w-6 h-6" />,
    articles: [
      { title: "How we verify providers", href: "#" },
      { title: "Leaving reviews and ratings", href: "#" },
      { title: "Reporting problems", href: "#" },
      { title: "Privacy and data protection", href: "#" },
    ],
  },
  {
    title: "Account Settings",
    icon: <FileText className="w-6 h-6" />,
    articles: [
      { title: "Updating your profile", href: "#" },
      { title: "Changing your password", href: "#" },
      { title: "Notification preferences", href: "#" },
      { title: "Deleting your account", href: "#" },
    ],
  },
];

const popularQuestions = [
  {
    question: "How do I cancel a booking?",
    answer: "You can cancel a booking from your Dashboard > My Bookings. Click on the booking you want to cancel and select 'Cancel Booking'. Cancellations made more than 24 hours before the appointment are eligible for a full refund.",
  },
  {
    question: "How do I become a service provider?",
    answer: "To become a service provider, create an account and select 'Service Provider' during registration. You'll then be able to set up your shop, add services, and start receiving bookings.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit and debit cards (Visa, Mastercard), EFT payments, and mobile payment options like SnapScan and Zapper.",
  },
  {
    question: "How do I contact a service provider?",
    answer: "You can message a service provider directly through their profile page or booking details. Click the 'Send Message' button to start a conversation.",
  },
  {
    question: "What if I'm not satisfied with a service?",
    answer: "If you're not satisfied, first try to resolve the issue with the service provider. If that doesn't work, contact our support team within 48 hours of the service completion, and we'll help mediate.",
  },
  {
    question: "How do I get paid as a service provider?",
    answer: "Earnings are deposited to your wallet after successful service completion. You can withdraw funds to your bank account at any time from Dashboard > Wallet.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Search our help center or browse categories below
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search for help..."
                  className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Contact */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="/contact" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <MessageCircle className="w-5 h-5" />
                <span>Contact Support</span>
              </Link>
              <a href="tel:+27111234567" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <Phone className="w-5 h-5" />
                <span>+27 11 123 4567</span>
              </a>
              <a href="mailto:support@mzansimarket.co.za" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <Mail className="w-5 h-5" />
                <span>support@mzansimarket.co.za</span>
              </a>
            </div>
          </div>
        </section>

        {/* Help Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        {category.icon}
                      </div>
                      <h3 className="font-semibold text-foreground">{category.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {category.articles.map((article) => (
                        <li key={article.title}>
                          <Link
                            href={article.href}
                            className="text-sm text-muted-foreground hover:text-primary"
                          >
                            {article.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Questions */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-4">
              {popularQuestions.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Still Need Help */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Still need help?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Our support team is available Monday to Friday, 8am to 6pm SAST.
              We typically respond within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:support@mzansimarket.co.za">Email Us</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
