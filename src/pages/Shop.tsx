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
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Shop = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { settings } = useStoreSettings();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [sortBy, setSortBy] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
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
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  const fetchProducts = async () => {
    try {
      // Fetch only active products
      const q = query(collection(db, "products"), where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      const productsList: Product[] = [];
      const categoriesSet = new Set<string>();

      querySnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() } as Product;
        productsList.push(product);
        if (product.category) {
          categoriesSet.add(product.category);
        }
      });

      setProducts(productsList);
      setCategories(["All Products", ...Array.from(categoriesSet)]);
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

    return matchesSearch && matchesCategory && matchesPrice;
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

        {/* Clear Filters */}
        {(searchQuery || selectedCategory !== "all" || priceRange.min || priceRange.max) && (
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
                    <Card className="p-8 md:p-12 text-center">
                      <p className="text-muted-foreground text-lg">No products found matching your criteria.</p>
                      <Button
                        onClick={clearFilters}
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 stagger-animation">
                      {paginatedProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="shadow-card hover:shadow-hover transition-all overflow-hidden group cursor-pointer animate-slide-up"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <div className="aspect-square overflow-hidden bg-muted relative">
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
                            {/* Wishlist Button */}
                            <div className="absolute top-2 left-2" onClick={(e) => e.stopPropagation()}>
                              <WishlistButton
                                productId={product.id}
                                className="bg-white/80 hover:bg-white shadow-sm"
                              />
                            </div>
                          </div>
                          <CardContent className="p-3 md:p-4">
                            <h3 className="font-semibold mb-1 md:mb-2 line-clamp-2 text-sm md:text-base min-h-[2.5rem] md:min-h-[3rem]">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                            <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 mb-3 md:mb-4">
                              <p className="text-base md:text-2xl font-bold text-primary">GH₵{product.price.toFixed(2)}</p>
                              {product.compareAtPrice && (
                                <p className="text-xs md:text-sm text-muted-foreground line-through">GH₵{product.compareAtPrice.toFixed(2)}</p>
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
                                href={`https://wa.me/${settings.whatsappNumber}?text=I am interested in this product: ${window.location.origin}/product/${product.id}`}
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
