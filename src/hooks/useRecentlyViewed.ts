import { useState, useEffect } from "react";

const STORAGE_KEY = "recentlyViewedProducts";
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
    const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecentlyViewed(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Error loading recently viewed:", error);
        }
    }, []);

    // Save to localStorage whenever list changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed));
        } catch (error) {
            console.error("Error saving recently viewed:", error);
        }
    }, [recentlyViewed]);

    const addToRecentlyViewed = (productId: string) => {
        setRecentlyViewed((prev) => {
            // Remove if already exists (to move to front)
            const filtered = prev.filter((id) => id !== productId);
            // Add to front and limit to MAX_ITEMS
            return [productId, ...filtered].slice(0, MAX_ITEMS);
        });
    };

    const clearRecentlyViewed = () => {
        setRecentlyViewed([]);
    };

    return {
        recentlyViewed,
        addToRecentlyViewed,
        clearRecentlyViewed,
    };
}
