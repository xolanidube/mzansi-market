import { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent, Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "How It Works | Mzansi Market",
  description: "Learn how to use Mzansi Market to find and book services, or become a service provider.",
};

const customerSteps = [
  {
    step: 1,
    title: "Browse Services",
    description: "Explore our wide range of services from verified providers across South Africa. Use filters to find exactly what you need.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Compare & Choose",
    description: "Read reviews, compare prices, and check availability. View provider profiles and portfolios to make an informed decision.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Book Instantly",
    description: "Select your preferred date and time, add any special requirements, and confirm your booking in just a few clicks.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    step: 4,
    title: "Get Service & Review",
    description: "Receive professional service at your convenience. After completion, leave a review to help other customers.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const providerSteps = [
  {
    step: 1,
    title: "Create Your Account",
    description: "Sign up as a service provider. It's free to join and only takes a few minutes to get started.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Set Up Your Shop",
    description: "Create your business profile, add your services, set your prices, and upload photos of your work.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Receive Bookings",
    description: "Customers can discover your services and book appointments. You'll receive notifications for each new booking.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    step: 4,
    title: "Grow Your Business",
    description: "Deliver great service, collect reviews, and watch your business grow. Withdraw earnings directly to your bank account.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

const benefits = [
  {
    title: "For Customers",
    items: [
      "Access to verified service providers",
      "Transparent pricing and reviews",
      "Easy online booking",
      "Secure payment options",
      "24/7 customer support",
      "Satisfaction guarantee",
    ],
  },
  {
    title: "For Service Providers",
    items: [
      "Free registration",
      "Reach thousands of customers",
      "Manage bookings easily",
      "Secure and fast payments",
      "Build your reputation",
      "Grow your business",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How Mzansi Market Works
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Whether you&apos;re looking for a service or offering one, we make the process
              simple, secure, and hassle-free.
            </p>
          </div>
        </section>

        {/* For Customers */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                For Customers
              </span>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Finding & Booking Services
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Get the help you need in four simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {customerSteps.map((item) => (
                <div key={item.step} className="relative">
                  {item.step < 4 && (
                    <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-border" />
                  )}
                  <Card className="relative z-10">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                        {item.step}
                      </div>
                      <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/services">
                <Button size="lg">Browse Services</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* For Providers */}
        <section className="py-16 lg:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
                For Service Providers
              </span>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Growing Your Business
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Start earning with Mzansi Market in four easy steps
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {providerSteps.map((item) => (
                <div key={item.step} className="relative">
                  {item.step < 4 && (
                    <div className="hidden lg:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-border" />
                  )}
                  <Card className="relative z-10 bg-background">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                        {item.step}
                      </div>
                      <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-accent">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href="/register?type=provider">
                <Button size="lg" variant="outline">Become a Provider</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
              Why Choose Mzansi Market?
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {benefits.map((benefit) => (
                <Card key={benefit.title}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">{benefit.title}</h3>
                    <ul className="space-y-3">
                      {benefit.items.map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Join Mzansi Market today and experience the easiest way to find or offer services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary">Create an Account</Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
