"use client";

import { useState } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Header, Footer } from "@/components/layout";
import { Card, CardContent, Button, Input, Textarea, Alert } from "@/components/ui";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

const contactInfo = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: "Email Us",
    details: "support@mzansimarket.co.za",
    subtext: "We'll respond within 24 hours",
  },
  {
    icon: <Phone className="w-6 h-6" />,
    title: "Call Us",
    details: "+27 11 123 4567",
    subtext: "Mon-Fri, 8am-6pm SAST",
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Visit Us",
    details: "123 Main Street, Sandton",
    subtext: "Johannesburg, South Africa",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Business Hours",
    details: "Monday - Friday",
    subtext: "8:00 AM - 6:00 PM SAST",
  },
];

const faqs = [
  {
    question: "How do I become a service provider?",
    answer: "Simply register an account and select 'Service Provider' as your account type. You can then set up your shop and start listing your services.",
  },
  {
    question: "How do I book a service?",
    answer: "Browse our services, select one that meets your needs, choose a date and time, and complete the booking. You'll receive a confirmation email with all the details.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, EFT payments, and mobile payment options like SnapScan and Zapper.",
  },
  {
    question: "How do I cancel a booking?",
    answer: "You can cancel a booking from your dashboard up to 24 hours before the scheduled appointment for a full refund.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to send message");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question or need help? We&apos;re here for you. Reach out to our team
              and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-12 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info) => (
                <Card key={info.title} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                      {info.icon}
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{info.title}</h3>
                    <p className="text-foreground">{info.details}</p>
                    <p className="text-sm text-muted-foreground">{info.subtext}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>

                {success && (
                  <Alert variant="success" className="mb-6">
                    Thank you for your message! We&apos;ll get back to you within 24 hours.
                  </Alert>
                )}

                {error && (
                  <Alert variant="error" className="mb-6">{error}</Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Your Name *
                      </label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Subject *
                      </label>
                      <Input
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <Textarea
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>

              {/* FAQ Section */}
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                        <p className="text-muted-foreground text-sm">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-secondary/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Still have questions?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Can&apos;t find the answer you&apos;re looking for? Check out our help center
                    or get in touch with our support team.
                  </p>
                  <Link href="/help">
                    <Button variant="outline">Visit Help Center</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-secondary/30">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Find Us</h2>
            <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  123 Main Street, Sandton<br />
                  Johannesburg, South Africa
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
