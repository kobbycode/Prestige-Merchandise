import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef } from "react";

const RecentlyViewed = () => {
    const { recentlyViewed, clearRecentlyViewed } = useRecentlyViewed();
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            if (recentlyViewed.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                const productPromises = recentlyViewed.map(async (id) => {
                    const docRef = doc(db, "products", id);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { id: docSnap.id, ...docSnap.data() } as Product;
                    }
                    return null;
                });

                const fetchedProducts = await Promise.all(productPromises);
                // Filter out nulls and keep order from recentlyViewed
                setProducts(fetchedProducts.filter((p): p is Product => p !== null));
            } catch (error) {
                console.error("Error fetching recently viewed products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [recentlyViewed]);

    const scrollLeft = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
        }
    };

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
        }
    };

    // Don't render if no recently viewed items
    if (!loading && products.length === 0) {
        return null;
    }

    return (
        <section className="py-8 md:py-12">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold">Recently Viewed</h2>
                    {products.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearRecentlyViewed}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Clear
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="relative group">
                        {/* Scroll Buttons */}
                        {products.length > 4 && (
                            <>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                                    onClick={scrollLeft}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
                                    onClick={scrollRight}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </>
                        )}

                        {/* Scrollable Container */}
                        <div
                            ref={scrollRef}
                            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            {products.map((product) => (
                                <Link
                                    key={product.id}
                                    to={`/product/${product.id}`}
                                    className="flex-shrink-0 w-[200px] md:w-[220px] snap-start"
                                >
                                    <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group/card">
                                        <div className="aspect-square overflow-hidden bg-muted relative">
                                            {product.images && product.images[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-full h-full object-contain p-2 group-hover/card:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-3">
                                            <h3 className="font-medium text-sm line-clamp-2 mb-1">
                                                {product.name}
                                            </h3>
                                            <p className="text-primary font-bold">
                                                {formatPrice(product.price)}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecentlyViewed;
