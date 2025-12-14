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
    createdAt: string;
    updatedAt: string;
    createdBy: string; // Admin UID
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    createdAt: string;
}

export type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
