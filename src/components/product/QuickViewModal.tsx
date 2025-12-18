import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MessageCircle, Info, Truck, ShieldCheck, Star } from "lucide-react";
import { Product } from "@/types/product";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";

interface QuickViewModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
}

const QuickViewModal = ({ product, isOpen, onClose }: QuickViewModalProps) => {
    const { formatPrice } = useCurrency();
    const { addToCart } = useCart();
    const { settings } = useStoreSettings();
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (product) {
            setCurrentImageIndex(0);
            setSelectedVariants({});
        }
    }, [product]);

    if (!product) return null;

    const handleAddToCart = () => {
        // Check if all variants are selected
        const unselectedVariants = product.variants.filter(
            v => !selectedVariants[v.name]
        );

        if (unselectedVariants.length > 0) {
            toast.error(`Please select ${unselectedVariants[0].name}`);
            return;
        }

        // Build variant string
        const variantString = product.variants
            .map(v => selectedVariants[v.name])
            .join(" / ");

        addToCart(product, 1, variantString);
        onClose();
    };

    const whatsappMessage = `Hello, I'm interested in ${product.name} (${formatPrice(product.price)}): ${window.location.origin}/product/${product.id}`;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background">
                <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
                    {/* Image Gallery Side */}
                    <div className="md:w-1/2 bg-muted/30 p-4 md:p-8 flex flex-col items-center justify-center relative">
                        <div className="aspect-square w-full relative overflow-hidden rounded-xl bg-white shadow-sm">
                            {product.images?.[currentImageIndex] ? (
                                <img
                                    src={product.images[currentImageIndex]}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                    No Image
                                </div>
                            )}

                            {product.stock <= 5 && product.stock > 0 && (
                                <Badge variant="destructive" className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wide animate-pulse-subtle shadow-lg">
                                    Low Stock: {product.stock} left
                                </Badge>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 max-w-full">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`h-16 w-16 min-w-[64px] rounded-md overflow-hidden bg-white border-2 transition-all ${currentImageIndex === idx ? "border-primary shadow-sm scale-105" : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <img src={img} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-contain p-1" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info Side */}
                    <div className="md:w-1/2 p-6 md:p-8 flex flex-col space-y-6">
                        <div className="space-y-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary-foreground hover:bg-primary/20 border-none px-3">
                                {product.category}
                            </Badge>
                            <DialogTitle className="text-2xl md:text-3xl font-bold leading-tight line-clamp-2">
                                {product.name}
                            </DialogTitle>

                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl md:text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
                                    {product.compareAtPrice && (
                                        <span className="text-lg text-muted-foreground line-through opacity-70">
                                            {formatPrice(product.compareAtPrice)}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">4.8</span>
                                    <span className="text-xs text-muted-foreground">(24 reviews)</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Variants */}
                        {product.variants && product.variants.map((variant) => (
                            <div key={variant.name} className="space-y-3">
                                <label className="text-sm font-bold uppercase tracking-wider text-foreground/70">
                                    {variant.name}: <span className="text-primary">{selectedVariants[variant.name] || "Select"}</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {variant.options.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.name]: option }))}
                                            className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${selectedVariants[variant.name] === option
                                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                : "border-muted hover:border-primary/40 text-muted-foreground"
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="space-y-3 pt-4">
                            <Button
                                className="w-full h-14 text-base font-bold shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                            </Button>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-12 border-muted hover:border-primary/50 text-sm"
                                    onClick={() => {
                                        onClose();
                                        window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                                    }}
                                >
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    Order WhatsApp
                                </Button>
                                <Link to={`/product/${product.id}`} onClick={onClose} className="w-full">
                                    <Button variant="ghost" className="w-full h-12 text-sm hover:bg-primary/5">
                                        <Info className="mr-2 h-4 w-4" />
                                        Full Details
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Trust Signals */}
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t mt-auto">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ShieldCheck className="h-4 w-4 text-green-500" />
                                <span>100% Genuine Part</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Truck className="h-4 w-4 text-blue-500" />
                                <span>Fast GH Delivery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default QuickViewModal;
