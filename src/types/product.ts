export interface ProductVariant {
    id: string;
    name: string; // e.g., "Size", "Color"
    options: string[]; // e.g., ["S", "M", "L"] or ["Red", "Blue"]
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    compareAtPrice?: number; // Original price for showing discounts
    category: string;
    images: string[]; // Array of image URLs from Firebase Storage
    variants: ProductVariant[];
    stock: number;
    sku: string; // Stock Keeping Unit
    status: 'active' | 'draft' | 'archived';
    featured: boolean;
    tags: string[];
    specifications?: string; // Additional product specifications (multiline)
    shippingInfo?: string; // Shipping/delivery information
    manufacturer?: string; // Product manufacturer or brand
    condition?: string; // Product condition (e.g., New, Used, Refurbished)
    createdAt: string;
    updatedAt: string;
    createdBy: string; // Admin UID
    views?: number;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    authorId: string;
    isPublished: boolean;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    views?: number;
}

export interface Review {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    rating: number; // 1-5
    comment: string;
    images?: string[]; // Array of image URLs from Firebase Storage
    createdAt: string;
    isVerifiedPurchase?: boolean;
    status?: 'pending' | 'approved' | 'rejected';
}

export interface WishlistItem {
    id: string;
    productId: string;
    userId?: string; // Optional for guest users
    addedAt: string;
}

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
