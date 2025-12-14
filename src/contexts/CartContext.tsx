import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types/product";
import { toast } from "sonner";

export interface CartItem {
    id: string; // Composite ID: productId + variant
    product: Product;
    variant?: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity: number, variant?: string) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (error) {
                console.error("Failed to parse cart data:", error);
            }
        }
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(items));
    }, [items]);

    const addToCart = (product: Product, quantity: number, variant?: string) => {
        const itemId = variant ? `${product.id}-${variant}` : product.id;
        let isUpdate = false;

        setItems((prevItems) => {
            const existingItem = prevItems.find((item) => item.id === itemId);

            if (existingItem) {
                isUpdate = true;
                return prevItems.map((item) =>
                    item.id === itemId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prevItems, { id: itemId, product, quantity, variant }];
            }
        });

        // Side effects outside of setState
        // We use a timeout to let the state update cycle finish regarding the 'isUpdate' flag logic which we can't easily capture 
        // entirely synchronously without lifting state. 
        // ERROR: The above 'isUpdate' variable will not work as expected because setItems is async relative to the flag logic if we were checking inside.
        // Actually, we can just assume success since we are optimistically updating.
        // But to be precise about message:

        // However, since we can't know for sure inside the setter if it was an update or new add without checking *before* set call,
        // let's check current items first. 
        // Note: 'items' from closure might be stale if multiple updates happen rapidly, but for addToCart it's usually fine.
        // Better approach:
        const exists = items.some(item => item.id === itemId);
        if (exists) {
            toast.success("Updated quantity in cart");
        } else {
            toast.success("Added to cart");
        }
        setIsCartOpen(true);
    };

    const removeFromCart = (itemId: string) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
        toast.success("Removed from cart");
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        setItems((prevItems) =>
            prevItems.map((item) =>
                item.id === itemId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        toast.info("Cart cleared");
    };

    const cartTotal = items.reduce(
        (total, item) => total + item.product.price * item.quantity,
        0
    );

    const cartCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
