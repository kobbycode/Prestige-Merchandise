import { useState, useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { toast } from "sonner";
import { Libraries } from "@react-google-maps/api";

interface LocationResult {
    address: string;
    city: string;
    region: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

const libraries: Libraries = ['places'];

export const useGoogleGeocoding = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const [isDetecting, setIsDetecting] = useState(false);

    const detectLocation = useCallback(async (): Promise<LocationResult | null> => {
        if (!isLoaded) {
            toast.error("Google Maps API is still loading. Please try again in a moment.");
            return null;
        }

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return null;
        }

        setIsDetecting(true);
        toast.info("Detecting your location...");

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    try {
                        const geocoder = new google.maps.Geocoder();
                        const response = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });

                        if (response.results && response.results[0]) {
                            const result = response.results[0];
                            const addressComponents = result.address_components;

                            // Extract components
                            let city = "";
                            let region = "";

                            for (const component of addressComponents) {
                                const types = component.types;
                                if (types.includes("locality")) {
                                    city = component.long_name;
                                } else if (!city && types.includes("administrative_area_level_2")) {
                                    city = component.long_name; // Fallback for city
                                }

                                if (types.includes("administrative_area_level_1")) {
                                    region = component.long_name;
                                }
                            }

                            // Formatted address
                            const formattedAddress = result.formatted_address;

                            toast.success("Location detected successfully");
                            resolve({
                                address: formattedAddress,
                                city,
                                region,
                                coordinates: { latitude, longitude }
                            });
                        } else {
                            toast.error("Could not determine address from coordinates");
                            resolve(null);
                        }
                    } catch (error) {
                        console.error("Geocoding error:", error);
                        toast.error("Failed to decode location address");
                        resolve(null);
                    } finally {
                        setIsDetecting(false);
                    }
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    let msg = "Failed to detect location";
                    if (error.code === 1) msg = "Location permission denied";
                    if (error.code === 2) msg = "Location unavailable";
                    if (error.code === 3) msg = "Location request timed out";
                    toast.error(msg);
                    setIsDetecting(false);
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    }, [isLoaded]);

    return { isLoaded, isDetecting, detectLocation };
};
