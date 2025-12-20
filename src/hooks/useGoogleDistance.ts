import { useCallback } from "react";
import { useJsApiLoader, Libraries } from "@react-google-maps/api";
import { toast } from "sonner";

const libraries: Libraries = ['places'];

interface Coordinates {
    latitude: number;
    longitude: number;
}

export const useGoogleDistance = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const calculateDrivingDistance = useCallback(async (origin: Coordinates, destination: Coordinates): Promise<number | null> => {
        if (!isLoaded) {
            console.warn("Google Maps API not loaded");
            return null;
        }

        const service = new google.maps.DistanceMatrixService();

        try {
            const response = await service.getDistanceMatrix({
                origins: [{ lat: origin.latitude, lng: origin.longitude }],
                destinations: [{ lat: destination.latitude, lng: destination.longitude }],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
            });

            if (response.rows && response.rows.length > 0) {
                const element = response.rows[0].elements[0];
                if (element.status === "OK" && element.distance) {
                    // localized distance text (e.g. "12 km") or value in meters
                    const distanceInMeters = element.distance.value;
                    const distanceInKm = distanceInMeters / 1000;
                    return distanceInKm;
                } else {
                    console.warn("Distance Matrix returned no results or error status:", element.status);
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error("Error calculating distance:", error);
            toast.error("Failed to calculate shipping distance");
            return null;
        }
    }, [isLoaded]);

    return { isLoaded, calculateDrivingDistance };
};
