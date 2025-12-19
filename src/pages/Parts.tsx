import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings, Activity, Wrench, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Parts = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <SEOHead
                title="Quality Steering & Related Parts"
                description="Browse our extensive inventory of genuine steering components, suspension parts, and accessories for all vehicle types."
                url="/parts"
            />
            <Header />

            <main className="flex-1">
                {/* Page Header */}
                <section className="bg-secondary text-secondary-foreground py-16">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Quality Steering & Related Parts</h1>
                        <p className="text-xl opacity-90">We expand our inventory carefully to ensure every part matches our quality standards.</p>
                    </div>
                </section>

                {/* Parts Categories Section */}
                <section className="py-16 md:py-24 bg-white">
                    <div className="container mx-auto px-4 max-w-6xl">
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
            </main>

            <Footer />
        </div>
    );
};

export default Parts;
