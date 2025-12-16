import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MessageCircle, Package, ChevronLeft, ChevronRight, Home, Heart } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reviews from "@/components/product/Reviews";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { Facebook, Share2 } from "lucide-react";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Helmet } from "react-helmet-async";

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { addToRecentlyViewed } = useRecentlyViewed();
    const { settings } = useStoreSettings();
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
                const productData = { id: docSnap.id, ...docSnap.data() } as Product;
                setProduct(productData);
                // Track this product as recently viewed
                addToRecentlyViewed(productData.id);
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
        setSelectedVariants(prev => {
            // If clicking the same option, unselect it (toggle off)
            if (prev[variantName] === option) {
                const { [variantName]: removed, ...rest } = prev;
                return rest;
            }
            // Otherwise, select the new option
            return {
                ...prev,
                [variantName]: option
            };
        });
    };

    const handleAddToCart = () => {
        if (!product) return;

        // Build variant string only from selected variants
        let variantString = "";
        if (product.variants && product.variants.length > 0) {
            // Only include variants that have been selected
            const selectedOptions = product.variants
                .filter(v => selectedVariants[v.name])
                .map(v => selectedVariants[v.name]);

            // Require at least one variant to be selected
            if (selectedOptions.length === 0) {
                toast.error("Please select at least one option");
                return;
            }

            variantString = selectedOptions.join(" / ");
        }

        addToCart(product, 1, variantString || undefined);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
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
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {product && (
                <Helmet>
                    <title>{product.name} | The Prestige Merchandise</title>
                    <meta name="description" content={product.description.substring(0, 160)} />

                    {/* Open Graph / Facebook */}
                    <meta property="og:type" content="product" />
                    <meta property="og:url" content={window.location.href} />
                    <meta property="og:title" content={`${product.name} - GH₵${product.price.toFixed(2)}`} />
                    <meta property="og:description" content={product.description.substring(0, 160)} />
                    {product.images && product.images.length > 0 && (
                        <meta property="og:image" content={product.images[0]} />
                    )}

                    {/* Twitter */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:url" content={window.location.href} />
                    <meta name="twitter:title" content={`${product.name} - GH₵${product.price.toFixed(2)}`} />
                    <meta name="twitter:description" content={product.description.substring(0, 160)} />
                    {product.images && product.images.length > 0 && (
                        <meta name="twitter:image" content={product.images[0]} />
                    )}
                </Helmet>
            )}
            <Header />

            <main className="flex-1">
                <div className="container mx-auto px-4 py-6 md:py-10">
                    {/* Breadcrumbs */}
                    <div className="mb-6">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/" className="flex items-center gap-1">
                                            <Home className="h-4 w-4" />
                                            Home
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link to="/shop">Shop</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="font-medium text-foreground">{product.name}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                        {/* Left: Image Gallery */}
                        <div className="space-y-4">
                            <Card className="overflow-hidden border-none shadow-none bg-muted/30">
                                <div className="relative aspect-square">
                                    {hasImages ? (
                                        <>
                                            <img
                                                src={product.images[currentImageIndex]}
                                                alt={product.name}
                                                className="w-full h-full object-contain mix-blend-multiply p-4"
                                            />
                                            {product.images.length > 1 && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-sm rounded-full"
                                                        onClick={prevImage}
                                                    >
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-sm rounded-full"
                                                        onClick={nextImage}
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Button>
                                                </>
                                            )}
                                            {product.stock <= 5 && product.stock > 0 && (
                                                <Badge variant="destructive" className="absolute top-4 left-4 text-xs font-bold uppercase tracking-wide">
                                                    Low Stock: {product.stock} left
                                                </Badge>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <Package className="h-24 w-24 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Thumbnails */}
                            {hasImages && product.images.length > 1 && (
                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                    {product.images.map((image, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-transparent bg-muted/50 hover:bg-muted"
                                                }`}
                                        >
                                            <img
                                                src={image}
                                                alt={`View ${index + 1}`}
                                                className="w-full h-full object-contain p-1 mix-blend-multiply"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: Product Info */}
                        <div className="flex flex-col">
                            {/* Title & Meta */}
                            <div className="border-b pb-6 mb-6">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground mb-2">
                                            {product.name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
                                                {product.category}
                                            </span>
                                            <span>•</span>
                                            <span>SKU: {product.sku}</span>
                                        </div>
                                    </div>
                                    <WishlistButton
                                        productId={product.id}
                                        className="h-10 w-10"
                                    />
                                </div>

                                {/* Price Block */}
                                <div className="flex items-end gap-3 mt-4">
                                    <p className="text-4xl font-bold text-primary">
                                        GH₵{product.price.toFixed(2)}
                                    </p>
                                    {product.compareAtPrice && (
                                        <div className="mb-1 flex items-center gap-2">
                                            <p className="text-xl text-muted-foreground line-through">
                                                GH₵{product.compareAtPrice.toFixed(2)}
                                            </p>
                                            <Badge variant="destructive" className="rounded-md px-2 py-0.5 text-xs">
                                                -{discount}%
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Variants Selection */}
                            {product.variants && product.variants.length > 0 && (
                                <div className="mb-8 space-y-6">
                                    {product.variants.map((variant) => (
                                        <div key={variant.id}>
                                            <h3 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wide">
                                                Select {variant.name}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {variant.options.map((option) => (
                                                    <Button
                                                        key={option}
                                                        variant={selectedVariants[variant.name] === option ? "default" : "outline"}
                                                        onClick={() => handleVariantChange(variant.name, option)}
                                                        className={`h-10 min-w-[3rem] ${selectedVariants[variant.name] === option ? 'ring-2 ring-primary/20 ring-offset-1' : ''}`}
                                                    >
                                                        {option}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-4 mb-8">
                                <Button
                                    className="w-full h-14 text-lg font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                    size="lg"
                                    disabled={product.stock === 0}
                                    onClick={handleAddToCart}
                                >
                                    <ShoppingCart className="h-5 w-5 mr-2" />
                                    {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                                </Button>


                                <div className="grid grid-cols-2 gap-3">
                                    <a
                                        href={`https://wa.me/${settings.whatsappNumber}?text=I'm interested in ${product.name}: ${window.location.href}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="col-span-2"
                                    >
                                        <Button variant="outline" className="w-full h-12 text-base border-primary/20 hover:bg-green-50 hover:text-green-600 transition-colors">
                                            <MessageCircle className="h-5 w-5 mr-2" />
                                            WhatsApp
                                        </Button>
                                    </a>

                                    {settings.facebookUrl && (
                                        <a
                                            href={settings.facebookUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" className="w-full h-12 border-primary/20 hover:bg-blue-50 hover:text-blue-600">
                                                <Facebook className="h-5 w-5 mr-2" />
                                                Facebook
                                            </Button>
                                        </a>
                                    )}

                                    <Button
                                        variant="outline"
                                        className={`w-full h-12 border-primary/20 hover:bg-gray-50 ${!settings.facebookUrl ? 'col-span-2' : ''}`}
                                        onClick={handleCopyLink}
                                    >
                                        <Share2 className="h-5 w-5 mr-2" />
                                        Copy Link
                                    </Button>
                                </div>
                            </div>

                            {/* Trust Signals */}
                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Genuine Parts
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Fast Delivery
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Secure Payment
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Support 24/7
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Info Tabs */}
                    <div className="mt-16">
                        <Tabs defaultValue="description" className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent overflow-x-auto">
                                <TabsTrigger
                                    value="description"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-base"
                                >
                                    Description
                                </TabsTrigger>
                                <TabsTrigger
                                    value="details"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-base"
                                >
                                    Additional Details
                                </TabsTrigger>
                                <TabsTrigger
                                    value="reviews"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-base"
                                >
                                    Reviews
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="description" className="pt-8">
                                <div className="prose prose-stone max-w-none dark:prose-invert">
                                    <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
                                        {product.description}
                                    </p>
                                </div>
                            </TabsContent>
                            <TabsContent value="details" className="pt-8">
                                <Card>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold mb-2">Specifications</h4>
                                            {product.specifications ? (
                                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                                    {product.specifications.split('\n').filter(line => line.trim()).map((line, index) => (
                                                        <li key={index}>{line.trim()}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                                    <li>Manufacturer: Genuine OEM</li>
                                                    <li>Condition: Brand New</li>
                                                    <li>Warranty: 1 Year</li>
                                                </ul>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Shipping Info</h4>
                                            <p className="text-muted-foreground">
                                                {product.shippingInfo || "Ships within 24 hours. Nationwide delivery available via our trusted partners."}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </TabsContent>
                            <TabsContent value="reviews" className="pt-8">
                                <Reviews productId={product.id} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main >

            <Footer />
        </div >
    );
};

export default ProductDetail;
