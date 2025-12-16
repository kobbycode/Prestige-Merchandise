import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Product, ProductFormData, Category } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, X, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { checkAndAlertLowStock } from "@/lib/stockMonitor";

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        description: "",
        price: 0,
        compareAtPrice: undefined,
        category: "",
        images: [],
        variants: [],
        stock: 0,
        sku: "",
        status: "draft",
        featured: false,
        tags: [],
        specifications: "",
        shippingInfo: "",
    });

    useEffect(() => {
        fetchCategories();
        if (isEdit && id) {
            fetchProduct(id);
        }
    }, [id, isEdit]);

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, "categories"), orderBy("name"));
            const querySnapshot = await getDocs(q);
            const categoriesList: Category[] = [];
            querySnapshot.forEach((doc) => {
                categoriesList.push({ id: doc.id, ...doc.data() } as Category);
            });
            setCategories(categoriesList);
            // If creating new product and categories exist, set default
            if (!isEdit && categoriesList.length > 0 && !formData.category) {
                // setFormData(prev => ({ ...prev, category: categoriesList[0].name }));
                // actually better to force user to choose
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // toast.error("Failed to load categories");
        }
    };

    const fetchProduct = async (productId: string) => {
        try {
            const docRef = doc(db, "products", productId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const product = docSnap.data() as Product;
                setFormData({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice,
                    category: product.category,
                    images: product.images,
                    variants: product.variants,
                    stock: product.stock,
                    sku: product.sku,
                    status: product.status,
                    featured: product.featured,
                    tags: product.tags,
                    specifications: product.specifications || "",
                    shippingInfo: product.shippingInfo || "",
                });
                setImagePreviews(product.images);
            } else {
                toast.error("Product not found");
                navigate("/admin/products");
            }
        } catch (error) {
            console.error("Error fetching product:", error);
            toast.error("Failed to load product");
        } finally {
            setLoading(false);
        }
    };

    // ... (rest of image handling functions) ...

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(prev => [...prev, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const uploadImages = async (productId: string): Promise<string[]> => {
        const uploadPromises = imageFiles.map(async (file) => {
            const storageRef = ref(storage, `products/${productId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            return getDownloadURL(storageRef);
        });

        const newUrls = await Promise.all(uploadPromises);
        return [...formData.images, ...newUrls];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        const toastId = toast.loading(isEdit ? "Updating product..." : "Creating product...");

        try {
            const productId = isEdit ? id! : doc(collection(db, "products")).id;

            // Upload new images if any
            let imageUrls = formData.images;
            if (imageFiles.length > 0) {
                imageUrls = await uploadImages(productId);
            }

            const productData: Product = {
                id: productId,
                ...formData,
                images: imageUrls,
                createdAt: isEdit ? (await getDoc(doc(db, "products", productId))).data()?.createdAt || new Date().toISOString() : new Date().toISOString(),
                createdBy: isEdit ? (await getDoc(doc(db, "products", productId))).data()?.createdBy || user.uid : user.uid,
                updatedAt: new Date().toISOString(),
            };

            // Remove id before writing to Firestore
            const { id: _, ...dataToWrite } = productData;

            if (isEdit) {
                await updateDoc(doc(db, "products", productId), dataToWrite);

                // Check for low stock and send alert if needed
                checkAndAlertLowStock(productId, formData.stock).catch(err => {
                    console.error("Failed to check/send low stock alert:", err);
                });

                toast.success("Product updated successfully", { id: toastId });
            } else {
                await setDoc(doc(db, "products", productId), dataToWrite);
                toast.success("Product created successfully", { id: toastId });
            }

            navigate("/admin/products");
        } catch (error) {
            console.error("Error saving product:", error);
            toast.error("Failed to save product", { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { id: Date.now().toString(), name: "", options: [] }]
        }));
    };

    const removeVariant = (variantId: string) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter(v => v.id !== variantId)
        }));
    };

    const updateVariant = (variantId: string, field: 'name' | 'options', value: string | string[]) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map(v =>
                v.id === variantId ? { ...v, [field]: value } : v
            )
        }));
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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate("/admin/products")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEdit ? "Edit Product" : "Add Product"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isEdit ? "Update product details" : "Create a new product"}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={5}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="price">Price *</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="compareAtPrice">Compare at Price</Label>
                                        <Input
                                            id="compareAtPrice"
                                            type="number"
                                            step="0.01"
                                            value={formData.compareAtPrice || ""}
                                            onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-4 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full aspect-square object-cover rounded-lg"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <Label htmlFor="images" className="cursor-pointer">
                                        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">
                                                Click to upload or drag and drop
                                            </p>
                                        </div>
                                    </Label>
                                    <Input
                                        id="images"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Variants */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Variants</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                                        <Plus className="h-4 w-4 mr-2" /> Add Variant
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {formData.variants.map((variant) => (
                                    <div key={variant.id} className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Variant name (e.g., Size, Color)"
                                                value={variant.name}
                                                onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Options (comma-separated)"
                                                value={variant.options.join(", ")}
                                                onChange={(e) => updateVariant(variant.id, 'options', e.target.value.split(",").map(s => s.trim()))}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeVariant(variant.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {formData.variants.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No variants added. Click "Add Variant" to create size, color, or other options.
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Additional Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="specifications">Specifications</Label>
                                    <Textarea
                                        id="specifications"
                                        placeholder="Enter product specifications (e.g., Manufacturer: OEM, Condition: Brand New, Warranty: 1 Year)"
                                        value={formData.specifications || ""}
                                        onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                                        rows={4}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Each line will be displayed as a bullet point</p>
                                </div>

                                <div>
                                    <Label htmlFor="shippingInfo">Shipping Information</Label>
                                    <Textarea
                                        id="shippingInfo"
                                        placeholder="Enter shipping details (e.g., Ships within 24 hours. Nationwide delivery available.)"
                                        value={formData.shippingInfo || ""}
                                        onChange={(e) => setFormData({ ...formData, shippingInfo: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="status">Product Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="featured">Featured Product</Label>
                                    <Switch
                                        id="featured"
                                        checked={formData.featured}
                                        onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Organization */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Organization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="category">Category *</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.name}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                            {categories.length === 0 && (
                                                <SelectItem value="uncategorized" disabled>
                                                    No categories found
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <div className="mt-2 text-xs text-right">
                                        <a
                                            href="/admin/categories"
                                            target="_blank"
                                            className="text-primary hover:underline cursor-pointer"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.open('/admin/categories', '_blank');
                                            }}
                                        >
                                            Manage Categories
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="tags">Tags</Label>
                                    <Input
                                        id="tags"
                                        placeholder="Comma-separated"
                                        value={formData.tags.join(", ")}
                                        onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(",").map(s => s.trim()) })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Inventory */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Inventory</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="stock">Stock Quantity *</Label>
                                    <Input
                                        id="stock"
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <Button type="submit" disabled={submitting} className="w-full">
                                {submitting ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/admin/products")}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
