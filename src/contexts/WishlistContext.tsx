import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { WishlistItem } from "@/types/product";
import { toast } from "sonner";

const STORAGE_KEY = "wishlist";

interface WishlistContextType {
    items: WishlistItem[];
    loading: boolean;
    addToWishlist: (productId: string) => void;
    removeFromWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    clearWishlist: () => void;
    wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load from localStorage for guests
    const loadFromStorage = useCallback(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved) as WishlistItem[];
            } catch (error) {
                console.error("Failed to parse wishlist data:", error);
            }
        }
        return [];
    }, []);

    // Save to localStorage
    const saveToStorage = useCallback((wishlistItems: WishlistItem[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
    }, []);

    // Merge guest wishlist into user's Firestore wishlist on login
    const mergeGuestWishlist = useCallback(async (userId: string, guestItems: WishlistItem[]) => {
        if (guestItems.length === 0) return;

        const batch = writeBatch(db);
        guestItems.forEach((item) => {
            const docRef = doc(db, "wishlists", userId, "items", item.productId);
            batch.set(docRef, {
                productId: item.productId,
                userId: userId,
                addedAt: item.addedAt,
            });
        });

        try {
            await batch.commit();
            // Clear localStorage after merge
            localStorage.removeItem(STORAGE_KEY);
            toast.success("Your wishlist has been synced to your account");
        } catch (error) {
            console.error("Failed to merge guest wishlist:", error);
        }
    }, []);

    // Effect for handling auth state changes and loading wishlist
    useEffect(() => {
        if (isAuthenticated && user) {
            // Load from Firestore for logged-in users
            const itemsRef = collection(db, "wishlists", user.uid, "items");
            const unsubscribe = onSnapshot(
                itemsRef,
                (snapshot) => {
                    const firestoreItems: WishlistItem[] = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        productId: doc.data().productId,
                        userId: doc.data().userId,
                        addedAt: doc.data().addedAt,
                    }));

                    // Check for guest items to merge
                    const guestItems = loadFromStorage();
                    if (guestItems.length > 0) {
                        // Filter out items that already exist in Firestore
                        const newItems = guestItems.filter(
                            (guestItem) => !firestoreItems.some((fsItem) => fsItem.productId === guestItem.productId)
                        );
                        if (newItems.length > 0) {
                            mergeGuestWishlist(user.uid, newItems);
                        } else {
                            localStorage.removeItem(STORAGE_KEY);
                        }
                    }

                    setItems(firestoreItems);
                    setLoading(false);
                },
                (error) => {
                    console.error("Wishlist Firestore error:", error);
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } else {
            // Guest user: load from localStorage
            const guestItems = loadFromStorage();
            setItems(guestItems);
            setLoading(false);
        }
    }, [isAuthenticated, user, loadFromStorage, mergeGuestWishlist]);

    // Save to localStorage when items change (for guests only)
    useEffect(() => {
        if (!isAuthenticated) {
            saveToStorage(items);
        }
    }, [items, isAuthenticated, saveToStorage]);

    const addToWishlist = useCallback(
        async (productId: string) => {
            // Check if already in wishlist
            if (items.some((item) => item.productId === productId)) {
                toast.info("Already in your wishlist");
                return;
            }

            const newItem: WishlistItem = {
                id: productId,
                productId,
                userId: user?.uid,
                addedAt: new Date().toISOString(),
            };

            if (isAuthenticated && user) {
                // Save to Firestore
                try {
                    await setDoc(doc(db, "wishlists", user.uid, "items", productId), newItem);
                    toast.success("Added to wishlist");
                } catch (error) {
                    console.error("Failed to add to wishlist:", error);
                    toast.error("Failed to add to wishlist");
                }
            } else {
                // Save to local state (will be persisted via effect)
                setItems((prev) => [...prev, newItem]);
                toast.success("Added to wishlist");
            }
        },
        [items, isAuthenticated, user]
    );

    const removeFromWishlist = useCallback(
        async (productId: string) => {
            if (isAuthenticated && user) {
                // Remove from Firestore
                try {
                    await deleteDoc(doc(db, "wishlists", user.uid, "items", productId));
                    toast.success("Removed from wishlist");
                } catch (error) {
                    console.error("Failed to remove from wishlist:", error);
                    toast.error("Failed to remove from wishlist");
                }
            } else {
                // Remove from local state
                setItems((prev) => prev.filter((item) => item.productId !== productId));
                toast.success("Removed from wishlist");
            }
        },
        [isAuthenticated, user]
    );

    const isInWishlist = useCallback(
        (productId: string) => {
            return items.some((item) => item.productId === productId);
        },
        [items]
    );

    const clearWishlist = useCallback(async () => {
        if (isAuthenticated && user) {
            // Clear from Firestore
            const batch = writeBatch(db);
            items.forEach((item) => {
                batch.delete(doc(db, "wishlists", user.uid, "items", item.productId));
            });
            try {
                await batch.commit();
                toast.info("Wishlist cleared");
            } catch (error) {
                console.error("Failed to clear wishlist:", error);
                toast.error("Failed to clear wishlist");
            }
        } else {
            setItems([]);
            localStorage.removeItem(STORAGE_KEY);
            toast.info("Wishlist cleared");
        }
    }, [isAuthenticated, user, items]);

    const wishlistCount = items.length;

    return (
        <WishlistContext.Provider
            value={{
                items,
                loading,
                addToWishlist,
                removeFromWishlist,
                isInWishlist,
                clearWishlist,
                wishlistCount,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error("useWishlist must be used within a WishlistProvider");
    }
    return context;
};
