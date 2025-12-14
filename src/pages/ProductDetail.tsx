import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, MessageCircle, Package, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reviews from "@/components/product/Reviews";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

    useEffect(() => {
        if (id) {
            fetchProduct(id);
        }
    }, [id]);

    const fetchProduct = async (productId: string) => {
        try {
            const docRef = doc(db, "products", productId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
            } else {
                toast.error("Product not found");
                navigate("/shop");
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("Failed to load product");
        } finally {
            setLoading(false);
        }
    };

    const nextImage = () => {
        if (product && product.images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
        }
    };

    const prevImage = () => {
        if (product && product.images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
        }
    };

    const handleVariantChange = (variantName: string, option: string) => {
        setSelectedVariants(prev => ({
            ...prev,
            [variantName]: option
        }));
    };

    const handleAddToCart = () => {
        if (!product) return;

        // Check availability logic if needed (e.g. max stock)

        // Validate variants
        let variantString = "";
        if (product.variants && product.variants.length > 0) {
            const missingVariants = product.variants.filter(v => !selectedVariants[v.name]);
            if (missingVariants.length > 0) {
                toast.error(`Please select ${missingVariants.map(v => v.name).join(", ")}`);
                return;
            }
            // Generate deterministic variant string based on variants order
            variantString = product.variants
                .map(v => selectedVariants[v.name])
                .join(" / ");
        }

        addToCart(product, 1, variantString || undefined);
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!product) {
        return null;
    }

    const hasImages = product.images && product.images.length > 0;
    const discount = product.compareAtPrice
        ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
        : 0;

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1">
                <div className="container mx-auto px-4 py-8">
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/shop")}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Shop
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image Gallery */}
                        <div className="space-y-4">
                            <Card className="overflow-hidden">
                                <div className="relative aspect-square bg-muted">
                                    {hasImages ? (
                                        <>
                                            <img
                                                src={product.images[currentImageIndex]}
                                                alt={product.name}
                                                className="w-full h-full object-contain"
                                            />
                                            {product.images.length > 1 && (
                                                <>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute left-2 top-1/2 -translate-y-1/2"
                                                        onClick={prevImage}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2"
                                                        onClick={nextImage}
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                                        {product.images.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => setCurrentImageIndex(index)}
                                                                className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                                                                    ? "bg-primary w-8"
                                                                    : "bg-white/50"
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="h-24 w-24 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Thumbnail Gallery */}
                            {hasImages && product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                ? "border-primary"
                                                : "border-transparent hover:border-muted-foreground"
                                                }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`${product.name} ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
                                    {product.featured && (
                                        <Badge variant="secondary" className="rounded-none px-4 py-1 flex items-center justify-center">Featured</Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground">SKU: {product.sku}</p>
                            </div>

                            {/* Price */}
                            <div className="flex items-baseline gap-3">
                                <p className="text-4xl font-bold text-primary">
                                    GHS {product.price.toFixed(2)}
                                </p>
                                {product.compareAtPrice && (
                                    <>
                                        <p className="text-xl text-muted-foreground line-through">
                                            GHS {product.compareAtPrice.toFixed(2)}
                                        </p>
                                        <Badge variant="destructive" className="rounded-none px-3 py-1 flex items-center justify-center">
                                            {discount}% OFF
                                        </Badge>
                                    </>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div>
                                {product.stock > 0 ? (
                                    <p className="text-green-600 font-medium">
                                        ✓ In Stock ({product.stock} available)
                                    </p>
                                ) : (
                                    <p className="text-destructive font-medium">✗ Out of Stock</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Description</h2>
                                <p className="text-muted-foreground whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>

                            {/* Variants */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="space-y-4">
                                    {product.variants.map((variant) => (
                                        <div key={variant.id}>
                                            <h3 className="font-semibold mb-2">{variant.name}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {variant.options.map((option) => (
                                                    <Button
                                                        key={option}
                                                        variant={
                                                            selectedVariants[variant.name] === option
                                                                ? "default"
                                                                : "outline"
                                                        }
                                                        onClick={() => handleVariantChange(variant.name, option)}
                                                    >
                                                        {option}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Category & Tags */}
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <span className="font-semibold">Category:</span>{" "}
                                    <Badge variant="secondary">{product.category}</Badge>
                                </p>

                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3 pt-4">
                                <Button
                                    className="w-full gap-2"
                                    size="lg"
                                    disabled={product.stock === 0}
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCart className="h-5 w-5" />
                                    Add to Cart
                                </Button>
                                <a
                                    href={`https://wa.me/233247654321?text=I'm interested in ${product.name}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <Button variant="outline" className="w-full gap-2" size="lg">
                                        <MessageCircle className="h-5 w-5" />
                                        Order on WhatsApp
                                    </Button>
                                </a>
                            </div>
                            {/* Additional Details */}
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Product Details</h2>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Genuine Toyota part</li>
                                    <li>Direct replacement</li>
                                    <li>Includes necessary mounting hardware</li>
                                    <li>1-year warranty against defects</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="mt-16">
                        <Reviews productId={product.id} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;
