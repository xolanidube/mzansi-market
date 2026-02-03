import { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { MapPin, Clock, Briefcase, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | Mzansi Market",
  description: "Join our team and help build the future of service marketplace in South Africa.",
};

const benefits = [
  {
    title: "Competitive Salary",
    description: "We offer market-competitive compensation packages",
    icon: "💰",
  },
  {
    title: "Remote Friendly",
    description: "Work from anywhere in South Africa",
    icon: "🏠",
  },
  {
    title: "Health Benefits",
    description: "Comprehensive medical aid coverage",
    icon: "🏥",
  },
  {
    title: "Learning Budget",
    description: "Annual allowance for courses and conferences",
    icon: "📚",
  },
  {
    title: "Flexible Hours",
    description: "Work when you're most productive",
    icon: "⏰",
  },
  {
    title: "Team Events",
    description: "Regular team building and social events",
    icon: "🎉",
  },
];

const openPositions = [
  {
    id: 1,
    title: "Senior Full Stack Developer",
    department: "Engineering",
    location: "Johannesburg / Remote",
    type: "Full-time",
    description: "We're looking for an experienced full stack developer to help build and scale our platform.",
  },
  {
    id: 2,
    title: "Product Designer",
    department: "Design",
    location: "Cape Town / Remote",
    type: "Full-time",
    description: "Join our design team to create beautiful, intuitive experiences for our users.",
  },
  {
    id: 3,
    title: "Customer Success Manager",
    department: "Operations",
    location: "Johannesburg",
    type: "Full-time",
    description: "Help our service providers and customers get the most out of Mzansi Market.",
  },
  {
    id: 4,
    title: "Marketing Specialist",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description: "Drive growth through creative marketing campaigns and strategies.",
  },
  {
    id: 5,
    title: "Data Analyst",
    department: "Analytics",
    location: "Johannesburg / Remote",
    type: "Full-time",
    description: "Turn data into insights that drive product and business decisions.",
  },
];

const values = [
  {
    title: "Customer Obsessed",
    description: "Everything we do starts with understanding our users' needs.",
  },
  {
    title: "Move Fast",
    description: "We ship quickly, learn from feedback, and iterate constantly.",
  },
  {
    title: "Own It",
    description: "We take ownership of our work and see things through.",
  },
  {
    title: "Stay Humble",
    description: "We're always learning, always improving, always growing.",
  },
];

export default function CareersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Join Our Team
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Help us build the future of service marketplace in South Africa.
              We&apos;re looking for talented people who are passionate about making a difference.
            </p>
            <Button size="lg" asChild>
              <a href="#positions">View Open Positions</a>
            </Button>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">Our Values</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              These principles guide how we work and who we hire
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">Why Work With Us?</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              We believe happy teams build great products
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit) => (
                <Card key={benefit.title} className="bg-background">
                  <CardContent className="p-6">
                    <span className="text-4xl mb-4 block">{benefit.icon}</span>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section id="positions" className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-4 text-center">Open Positions</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Find your perfect role and join our growing team
            </p>

            {openPositions.length === 0 ? (
              <Card className="max-w-xl mx-auto">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No open positions at the moment, but we&apos;re always looking for talented people.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="mailto:careers@mzansimarket.co.za">Send Us Your CV</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto">
                {openPositions.map((position) => (
                  <Card key={position.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {position.title}
                            </h3>
                            <Badge variant="secondary">{position.department}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm mb-3">
                            {position.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {position.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {position.type}
                            </span>
                          </div>
                        </div>
                        <Button asChild>
                          <a href={`mailto:careers@mzansimarket.co.za?subject=Application: ${position.title}`}>
                            Apply
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Application Process */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Our Hiring Process</h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { step: 1, title: "Apply", description: "Submit your application with CV and cover letter" },
                { step: 2, title: "Screening", description: "We'll review your application within a week" },
                { step: 3, title: "Interviews", description: "Meet the team through 2-3 interview rounds" },
                { step: 4, title: "Offer", description: "Receive an offer and join our team!" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Don&apos;t see a role that fits?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              We&apos;re always interested in meeting talented people. Send us your CV and
              we&apos;ll reach out when we have a suitable opportunity.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:careers@mzansimarket.co.za">Send Your CV</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
