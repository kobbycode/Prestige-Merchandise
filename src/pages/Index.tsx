import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Truck, DollarSign, FileText, MessageCircle, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-mechanic.jpg";
import steeringPump from "@/assets/products/steering-pump.jpg";
import steeringRack from "@/assets/products/steering-rack.jpg";
import engineOil from "@/assets/products/engine-oil.jpg";
import suspension from "@/assets/products/suspension.jpg";

const Index = () => {
  const features = [
    {
      icon: Wrench,
      title: "Genuine Spare Parts",
      description: "100% authentic parts from trusted manufacturers"
    },
    {
      icon: Truck,
      title: "Fast Delivery Nationwide",
      description: "Quick delivery across Ghana via trusted couriers"
    },
    {
      icon: DollarSign,
      title: "Affordable Prices",
      description: "Competitive pricing without compromising quality"
    },
    {
      icon: FileText,
      title: "Invoice & Warranty Guaranteed",
      description: "Full documentation and warranty on all purchases"
    }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Toyota Corolla Power Steering Pump",
      price: "GHS 950",
      image: steeringPump
    },
    {
      id: 2,
      name: "Nissan Steering Rack",
      price: "GHS 1,200",
      image: steeringRack
    },
    {
      id: 3,
      name: "Castrol Engine Oil 4L",
      price: "GHS 350",
      image: engineOil
    },
    {
      id: 4,
      name: "Suspension Shock Absorber",
      price: "GHS 680",
      image: suspension
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] bg-secondary overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/70 to-transparent"></div>
          </div>

          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl text-secondary-foreground">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                Your Trusted Auto Parts Dealer at <span className="text-primary">Abossey Okai</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-secondary-foreground/90">
                Genuine Power Steering Pumps, Racks & Lubricants — Delivered Nationwide!
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop">
                  <Button size="lg" className="gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Shop Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="shadow-card hover:shadow-hover transition-shadow">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Featured Products</h2>
            <p className="text-center text-muted-foreground mb-12">Browse our most popular auto parts</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="shadow-card hover:shadow-hover transition-all overflow-hidden group">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-2xl font-bold text-primary mb-4">{product.price}</p>
                    <div className="space-y-2">
                      <Button className="w-full gap-2" size="sm">
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                      <a
                        href={`https://wa.me/233247654321?text=I'm interested in ${product.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button variant="outline" className="w-full gap-2" size="sm">
                          <MessageCircle className="h-4 w-4" />
                          Order on WhatsApp
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center">
              <Link to="/shop">
                <Button size="lg">View All Products</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="py-16 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Customers Say</h2>
            <Card className="max-w-3xl mx-auto shadow-card">
              <CardContent className="p-8 text-center">
                <div className="text-5xl text-primary mb-4">"</div>
                <p className="text-xl mb-6 italic">
                  I've been buying from Prestige for years. Always genuine and fast delivery!
                </p>
                <p className="font-semibold">— Yaw, Kumasi</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-hero-gradient text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl mb-8 opacity-90">Contact us today for the best auto parts deals in Ghana</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/shop">
                <Button size="lg" variant="secondary" className="min-w-[150px]">
                  Browse Shop
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="min-w-[150px]">
                  Get in Touch
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
