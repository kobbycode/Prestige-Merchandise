import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck, Clock, ShieldCheck, Wrench, Phone, MessageCircle, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const FleetSolutions = () => {
    const { settings } = useStoreSettings();
    const benefits = [
        {
            icon: Clock,
            title: "Minimize Downtime",
            description: "Fast turnaround on repairs and parts delivery to keep your fleet moving."
        },
        {
            icon: ShieldCheck,
            title: "Bulk Pricing",
            description: "Special rates for fleet operators and commercial vehicle owners."
        },
        {
            icon: Wrench,
            title: "Priority Service",
            description: "Dedicated support line and priority scheduling for fleet customers."
        },
        {
            icon: Truck,
            title: "All Vehicle Types",
            description: "From light commercial to heavy duty trucks, we handle them all."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <SEOHead
                title="Fleet Solutions: Commercial Vehicle Steering Services"
                description="Specialized steering repair and parts solutions for commercial fleets, delivery vehicles, and transport companies in Ghana."
                url="/fleet-solutions"
            />
            <Header />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="bg-secondary text-white py-20">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto text-center">
                            <h1 className="text-4xl md:text-6xl font-bold mb-6">Fleet Solutions</h1>
                            <p className="text-xl md:text-2xl text-gray-200 mb-8">
                                Keep Your Commercial Vehicles Running Smoothly
                            </p>
                            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                                We understand that every hour your vehicle is off the road costs you money. Our fleet solutions are designed to minimize downtime and maximize your operational efficiency.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Why Choose Us for Your Fleet</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Trusted by delivery companies, transport operators, and commercial vehicle owners across Ghana.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="border-none shadow-card hover:shadow-hover transition-shadow">
                                    <CardContent className="p-6 text-center">
                                        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary">
                                            <benefit.icon className="h-7 w-7" />
                                        </div>
                                        <h3 className="text-lg font-bold text-secondary mb-2">{benefit.title}</h3>
                                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Services for Fleets */}
                <section className="py-16 md:py-24 bg-muted/30">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-12 text-center">What We Offer Fleet Operators</h2>

                        <div className="space-y-6">
                            {[
                                {
                                    title: "Preventive Maintenance Programs",
                                    description: "Regular inspection schedules to catch steering issues before they become expensive breakdowns."
                                },
                                {
                                    title: "Emergency Repair Services",
                                    description: "Priority response for urgent steering failures to get your vehicles back on the road fast."
                                },
                                {
                                    title: "Bulk Parts Supply",
                                    description: "Stock commonly needed steering parts for your fleet at discounted rates."
                                },
                                {
                                    title: "On-Site Diagnosis (Accra)",
                                    description: "We can come to your depot to diagnose steering problems and provide quotes."
                                },
                                {
                                    title: "Fleet Account Management",
                                    description: "Dedicated account manager to handle all your fleet's steering needs."
                                },
                                {
                                    title: "Detailed Service Reports",
                                    description: "Comprehensive documentation for each vehicle serviced, perfect for fleet records."
                                }
                            ].map((service, i) => (
                                <div key={i} className="flex items-start gap-4 bg-white p-6 rounded-xl border border-border">
                                    <CheckCircle2 className="h-6 w-6 text-primary shrink-0 mt-1" />
                                    <div>
                                        <h3 className="text-xl font-bold text-secondary mb-2">{service.title}</h3>
                                        <p className="text-muted-foreground">{service.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-hero-gradient text-white">
                    <div className="container mx-auto px-4 text-center max-w-4xl">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Partner With Us?</h2>
                        <p className="text-xl text-blue-50 mb-10">
                            Let's discuss how we can keep your fleet running efficiently. Contact us for a customized fleet solution.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href={`tel:${settings.phone?.replace(/\s/g, '')}`}>
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-lg font-bold gap-2 rounded-none">
                                    <Phone className="h-5 w-5" /> Call Now
                                </Button>
                            </a>
                            <a href={`https://wa.me/${settings.whatsappNumber}?text=Hi, I'm interested in fleet solutions`} target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-[#25D366] hover:bg-[#128C7E] text-white border-none gap-2 rounded-none">
                                    <MessageCircle className="h-5 w-5" /> WhatsApp Us
                                </Button>
                            </a>
                            <Link to="/contact">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold border-white/40 bg-transparent text-white hover:bg-white hover:text-secondary gap-2 rounded-none">
                                    Request Quote
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

export default FleetSolutions;
