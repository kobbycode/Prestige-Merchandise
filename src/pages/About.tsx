import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Target, Award, Users, MessageCircle, Phone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-secondary text-secondary-foreground py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl opacity-90">Learn about our story and commitment to quality</p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="mb-12 text-center">
                <Building2 className="h-16 w-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              </div>

              <Card className="shadow-card mb-8">
                <CardContent className="p-8">
                  <p className="text-lg leading-relaxed mb-6">
                    Founded in <strong>2018</strong>, <strong className="text-primary">The Prestige Merchandise</strong> is a 
                    trusted name in Ghana's auto parts market. We are located at <strong>Abossey Okai, Accra</strong>, 
                    and specialize in steering systems and lubricants for all vehicle types.
                  </p>
                  
                  <p className="text-lg leading-relaxed">
                    Our mission is to provide <strong>genuine, affordable, and durable auto parts</strong> to 
                    every customer across Ghana. We understand the importance of quality parts for vehicle safety 
                    and performance, which is why we source directly from trusted manufacturers and offer comprehensive 
                    warranties on all our products.
                  </p>
                </CardContent>
              </Card>

              {/* Values Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <Card className="shadow-card hover:shadow-hover transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-2">Our Mission</h3>
                    <p className="text-sm text-muted-foreground">
                      To deliver genuine, affordable auto parts with exceptional service nationwide
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-hover transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Award className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-2">Quality First</h3>
                    <p className="text-sm text-muted-foreground">
                      Only authentic parts from trusted manufacturers with full warranties
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-hover transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="font-bold text-lg mb-2">Customer Trust</h3>
                    <p className="text-sm text-muted-foreground">
                      Building lasting relationships through reliability and transparency
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Why Choose Us */}
              <Card className="shadow-card bg-muted">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-center">Why Choose The Prestige Merchandise?</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-primary text-2xl">✓</span>
                      <div>
                        <strong>Authenticity Guaranteed:</strong> We source all parts directly from authorized distributors
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary text-2xl">✓</span>
                      <div>
                        <strong>Expert Consultation:</strong> Our knowledgeable team helps you choose the right parts for your vehicle
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary text-2xl">✓</span>
                      <div>
                        <strong>Fast Nationwide Delivery:</strong> Reach customers across Ghana through trusted courier services
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary text-2xl">✓</span>
                      <div>
                        <strong>Competitive Pricing:</strong> Quality parts at prices that make sense for your budget
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary text-2xl">✓</span>
                      <div>
                        <strong>After-Sales Support:</strong> Full invoicing, warranties, and installation assistance
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-hero-gradient text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience Quality Service?</h2>
            <p className="text-xl mb-8 opacity-90">Visit our shop in Abossey Okai or contact us today</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="https://wa.me/233247654321" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="gap-2 text-secondary-foreground border-secondary-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent">
                  <MessageCircle className="h-5 w-5" />
                  Contact on WhatsApp
                </Button>
              </a>
              <a href="tel:0541234567">
                <Button variant="outline" size="lg" className="gap-2 text-secondary-foreground border-secondary-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent">
                  <Phone className="h-5 w-5" />
                  Call Us Now
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

export default About;
