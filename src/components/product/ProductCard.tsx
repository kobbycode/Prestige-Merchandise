import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, MessageCircle, Eye, Package } from "lucide-react";
import { Product } from "@/types/product";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { useState } from "react";
import QuickViewModal from "./QuickViewModal";
import { cn } from "@/lib/utils";

interface ProductCardProps {
    product: Product;
    index?: number;
    showDescription?: boolean;
}

const ProductCard = ({ product, index = 0, showDescription = false }: ProductCardProps) => {
    const navigate = useNavigate();
    const { formatPrice } = useCurrency();
    const { addToCart } = useCart();
    const { settings } = useStoreSettings();
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const handleQuickView = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsQuickViewOpen(true);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1);
    };

    return (
        <>
            <Card
                className="shadow-card hover:shadow-hover transition-all overflow-hidden group cursor-pointer animate-fade-in-up border-none bg-card/50 backdrop-blur-sm"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/product/${product.id}`)}
            >
                <div className="aspect-square overflow-hidden bg-[#F8F9FA] relative">
                    {product.images && product.images[0] ? (
                        <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-contain p-2 md:p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-10 w-10 md:h-16 md:w-16 text-muted-foreground" />
                        </div>
                    )}

                    {/* Badge */}
                    {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow-lg z-10">
                            Low Stock
                        </span>
                    )}

                    {/* Quick Action Overlay (Desktop) */}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="hidden md:flex transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl bg-white text-foreground hover:bg-primary hover:text-primary-foreground font-bold rounded-full h-10 w-10 p-0"
                            onClick={handleQuickView}
                            title="Quick View"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Wishlist Button */}
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                        <WishlistButton
                            productId={product.id}
                            className="bg-white/80 hover:bg-white shadow-sm hover:scale-110 transition-transform"
                        />
                    </div>
                </div>

                <CardContent className="p-3 md:p-5 flex flex-col h-[calc(100%-100%)]">
                    <div className="flex-1">
                        <h3 className="font-bold mb-1 md:mb-2 line-clamp-2 text-sm md:text-base min-h-[2.5rem] md:min-h-[3rem] group-hover:text-primary transition-colors">
                            {product.name}
                        </h3>
                        {showDescription && (
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2 italic">
                                {product.description}
                            </p>
                        )}
                        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 mb-3 md:mb-5 pt-1">
                            <p className="text-base md:text-2xl font-bold text-primary tracking-tight">
                                {formatPrice(product.price)}
                            </p>
                            {product.compareAtPrice && (
                                <p className="text-xs md:text-sm text-muted-foreground line-through opacity-60">
                                    {formatPrice(product.compareAtPrice)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                        <Button
                            className="w-full gap-2 text-xs md:text-sm h-9 md:h-11 font-bold shadow-sm active:scale-95 transition-all"
                            size="sm"
                            onClick={handleAddToCart}
                            disabled={product.stock === 0}
                        >
                            <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                        </Button>
                        <a
                            href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello, I'm interested in ${product.name} (${formatPrice(product.price)}): ${window.location.origin}/product/${product.id}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            <Button
                                variant="outline"
                                className="w-full gap-2 text-xs md:text-sm h-9 md:h-11 border-muted hover:border-primary/50 hover:bg-primary/5"
                                size="sm"
                            >
                                <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#25D366]" />
                                <span className="hidden sm:inline">Order on</span> WhatsApp
                            </Button>
                        </a>
                    </div>
                </CardContent>
            </Card>

            <QuickViewModal
                product={product}
                isOpen={isQuickViewOpen}
                onClose={() => setIsQuickViewOpen(false)}
            />
        </>
    );
};

export default ProductCard;
