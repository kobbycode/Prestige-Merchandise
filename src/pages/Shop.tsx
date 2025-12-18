import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Search, ShoppingCart, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useCart } from "@/contexts/CartContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter as FilterIcon } from "lucide-react";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import ProductCard from "@/components/product/ProductCard";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCurrency } from "@/contexts/CurrencyContext";

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency(); // Use currency formatter
  const { addToCart } = useCart();
  const { settings } = useStoreSettings();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("newest");
  const [selectedManufacturer, setSelectedManufacturer] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceRange, sortBy, selectedManufacturer, selectedCondition, inStockOnly, featuredOnly]);

  const fetchProducts = async () => {
    try {
      // Fetch only active products
      const q = query(collection(db, "products"), where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      const productsList: Product[] = [];
      const categoriesSet = new Set<string>();
      const manufacturersSet = new Set<string>();
      const conditionsSet = new Set<string>();

      querySnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product;
        productsList.push(product);
        if (product.category) {
          categoriesSet.add(product.category);
        }
        if (product.manufacturer) {
          manufacturersSet.add(product.manufacturer);
        }
        if (product.condition) {
          conditionsSet.add(product.condition);
        }
      });

      setProducts(productsList);
      setCategories(["All Products", ...Array.from(categoriesSet)]);
      setManufacturers(["All", ...Array.from(manufacturersSet)]);
      setConditions(["All", ...Array.from(conditionsSet)]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" ||
      selectedCategory === "All Products" ||
      product.category === selectedCategory;

    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

    const matchesManufacturer = selectedManufacturer === "all" ||
      selectedManufacturer === "All" ||
      product.manufacturer === selectedManufacturer;

    const matchesCondition = selectedCondition === "all" ||
      selectedCondition === "All" ||
      product.condition === selectedCondition;

    const matchesStock = !inStockOnly || product.stock > 0;

    const matchesFeatured = !featuredOnly || product.featured;

    return matchesSearch && matchesCategory && matchesPrice && matchesManufacturer && matchesCondition && matchesStock && matchesFeatured;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setPriceRange({ min: "", max: "" });
    setSelectedManufacturer("all");
    setSelectedCondition("all");
    setInStockOnly(false);
    setFeaturedOnly(false);
  };



  // ... inside component ...

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-4">Filter By</h3>
        {/* Category Filter */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">CATEGORY</h4>
          <div className="space-y-1">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category === "All Products" ? "all" : category)}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${(
                  selectedCategory === category ||
                  (selectedCategory === "all" && category === "All Products")
                )
                  ? "bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">PRICE RANGE</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Price (GH₵)</label>
              <Input
                type="number"
                placeholder="0"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                min="0"
                step="10"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Price (GH₵)</label>
              <Input
                type="number"
                placeholder="Any"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                min="0"
                step="10"
              />
            </div>
          </div>
        </div>

        {/* Manufacturer Filter */}
        {manufacturers.length > 1 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">MANUFACTURER</h4>
            <Select value={selectedManufacturer} onValueChange={setSelectedManufacturer}>
              <SelectTrigger>
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                {manufacturers.map((manufacturer, index) => (
                  <SelectItem key={index} value={manufacturer === "All" ? "all" : manufacturer}>
                    {manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Condition Filter */}
        {conditions.length > 1 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">CONDITION</h4>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger>
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition, index) => (
                  <SelectItem key={index} value={condition === "All" ? "all" : condition}>
                    {condition}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stock Availability */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">AVAILABILITY</h4>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm">In Stock Only</span>
          </label>
        </div>

        {/* Featured Products */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-sm text-muted-foreground">SPECIAL</h4>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm">Featured Products Only</span>
          </label>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedCategory !== "all" || priceRange.min || priceRange.max ||
          selectedManufacturer !== "all" || selectedCondition !== "all" || inStockOnly || featuredOnly) && (
            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 animate-fade-in">
        {/* Page Header */}
        <section className="bg-secondary text-secondary-foreground py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">Shop Auto Parts</h1>
            <p className="text-lg md:text-xl opacity-90">Browse our complete catalog of genuine spare parts</p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-6 md:py-8">
          {loading ? (
            <div className="space-y-8">
              <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="w-full max-w-xl h-14 bg-muted animate-pulse rounded-md"></div>
                <div className="w-full md:w-auto h-10 bg-muted animate-pulse rounded-md"></div>
              </div>
              <ProductGridSkeleton count={12} />
            </div>
          ) : (
            <>
              {/* Search Bar & Sort */}
              <div className="mb-6 md:mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search for parts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 md:pl-10 py-5 md:py-6 text-base md:text-lg"
                  />
                </div>

                <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3">
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden gap-2">
                        <FilterIcon className="h-4 w-4" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium whitespace-nowrap hidden sm:inline-block">Sort by:</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[140px] md:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Desktop Filters Sidebar */}
                <aside className="hidden lg:block lg:col-span-1">
                  <Card className="sticky top-24">
                    <CardContent className="p-6">
                      <FilterContent />
                    </CardContent>
                  </Card>
                </aside>

                {/* Products Grid */}
                <div className="lg:col-span-3">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </p>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <EmptyState
                      icon={Package}
                      title="No parts found"
                      description="We couldn't find any products matching your current filters. Try adjusting your search or clearing filters."
                      actionLabel="Clear All Filters"
                      onAction={clearFilters}
                    />
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 stagger-animation">
                      {paginatedProducts.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} showDescription={true} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination Controls */}
              {filteredProducts.length > 0 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.ceil(filteredProducts.length / itemsPerPage) }).map((_, i) => {
                        const pageNumber = i + 1;
                        // Basic logic to show limited pages if many pages exist could go here
                        // For now, showing all page numbers if < 7, else simple logic or just all (if not too many)
                        if (
                          pageNumber === 1 ||
                          pageNumber === Math.ceil(filteredProducts.length / itemsPerPage) ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNumber}>
                              <PaginationLink
                                isActive={currentPage === pageNumber}
                                onClick={() => setCurrentPage(pageNumber)}
                                className="cursor-pointer"
                              >
                                {pageNumber}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <PaginationItem key={pageNumber}><PaginationEllipsis /></PaginationItem>
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1))}
                          className={currentPage === Math.ceil(filteredProducts.length / itemsPerPage) ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Shop;
