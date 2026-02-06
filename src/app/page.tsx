import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Button, Card, CardContent } from "@/components/ui";
import { FeaturedShops, StatsSection } from "@/components/home";

const categories = [
  { name: "Photography", icon: "📷", count: 120 },
  { name: "Web Development", icon: "💻", count: 85 },
  { name: "Plumbing", icon: "🔧", count: 64 },
  { name: "Electrical", icon: "⚡", count: 52 },
  { name: "Cooking", icon: "🍳", count: 78 },
  { name: "Tutoring", icon: "📚", count: 93 },
  { name: "Cleaning", icon: "🧹", count: 156 },
  { name: "Moving", icon: "📦", count: 41 },
];

const features = [
  {
    title: "Find Services",
    description: "Browse thousands of skilled service providers in your area",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    title: "Book Appointments",
    description: "Schedule services at your convenience with easy online booking",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Post Jobs",
    description: "Need something done? Post a job and get proposals from experts",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: "Grow Your Business",
    description: "Join as a service provider and reach thousands of customers",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                Find the Right{" "}
                <span className="text-primary">Service Provider</span> for Any Task
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect with skilled professionals in your area. From home repairs to
                digital services, Mzansi Market has you covered.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/services">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Services
                  </Button>
                </Link>
                <Link href="/register?type=provider">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Become a Provider
                  </Button>
                </Link>
              </div>

              {/* Search Bar */}
              <div className="mt-12 max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-2 p-2 bg-background rounded-xl shadow-lg border border-border">
                  <div className="flex-1 relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="What service are you looking for?"
                      className="w-full pl-10 pr-4 py-3 bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button size="lg">Search</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Popular Categories
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Browse services by category and find exactly what you need
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/services?category=${category.name.toLowerCase()}`}
                >
                  <Card
                    variant="outlined"
                    className="hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  >
                    <CardContent className="p-6 text-center">
                      <span className="text-4xl mb-3 block">{category.icon}</span>
                      <h3 className="font-semibold text-foreground mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.count} providers
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/services">
                <Button variant="outline">View All Categories</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Shops Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Featured Shops
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Discover top-rated service providers trusted by our community
              </p>
            </div>
            <FeaturedShops />
            <div className="text-center mt-8">
              <Link href="/shops">
                <Button variant="outline">View All Shops</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                How Mzansi Market Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you need a service or want to offer one, we make it simple
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={feature.title} className="text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already finding and offering
                services on Mzansi Market. Sign up today and start connecting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Create an Account
                  </Button>
                </Link>
                <Link href="/jobs/create">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    Post a Job
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <StatsSection />
      </main>

      <Footer />
    </div>
  );
}
