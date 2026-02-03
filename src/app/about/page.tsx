import { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent, Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "About Us | Mzansi Market",
  description: "Learn about Mzansi Market - South Africa's premier marketplace connecting service providers with customers.",
};

const stats = [
  { label: "Service Providers", value: "10,000+" },
  { label: "Happy Customers", value: "50,000+" },
  { label: "Services Completed", value: "100,000+" },
  { label: "Cities Covered", value: "50+" },
];

const values = [
  {
    title: "Community First",
    description: "We believe in empowering local communities by connecting skilled professionals with customers who need their services.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: "Trust & Safety",
    description: "Every service provider is verified, and our review system ensures transparency and accountability.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: "Quality Service",
    description: "We maintain high standards by featuring only the best service providers who deliver exceptional work.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    title: "Innovation",
    description: "We continuously improve our platform to make finding and booking services as easy as possible.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

const team = [
  { name: "Thabo Molefe", role: "Founder & CEO", image: "/team/ceo.jpg" },
  { name: "Nomvula Dlamini", role: "Chief Operations Officer", image: "/team/coo.jpg" },
  { name: "Sipho Nkosi", role: "Chief Technology Officer", image: "/team/cto.jpg" },
  { name: "Lerato Mokoena", role: "Head of Customer Success", image: "/team/cs.jpg" },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Connecting South Africa&apos;s
                <span className="text-primary"> Best Service Providers</span> With You
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Mzansi Market is South Africa&apos;s leading platform for discovering, booking,
                and reviewing local service providers. From home repairs to professional services,
                we make it easy to find the help you need.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/services">
                  <Button size="lg">Browse Services</Button>
                </Link>
                <Link href="/register?type=provider">
                  <Button size="lg" variant="outline">Become a Provider</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Our Story</h2>
              <div className="prose prose-lg text-muted-foreground">
                <p className="mb-4">
                  Mzansi Market was born from a simple observation: finding reliable service
                  providers in South Africa was unnecessarily difficult. Whether you needed a
                  plumber, a photographer, or a tutor, the process often involved endless phone
                  calls, unreliable referrals, and uncertainty about quality and pricing.
                </p>
                <p className="mb-4">
                  Founded in 2020, we set out to change this. Our mission is to create a trusted
                  marketplace where service providers can showcase their skills and customers can
                  easily find, compare, and book services with confidence.
                </p>
                <p>
                  Today, Mzansi Market connects thousands of service providers across South Africa
                  with customers who need their expertise. From Cape Town to Johannesburg, from
                  small towns to big cities, we&apos;re building a community where quality service
                  is just a click away.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 lg:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <Card key={value.title} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">Meet Our Team</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Our dedicated team works tirelessly to make Mzansi Market the best platform for
              service providers and customers alike.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <div key={member.name} className="text-center">
                  <div className="w-32 h-32 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
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
              Join thousands of South Africans who trust Mzansi Market for their service needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary">Create an Account</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                  Contact Us
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
