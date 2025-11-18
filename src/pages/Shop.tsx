import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, ShoppingCart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import steeringPump from "@/assets/products/steering-pump.jpg";
import steeringRack from "@/assets/products/steering-rack.jpg";
import engineOil from "@/assets/products/engine-oil.jpg";
import suspension from "@/assets/products/suspension.jpg";

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");

  const categories = [
    { id: "all", name: "All Products" },
    { id: "pumps", name: "Power Steering Pumps" },
    { id: "racks", name: "Steering Racks" },
    { id: "lubricants", name: "Lubricants & Fluids" },
    { id: "suspension", name: "Suspension Parts" },
    { id: "electrical", name: "Electricals & Accessories" }
  ];

  const brands = [
    { id: "all", name: "All Brands" },
    { id: "toyota", name: "Toyota" },
    { id: "nissan", name: "Nissan" },
    { id: "hyundai", name: "Hyundai" },
    { id: "kia", name: "Kia" },
    { id: "honda", name: "Honda" },
    { id: "mazda", name: "Mazda" }
  ];

  const products = [
    {
      id: 1,
      name: "Toyota Corolla Power Steering Pump",
      category: "pumps",
      brand: "toyota",
      price: "GHS 950",
      image: steeringPump,
      specs: "Compatible with 2010-2018 models"
    },
    {
      id: 2,
      name: "Nissan Steering Rack",
      category: "racks",
      brand: "nissan",
      price: "GHS 1,200",
      image: steeringRack,
      specs: "OEM quality, 12-month warranty"
    },
    {
      id: 3,
      name: "Castrol Engine Oil 4L",
      category: "lubricants",
      brand: "all",
      price: "GHS 350",
      image: engineOil,
      specs: "10W-40 Semi-Synthetic"
    },
    {
      id: 4,
      name: "Universal Suspension Shock Absorber",
      category: "suspension",
      brand: "all",
      price: "GHS 680",
      image: suspension,
      specs: "Fits most sedan models"
    },
    {
      id: 5,
      name: "Honda Civic Power Steering Pump",
      category: "pumps",
      brand: "honda",
      price: "GHS 890",
      image: steeringPump,
      specs: "2012-2020 compatible"
    },
    {
      id: 6,
      name: "Hyundai Elantra Steering Rack",
      category: "racks",
      brand: "hyundai",
      price: "GHS 1,150",
      image: steeringRack,
      specs: "Genuine OEM part"
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-secondary text-secondary-foreground py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Shop Auto Parts</h1>
            <p className="text-xl opacity-90">Browse our complete catalog of genuine spare parts</p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for parts (e.g., steering pump, oil filter...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <aside className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">Filter By</h3>
                  
                  {/* Category Filter */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">CATEGORY</h4>
                    <div className="space-y-2">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                            selectedCategory === category.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Filter */}
                  <div>
                    <h4 className="font-semibold mb-3 text-sm text-muted-foreground">CAR BRAND</h4>
                    <div className="space-y-2">
                      {brands.map(brand => (
                        <button
                          key={brand.id}
                          onClick={() => setSelectedBrand(brand.id)}
                          className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                            selectedBrand === brand.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                        >
                          {brand.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {/* Products Grid */}
            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-muted-foreground">
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                </p>
              </div>

              {filteredProducts.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
                  <Button 
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setSelectedBrand("all");
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="shadow-card hover:shadow-hover transition-all overflow-hidden group">
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1 line-clamp-2 min-h-[3rem]">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{product.specs}</p>
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
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
