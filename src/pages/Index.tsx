import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wrench,
  ShieldCheck,
  Truck,
  Activity,
  Settings,
  Phone,
  MessageCircle,
  Calendar,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import heroImage from "@/assets/hero-mechanic.jpg";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Index = () => {
  const { settings } = useStoreSettings();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const coreServices = [
    {
      title: "Power Steering Systems",
      description: "Complete repair and replacement of power steering pumps, reservoirs, and hoses.",
      icon: Activity,
      link: "/services"
    },
    {
      title: "Steering Racks",
      description: "Expert servicing for hydraulic and electric steering racks to restore precision control.",
      icon: Settings,
      link: "/services"
    },
    {
      title: "Advanced Diagnosis",
      description: "Pinpoint accuracy for hard steering, noise, leaks, and vibration issues.",
      icon: Wrench,
      link: "/contact"
    }
  ];

  const partCategories = [
    { name: "Steering Racks", link: "/shop?category=steering_racks" },
    { name: "Power Steering Pumps", link: "/shop?category=power_steering_pumps" },
    { name: "Steering Columns", link: "/shop?category=steering_columns" },
    { name: "EPS Systems", link: "/shop?category=eps_systems" },
    { name: "Ball Joints", link: "/shop?category=suspension" },
    { name: "Control Arms", link: "/shop?category=suspension" },
    { name: "Power Steering Fluids", link: "/shop?category=fluids" },
    { name: "Belts & Hoses", link: "/shop?category=belts" },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <SEOHead
        url="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AutoRepair",
          "name": "Prestige Steering Specialists",
          "description": "The trusted specialists for power steering repairs, rack replacement, and genuine steering parts in Accra.",
          "telephone": settings.phone || "+233-20-366-3708",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Abossey Okai",
            "addressLocality": "Accra",
            "addressRegion": "Greater Accra",
            "addressCountry": "GH"
          },
          "priceRange": "₵₵"
        }}
      />
      <Header />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative h-[550px] md:h-[650px] overflow-hidden flex items-center">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroImage}
              alt="Mechanic working on steering"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40"></div>
          </div>

          <div className="container relative z-10 mx-auto px-4 pt-10">
            <div className="max-w-3xl text-white space-y-6 animate-in slide-in-from-left duration-700">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/20 border border-primary text-primary font-bold text-sm uppercase tracking-wider backdrop-blur-sm">
                The Steering Authority
              </span>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
                Steering Problems? <br className="hidden md:block" />
                <span className="text-primary">We Are The Specialists.</span>
              </h1>
              <p className="text-lg md:text-2xl text-gray-200 max-w-2xl leading-relaxed">
                Don't gamble with your safety. We provide expert diagnosis, repair, and genuine parts for all steering systems.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/contact">
                  <Button size="lg" className="w-full sm:w-auto h-12 text-base px-8 rounded-full shadow-lg shadow-primary/25 hover:scale-105 transition-transform">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Diagnosis
                  </Button>
                </Link>
                <a href="https://wa.me/233203663708" target="_blank" rel="noopener noreferrer">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 text-base px-8 rounded-full border-white/30 bg-transparent text-white hover:bg-white hover:text-secondary backdrop-blur-sm hover:scale-105 transition-transform">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Talk to an Expert
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST SIGNALS STRIP */}
        <section className="bg-white py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Wrench, title: "Steering Specialists", sub: "Core Focus" },
                { icon: Activity, title: "Sales & Repair", sub: "One-Stop Shop" },
                { icon: Truck, title: "Fleets & Private", sub: "All Vehicles" },
                { icon: ShieldCheck, title: "Trusted Source", sub: "Genuine Parts" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 justify-center md:justify-start">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-sm md:text-base">{item.title}</h3>
                    <p className="text-muted-foreground text-xs md:text-sm">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CORE SERVICES */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Our Core Services</h2>
              <p className="text-muted-foreground">
                We don't just sell parts; we understand how they work. Get expert solutions for your vehicle.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {coreServices.map((service, index) => (
                <Card key={index} className="border-none shadow-card hover:shadow-hover transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-8">
                    <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                      <service.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-3">{service.title}</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {service.description}
                    </p>
                    <Link to={service.link} className="inline-flex items-center text-primary font-semibold hover:gap-2 transition-all">
                      Learn More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/services">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  View All Services
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* AUTHORITY / WHY US SECTION */}
        <section className="py-16 md:py-24 bg-secondary text-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="w-full lg:w-1/2 relative">
                {/* Decorative Elements */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>

                <div className="relative rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl">
                  {/* Placeholder for workshop image if heroImage is reused or another one exists */}
                  <img src={heroImage} alt="Workshop Interior" className="w-full h-auto grayscale hover:grayscale-0 transition-all duration-700" />
                </div>
              </div>

              <div className="w-full lg:w-1/2 space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Drivers Trust Us</h2>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    Your safety on the road depends on your steering. We bring specialized expertise that general mechanics simply can't match.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    "Steering is our core specialty, not a sideline.",
                    "Accurate diagnosis using advanced tools, not guesswork.",
                    "We stock high-quality genuine parts.",
                    "Suitable for private cars, commercial fleets, and trucks."
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                      <span className="text-gray-200 text-lg">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PARTS CATEGORIES SECTION */}
        <section className="py-16 md:py-24 bg-white" id="parts">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-secondary mb-4">Quality Steering & Related Parts</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We expand our inventory carefully to ensure every part matches our quality standards.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Steering Components */}
              <div className="bg-muted/30 rounded-2xl p-8 border border-border hover:border-primary/20 transition-all duration-300">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <Settings className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-secondary mb-6">Steering Components</h3>
                <ul className="space-y-4">
                  {[
                    { name: "Steering Racks", link: "/shop?category=steering_racks" },
                    { name: "Power Steering Pumps", link: "/shop?category=power_steering_pumps" },
                    { name: "Columns, Rack Ends, Tie Rods", link: "/shop?category=steering_components" }
                  ].map((item, i) => (
                    <li key={i}>
                      <Link to={item.link} className="flex items-center group text-muted-foreground hover:text-primary transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary mr-3 transition-colors" />
                        <span className="text-lg">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suspension & Support */}
              <div className="bg-muted/30 rounded-2xl p-8 border border-border hover:border-primary/20 transition-all duration-300">
                <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-600">
                  <Activity className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-secondary mb-6">Suspension & Support</h3>
                <ul className="space-y-4">
                  {[
                    { name: "Ball Joints", link: "/shop?category=suspension" },
                    { name: "Control Arms", link: "/shop?category=suspension" },
                    { name: "Bushings", link: "/shop?category=suspension" }
                  ].map((item, i) => (
                    <li key={i}>
                      <Link to={item.link} className="flex items-center group text-muted-foreground hover:text-blue-600 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40 group-hover:bg-blue-600 mr-3 transition-colors" />
                        <span className="text-lg">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fluids & Accessories */}
              <div className="bg-muted/30 rounded-2xl p-8 border border-border hover:border-primary/20 transition-all duration-300">
                <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 text-green-600">
                  <Wrench className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-secondary mb-6">Fluids & Accessories</h3>
                <ul className="space-y-4">
                  {[
                    { name: "Power Steering Fluids", link: "/shop?category=fluids" },
                    { name: "Belts & Hoses", link: "/shop?category=parts" }
                  ].map((item, i) => (
                    <li key={i}>
                      <Link to={item.link} className="flex items-center group text-muted-foreground hover:text-green-600 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400/40 group-hover:bg-green-600 mr-3 transition-colors" />
                        <span className="text-lg">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link to="/shop">
                <Button size="lg" className="h-16 px-10 text-lg gap-3 shadow-lg hover:scale-105 transition-transform">
                  Browse Parts / Enquire on WhatsApp <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="py-20 bg-hero-gradient text-white text-center">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Your Steering Controls Your Safety.
              <br />
              <span className="text-white/80">Don't Ignore The Signs.</span>
            </h2>
            <p className="text-xl text-blue-50 mb-10 max-w-2xl mx-auto">
              If you hear noise, feel stiff steering, or see leaks, it's time to see the specialists.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="tel:+233203663708" className="w-full sm:w-auto">
                <Button size="lg" variant="secondary" className="w-full h-14 px-8 text-lg font-bold gap-2">
                  <Phone className="h-5 w-5" /> Call Now
                </Button>
              </a>
              <a href="https://wa.me/233203663708" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 text-lg font-bold bg-[#25D366] hover:bg-[#128C7E] text-white border-none gap-2">
                  <MessageCircle className="h-5 w-5" /> WhatsApp Us
                </Button>
              </a>
              <Link to="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-14 px-8 text-lg font-bold border-white/40 bg-transparent text-white hover:bg-white hover:text-secondary gap-2">
                  <Calendar className="h-5 w-5" /> Book Diagnosis
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
