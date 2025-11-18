import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Truck, Package, Wrench, MessageCircle, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Services = () => {
  const services = [
    {
      icon: MessageSquare,
      title: "Free Consultation",
      description: "Not sure which part you need? Our expert team provides free consultation to help you choose the right part for your car. We'll guide you through compatibility, pricing, and installation requirements.",
      features: [
        "Expert product recommendations",
        "Compatibility verification",
        "Price comparisons",
        "Installation guidance"
      ]
    },
    {
      icon: Truck,
      title: "Delivery within Accra (2 hours)",
      description: "Need your parts fast? We offer express delivery within Accra and surrounding areas. Get your parts delivered to your doorstep or preferred mechanic within 2 hours of ordering.",
      features: [
        "Same-day delivery in Accra",
        "Direct delivery to mechanics",
        "Real-time order tracking",
        "Secure packaging"
      ]
    },
    {
      icon: Package,
      title: "Nationwide Shipping",
      description: "We deliver across Ghana through trusted courier services including VIP Transport, Maxline, and STC. Your parts arrive safely and quickly, no matter where you are in the country.",
      features: [
        "VIP Transport parcel service",
        "Maxline courier delivery",
        "STC bus courier",
        "Safe and secure packaging"
      ]
    },
    {
      icon: Wrench,
      title: "Installation Support",
      description: "We work with trusted mechanics across Accra who can install your parts professionally. Get recommendations for reliable installation services and technical support when needed.",
      features: [
        "Trusted mechanic referrals",
        "Installation guidelines included",
        "Technical support hotline",
        "Warranty-backed installations"
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-secondary text-secondary-foreground py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
            <p className="text-xl opacity-90">More than just selling parts — we add value to your experience</p>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">What We Offer</h2>
                <p className="text-lg text-muted-foreground">
                  Beyond quality parts, we provide comprehensive services to ensure you have the best experience
                </p>
              </div>

              <div className="space-y-8">
                {services.map((service, index) => {
                  const Icon = service.icon;
                  return (
                    <Card key={index} className="shadow-card hover:shadow-hover transition-shadow">
                      <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon className="h-8 w-8 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                            <p className="text-muted-foreground mb-4 leading-relaxed">
                              {service.description}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {service.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-primary">✓</span>
                                  <span className="text-sm">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Benefits */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">Additional Benefits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3">📋 Invoice & Warranty</h3>
                    <p className="text-sm text-muted-foreground">
                      Every purchase comes with a proper invoice and warranty documentation for your peace of mind.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3">💬 24/7 WhatsApp Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Reach us anytime through WhatsApp for quick responses to your questions and orders.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3">🔄 Easy Returns</h3>
                    <p className="text-sm text-muted-foreground">
                      Wrong part ordered? We accept returns within 7 days for unused, unopened items.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3">💰 Flexible Payment</h3>
                    <p className="text-sm text-muted-foreground">
                      We accept cash, Mobile Money, bank transfers, and card payments for your convenience.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-hero-gradient text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Need Our Services?</h2>
            <p className="text-xl mb-8 opacity-90">Contact us today to learn more about how we can help</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="https://wa.me/233247654321" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Us
                </Button>
              </a>
              <a href="tel:0541234567">
                <Button variant="outline" size="lg" className="gap-2">
                  <Phone className="h-5 w-5" />
                  Call Now
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
