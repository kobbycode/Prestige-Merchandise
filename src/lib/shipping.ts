
// Store Location (Default: Accra Mall area, user needs to update this)
export const STORE_LOCATION = {
    latitude: 5.6207,  // Example: Accra Mall Latitude
    longitude: -0.1732 // Example: Accra Mall Longitude
};

export const SHIPPING_RATES = {
    BASE_FEE: 20,      // GHS
    PER_KM_RATE: 2.5,  // GHS per km
    MIN_FEE: 20,       // Minimum shipping fee
    MAX_DISTANCE: 500  // specific limit?
};

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

/**
 * Calculates shipping fee based on distance.
 */
export const calculateShippingFee = (distanceInKm: number): number => {
    const fee = SHIPPING_RATES.BASE_FEE + (distanceInKm * SHIPPING_RATES.PER_KM_RATE);
    return Math.max(fee, SHIPPING_RATES.MIN_FEE);
};
