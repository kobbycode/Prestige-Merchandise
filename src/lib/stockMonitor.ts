import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { sendLowStockAlert } from './emailService';

// Define low stock threshold
const LOW_STOCK_THRESHOLD = 10;

// Track which products have already triggered alerts to avoid spam
const alertedProducts = new Set<string>();

/**
 * Checks if a product's stock is low and sends an alert email if needed
 * @param productId - The ID of the product to check
 * @param newStock - The new stock level
 * @returns Promise<void>
 */
export const checkAndAlertLowStock = async (
    productId: string,
    newStock: number
): Promise<void> => {
    try {
        // Only alert if stock is below threshold
        if (newStock > LOW_STOCK_THRESHOLD) {
            // If stock is replenished, remove from alerted set
            alertedProducts.delete(productId);
            return;
        }

        // Don't send duplicate alerts for the same product
        if (alertedProducts.has(productId)) {
            return;
        }

        // Fetch product details from Firestore
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (!productSnap.exists()) {
            console.error('Product not found for low stock alert:', productId);
            return;
        }

        const productData = {
            id: productSnap.id,
            ...productSnap.data(),
        };

        // Send low stock alert email
        const emailSent = await sendLowStockAlert(productData);

        if (emailSent) {
            // Mark this product as alerted to avoid spam
            alertedProducts.add(productId);
            console.log(`Low stock alert sent for product: ${productData.name}`);
        }
    } catch (error) {
        console.error('Error in checkAndAlertLowStock:', error);
    }
};

/**
 * Get the current low stock threshold
 * @returns number
 */
export const getLowStockThreshold = (): number => {
    return LOW_STOCK_THRESHOLD;
};

/**
 * Check if a stock level is considered low
 * @param stock - The stock level to check
 * @returns boolean
 */
export const isStockLow = (stock: number): boolean => {
    return stock <= LOW_STOCK_THRESHOLD;
};
