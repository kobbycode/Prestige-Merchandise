import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Link, useNavigate } from "react-router-dom";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Truck, DollarSign, FileText, MessageCircle, ShoppingCart, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecentlyViewed from "@/components/product/RecentlyViewed";
import SEOHead from "@/components/SEOHead";
import heroImage from "@/assets/hero-mechanic.jpg";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";

const Index = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const q = query(
          collection(db, "products"),
          where("featured", "==", true),
          where("status", "==", "active"),
          limit(4)
        );
        const querySnapshot = await getDocs(q);
        const products: Product[] = [];
        querySnapshot.forEach((doc) => {
          products.push({ id: doc.id, ...doc.data() } as Product);
        });
        setFeaturedProducts(products);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

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

  return (
    <div className="flex flex-col min-h-screen">
      <SEOHead
        url="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AutoPartsStore",
          "name": "The Prestige Merchandise",
          "description": "Your trusted auto parts dealer in Abossey Okai. Genuine power steering pumps, steering racks, lubricants & more.",
          "url": typeof window !== 'undefined' ? window.location.origin : '',
          "telephone": "+233-24-765-4321",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Abossey Okai",
            "addressLocality": "Accra",
            "addressRegion": "Greater Accra",
            "addressCountry": "GH"
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": "5.614818",
            "longitude": "-0.186964"
          },
          "priceRange": "₵₵",
          "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            "opens": "08:00",
            "closes": "18:00"
          }
        }}
      />
      <Header />

      <main className="animate-fade-in">
        {/* Hero Section */}
        <section className="relative h-[450px] md:h-[600px] bg-secondary overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/70 to-transparent"></div>
          </div>

          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl text-secondary-foreground pt-8 md:pt-0 stagger-animation">
              <h1 className="text-3xl md:text-6xl font-bold mb-4 leading-tight animate-fade-in-up">
                Your Trusted Auto Parts Dealer at <span className="text-primary">Abossey Okai</span>
              </h1>
              <p className="text-lg md:text-2xl mb-6 md:mb-8 text-secondary-foreground/90 animate-fade-in-up [animation-delay:150ms]">
                Genuine Power Steering Pumps, Racks & Lubricants — Delivered Nationwide!
              </p>
              <div className="flex flex-wrap gap-4 animate-fade-in-up [animation-delay:300ms]">
                <Link to="/shop">
                  <Button size="lg" className="gap-2 w-full sm:w-auto text-base rounded-full px-8 shadow-lg shadow-primary/20">
                    <ShoppingCart className="h-5 w-5" />
                    Shop Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto text-base rounded-full px-8 border-white/60 text-white hover:bg-white hover:text-secondary bg-transparent transition-all">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-10 md:py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12 animate-slide-up">Why Choose Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-animation">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="shadow-card hover:shadow-hover transition-all animate-fade-in-up border-none bg-background/50 backdrop-blur-sm"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="h-8 w-8 text-primary" strokeWidth={1.5} />
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
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-3">Featured Products</h2>
            <p className="text-center text-muted-foreground mb-8 md:mb-12">Browse our most popular auto parts</p>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8 stagger-animation">
                {featuredProducts.map((product, index) => (
                  <Card
                    key={product.id}
                    className="shadow-card hover:shadow-hover transition-all overflow-hidden group cursor-pointer animate-fade-in-up border-none"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="aspect-square overflow-hidden bg-[#F8F9FA] relative">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-contain p-2 md:p-4 group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-10 w-10 md:h-16 md:w-16 text-muted-foreground" />
                        </div>
                      )}
                      {product.stock <= 5 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full">
                          Low Stock
                        </span>
                      )}
                    </div>
                    <CardContent className="p-3 md:p-4">
                      <h3 className="font-semibold mb-1 md:mb-2 line-clamp-2 text-sm md:text-base min-h-[2.5rem] md:min-h-[3rem]">{product.name}</h3>
                      <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 mb-3 md:mb-4">
                        <p className="text-base md:text-2xl font-bold text-primary">{formatPrice(product.price)}</p>
                        {product.compareAtPrice && (
                          <p className="text-xs md:text-sm text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</p>
                        )}
                      </div>
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          className="w-full gap-2 text-xs md:text-sm h-8 md:h-10"
                          size="sm"
                          onClick={() => addToCart(product, 1)}
                        >
                          <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
                          Add to Cart
                        </Button>
                        <a
                          href={`https://wa.me/233247654321?text=I'm interested in ${product.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button variant="outline" className="w-full gap-2 text-xs md:text-sm h-8 md:h-10" size="sm">
                            <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
                            Order on WhatsApp
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-lg">
                <p className="text-muted-foreground">No featured products available at the moment.</p>
              </div>
            )}

            <div className="text-center">
              <Link to="/shop">
                <Button size="lg" className="w-full sm:w-auto">View All Products</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Recently Viewed Products */}
        <RecentlyViewed />

        {/* Testimonial Section */}
        <section className="py-10 md:py-16 bg-secondary text-secondary-foreground">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-4xl font-bold text-center mb-8 md:mb-12">What Our Customers Say</h2>
            <Card className="max-w-3xl mx-auto shadow-card">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="text-4xl md:text-5xl text-primary mb-2 md:mb-4">"</div>
                <p className="text-lg md:text-xl mb-4 md:mb-6 italic">
                  I've been buying from Prestige for years. Always genuine and fast delivery!
                </p>
                <p className="font-semibold">— Yaw, Kumasi</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 md:py-16 bg-hero-gradient text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Ready to Get Started?</h2>
            <p className="text-lg md:text-xl mb-6 md:mb-8 opacity-90">Contact us today for the best auto parts deals in Ghana</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button size="lg" variant="secondary" className="w-full sm:w-[150px]">
                  Browse Shop
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="secondary" className="w-full sm:w-[150px]">
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
