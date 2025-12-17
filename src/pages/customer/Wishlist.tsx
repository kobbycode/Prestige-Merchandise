import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Product } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, ShoppingCart, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Wishlist = () => {
    const { user, isAuthenticated } = useAuth();
    const { items, removeFromWishlist, clearWishlist, loading: wishlistLoading } = useWishlist();
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch product details for each wishlist item
    useEffect(() => {
        const fetchProducts = async () => {
            if (items.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                const productPromises = items.map(async (item) => {
                    const docRef = doc(db, "products", item.productId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { id: docSnap.id, ...docSnap.data() } as Product;
                    }
                    return null;
                });

                const fetchedProducts = await Promise.all(productPromises);
                setProducts(fetchedProducts.filter((p): p is Product => p !== null));
            } catch (error) {
                console.error("Error fetching wishlist products:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!wishlistLoading) {
            fetchProducts();
        }
    }, [items, wishlistLoading]);

    const handleAddToCart = (product: Product) => {
        addToCart(product, 1);
    };

    const handleRemove = (productId: string) => {
        removeFromWishlist(productId);
        setProducts((prev) => prev.filter((p) => p.id !== productId));
    };

    const isLoading = loading || wishlistLoading;

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 bg-muted/30">
                <div className="container mx-auto px-4 py-6 md:py-8">
                    <div className="sticky top-[65px] md:top-[85px] z-40 bg-muted/95 backdrop-blur-sm -mx-4 px-4 py-4 mb-6 md:mb-8 border-b border-border/50">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold">My Wishlist</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {products.length} {products.length === 1 ? "item" : "items"} saved
                                </p>
                            </div>
                            {products.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearWishlist}
                                    className="w-full md:w-auto text-muted-foreground hover:text-red-600 hover:border-red-200"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear Wishlist
                                </Button>
                            )}
                        </div>
                    </div>

                    {!isAuthenticated && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <p className="text-amber-800 text-sm">
                                <strong>Note:</strong> Your wishlist is saved locally.
                                <Link to="/login" className="underline ml-1 font-medium">
                                    Log in
                                </Link> to sync across devices.
                            </p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center h-[50vh]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : products.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Heart className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
                                <p className="text-muted-foreground mb-6 max-w-sm">
                                    Save items you love by clicking the heart icon on products.
                                </p>
                                <Link to="/shop">
                                    <Button size="lg" className="min-w-[150px]">Browse Shop</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {products.map((product) => (
                                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                                    <Link to={`/product/${product.id}`}>
                                        <div className="relative aspect-square overflow-hidden bg-muted">
                                            <img
                                                src={product.images[0] || "/placeholder.svg"}
                                                alt={product.name}
                                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                                    {Math.round((1 - product.price / product.compareAtPrice) * 100)}% OFF
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <CardContent className="p-4">
                                        <Link to={`/product/${product.id}`}>
                                            <h3 className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors mb-2">
                                                {product.name}
                                            </h3>
                                        </Link>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-lg font-bold text-primary">
                                                {formatPrice(product.price)}
                                            </span>
                                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                                                <span className="text-sm text-muted-foreground line-through">
                                                    {formatPrice(product.compareAtPrice)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1"
                                                size="sm"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.stock === 0}
                                            >
                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                                                onClick={() => handleRemove(product.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Wishlist;
