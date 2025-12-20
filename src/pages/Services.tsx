import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings, Activity, Wrench, MessageCircle, Phone, Search, Droplets, Move, Cog } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import StoreMap from "@/components/StoreMap";

const Services = () => {
  const { settings } = useStoreSettings();
  const services = [
    {
      icon: Search,
      title: "Steering Diagnostics",
      description: "Comprehensive inspection to identify and solve steering issues. We don't just guess; we pinpoint the exact cause of your steering trouble.",
      symptoms: [
        "Unusual noises when turning (whining, clunking)",
        "Stiff or heavy steering wheel",
        "Fluid leaks visible under the vehicle",
        "Vibration or shaking in the steering wheel"
      ],
      solution: "We use advanced diagnostic methodology to systematically check fluid levels, belt tension, pump pressure, and rack integrity. We provide you with a clear, honest report and a precise repair plan."
    },
    {
      icon: Cog,
      title: "Power Steering Pump Repair",
      description: "Expert repair and replacement of power steering pumps. The pump is the heart of your hydraulic steering system; we ensure it beats strong.",
      symptoms: [
        "Loud whining noise that changes with engine RPM",
        "Steering feels heavy, especially at low speeds",
        "Foamy or bubbling power steering fluid",
        "Intermittent loss of power assist"
      ],
      solution: "We can rebuild your existing pump with high-quality seals and bearings to factory specs, or replace it with a genuine OEM part. We flush the system to ensure the new pump lasts."
    },
    {
      icon: Settings,
      title: "Steering Rack Reconditioning",
      description: "Professional reconditioning and full rack replacement. We restore precision to your vehicle's handling.",
      symptoms: [
        "Dead zone or 'play' in the steering center",
        "Clunking sensation when going over bumps",
        "Red/pink fluid leaking from steering boots",
        "Car wanders on the road (instability)"
      ],
      solution: "Our specialists completely disassemble, clean, and rebuild steering racks. We replace worn seals, O-rings, and bushings, then pressure test every unit to ensure leak-free performance."
    },
    {
      icon: Activity,
      title: "EPS (Electric Power Steering) Repair",
      description: "Diagnosis and repair of modern electric power steering systems found in newer vehicles.",
      symptoms: [
        "EPS warning light illuminated on dashboard",
        "Complete and sudden loss of power assist",
        "Steering wheel feels 'notchy' or pulls to one side",
        "Clicking noise from the steering column"
      ],
      solution: "We diagnose electronic control unit (ECU) faults, motor issues, and torque sensor failures. We repair or calibrate the electric column and rack assembly for safe operation."
    },
    {
      icon: Droplets,
      title: "Steering Leak & Noise Fix",
      description: "Fixing annoying fluid leaks and resolving squealing or groaning steering noise issues once and for all.",
      symptoms: [
        "Red or brown puddles on your driveway",
        "Squealing belt noise when starting the car",
        "Groaning sound when turning the wheel fully",
        "Frequent need to top up steering fluid"
      ],
      solution: "We trace the leak to source—whether it's a high-pressure hose, a seal, or a reservoir crack. We replace the faulty component and use premium fluid to stop noise and wear."
    },
    {
      icon: Move,
      title: "Wheel Alignment & Adjustment",
      description: "Precision alignment for optimal steering performance and tire longevity. Bad alignment ruins good steering parts.",
      symptoms: [
        "Vehicle pulls to left or right on straight roads",
        "Steering wheel is crooked when driving straight",
        "Uneven or rapid tire wear",
        "Steering doesn't self-center after a turn"
      ],
      solution: "We perform computerized wheel alignment to ensure your steering geometry (toe, camber, caster) is perfect. This reduces strain on your steering rack and makes driving effortless."
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
            <div className="max-w-6xl mx-auto space-y-20">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <div key={index} className="flex flex-col md:flex-row gap-8 items-start border-b border-border pb-16 last:border-0 last:pb-0">
                    {/* Icon & Title Mobile */}
                    <div className="md:hidden flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-none bg-secondary flex items-center justify-center shrink-0">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold">{service.title}</h3>
                    </div>

                    {/* Icon Desktop */}
                    <div className="hidden md:flex w-24 h-24 rounded-none bg-secondary items-center justify-center shrink-0">
                      <Icon className="h-12 w-12 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-6">
                      <h3 className="hidden md:block text-3xl font-bold">{service.title}</h3>

                      {/* Problem Description */}
                      <div>
                        <h4 className="text-lg font-semibold text-primary mb-2">Problem</h4>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Symptoms */}
                        <div className="bg-muted/30 p-6 rounded-none border border-border">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <span className="text-red-500">⚠</span> Common Symptoms
                          </h4>
                          <ul className="space-y-2">
                            {service.symptoms.map((symptom, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                                {symptom}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Solution */}
                        <div className="bg-primary/5 p-6 rounded-none border border-primary/10">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <span className="text-green-600">✓</span> Our Solution
                          </h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {service.solution}
                          </p>
                          <a href={`https://wa.me/${settings.whatsappNumber}?text=Hi, I need help with ${service.title}`} target="_blank" rel="noopener noreferrer">
                            <Button className="w-full rounded-none" size="lg">
                              Book This Service
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Find Us</h2>
              <p className="text-muted-foreground">Visit our workshops at these locations</p>
            </div>
            <div className="max-w-5xl mx-auto shadow-lg">
              <StoreMap locations={settings.locations || [settings.location || "Abossey Okai"]} />
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
              <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="gap-2">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Us
                </Button>
              </a>
              <a href={`tel:${settings.phone?.replace(/\s/g, '')}`}>
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
    </div >
  );
};

export default Services;
