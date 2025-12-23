import { useState, useEffect, useRef } from "react";
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
import { Badge } from "@/components/ui/badge";

import ShopFilters from "@/components/shop/ShopFilters";

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { settings } = useStoreSettings();
  const { formatPrice } = useCurrency();
  const productsTopRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [sortBy, setSortBy] = useState("newest");
  const [selectedManufacturer, setSelectedManufacturer] = useState("all");
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [priceSliderValue, setPriceSliderValue] = useState<number[]>([0, 10000]);
  const [maxProductPrice, setMaxProductPrice] = useState(10000);
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
  }, [searchQuery, selectedCategory, sortBy, selectedManufacturer, selectedCondition, inStockOnly, featuredOnly]);

  // Scroll to top when page changes
  useEffect(() => {
    if (productsTopRef.current) {
      productsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

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

      // Set max price for slider
      if (productsList.length > 0) {
        const max = Math.max(...productsList.map(p => p.price));
        setMaxProductPrice(Math.ceil(max / 100) * 100);
        setPriceSliderValue([0, Math.ceil(max / 100) * 100]);
      }
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

    const matchesPrice = product.price >= priceSliderValue[0] && product.price <= priceSliderValue[1];

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
      case "discount":
        const discountA = a.compareAtPrice ? ((a.compareAtPrice - a.price) / a.compareAtPrice) : 0;
        const discountB = b.compareAtPrice ? ((b.compareAtPrice - b.price) / b.compareAtPrice) : 0;
        return discountB - discountA;
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasActiveFilters = searchQuery || selectedCategory !== "all" ||
    selectedManufacturer !== "all" || selectedCondition !== "all" || inStockOnly || featuredOnly;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");

    setSelectedManufacturer("all");
    setSelectedCondition("all");
    setInStockOnly(false);
    setFeaturedOnly(false);
    setPriceSliderValue([0, maxProductPrice]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 animate-fade-in">
        {/* Page Header */}
        <section className="bg-secondary text-secondary-foreground py-8 md:py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4">Steering Parts & Components</h1>
            <p className="text-lg md:text-xl opacity-90">Browse our extensive selection of genuine steering parts, racks, pumps, and accessories</p>
          </div>
        </section>

        <div ref={productsTopRef} className="container mx-auto px-4 py-6 md:py-8">
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
                        <ShopFilters
                          categories={categories}
                          selectedCategory={selectedCategory}
                          setSelectedCategory={setSelectedCategory}
                          priceSliderValue={priceSliderValue}
                          setPriceSliderValue={setPriceSliderValue}
                          maxProductPrice={maxProductPrice}
                          manufacturers={manufacturers}
                          selectedManufacturer={selectedManufacturer}
                          setSelectedManufacturer={setSelectedManufacturer}
                          conditions={conditions}
                          selectedCondition={selectedCondition}
                          setSelectedCondition={setSelectedCondition}
                          inStockOnly={inStockOnly}
                          setInStockOnly={setInStockOnly}
                          featuredOnly={featuredOnly}
                          setFeaturedOnly={setFeaturedOnly}
                          clearFilters={clearFilters}
                          hasActiveFilters={!!hasActiveFilters}
                        />
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
                        <SelectItem value="discount">Biggest Discount</SelectItem>
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
                      <ShopFilters
                        categories={categories}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        priceSliderValue={priceSliderValue}
                        setPriceSliderValue={setPriceSliderValue}
                        maxProductPrice={maxProductPrice}
                        manufacturers={manufacturers}
                        selectedManufacturer={selectedManufacturer}
                        setSelectedManufacturer={setSelectedManufacturer}
                        conditions={conditions}
                        selectedCondition={selectedCondition}
                        setSelectedCondition={setSelectedCondition}
                        inStockOnly={inStockOnly}
                        setInStockOnly={setInStockOnly}
                        featuredOnly={featuredOnly}
                        setFeaturedOnly={setFeaturedOnly}
                        clearFilters={clearFilters}
                        hasActiveFilters={!!hasActiveFilters}
                      />
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
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.max(1, p - 1));
                          }}
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
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pageNumber);
                                }}
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
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / itemsPerPage), p + 1));
                          }}
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
