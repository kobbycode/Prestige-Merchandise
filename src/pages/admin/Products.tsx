import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { FaFacebook } from "react-icons/fa";
import { toast } from "sonner";

const Products = () => {
    const navigate = useNavigate();
    const { formatPrice } = useCurrency();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const productsList: Product[] = [];
            querySnapshot.forEach((doc) => {
                productsList.push({ id: doc.id, ...doc.data() } as Product);
            });
            setProducts(productsList);
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        const id = deleteId;
        setDeleteId(null);

        // Optimistic update
        const previousProducts = [...products];
        setProducts(prev => prev.filter(p => p.id !== id));

        const toastId = toast.loading("Deleting product...");
        try {
            await deleteDoc(doc(db, "products", id));
            toast.success("Product deleted successfully", { id: toastId });
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Failed to delete product", { id: toastId });
            setProducts(previousProducts);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: Product['status']) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            draft: 'bg-yellow-100 text-yellow-800',
            archived: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Manage your product catalog</p>
                </div>
                <Button onClick={() => navigate('/admin/products/new')} className="gap-2 w-full md:w-auto">
                    <Plus className="h-4 w-4" /> Add Product
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No products found</h3>
                            <p className="text-muted-foreground mb-4">
                                {searchQuery ? "Try adjusting your search" : "Get started by adding your first product"}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => navigate('/admin/products/new')}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Product
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Mobile View: Cards */}
                            <div className="block md:hidden space-y-4">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="bg-white rounded-lg border p-4 shadow-sm space-y-3">
                                        <div className="flex gap-4">
                                            {/* Product Image */}
                                            <div className="h-20 w-20 shrink-0 rounded bg-muted overflow-hidden">
                                                {product.images[0] ? (
                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                                                    {getStatusBadge(product.status)}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {product.category}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    SKU: {product.sku}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {product.views || 0} views
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <div className="space-y-0.5">
                                                <div className="font-semibold">
                                                    {formatPrice(product.price)}
                                                </div>
                                                {product.stock <= 10 && (
                                                    <div className="text-xs text-destructive font-medium">
                                                        Low Stock: {product.stock}
                                                    </div>
                                                )}
                                                {product.stock > 10 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Stock: {product.stock}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-1">
                                                <a
                                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/product/${product.id}`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8"
                                                        title="Share to Facebook"
                                                    >
                                                        <FaFacebook className="h-4 w-4 text-[#1877F2]" />
                                                    </Button>
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8"
                                                    onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setDeleteId(product.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Views</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProducts.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {product.images[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                className="h-10 w-10 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{product.name}</div>
                                                            {product.featured && (
                                                                <span className="text-xs text-primary">Featured</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                                                <TableCell>{product.category}</TableCell>
                                                <TableCell>
                                                    <span className={product.stock <= 10 ? 'text-destructive font-medium' : ''}>
                                                        {product.stock}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {product.views || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{formatPrice(product.price)}</div>
                                                        {product.compareAtPrice && (
                                                            <div className="text-xs text-muted-foreground line-through">
                                                                {formatPrice(product.compareAtPrice)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(product.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/product/${product.id}`)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Share to Facebook"
                                                            >
                                                                <FaFacebook className="h-4 w-4 text-[#1877F2]" />
                                                            </Button>
                                                        </a>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() => setDeleteId(product.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )
                    }
                </CardContent>
            </Card>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this product? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default Products;
