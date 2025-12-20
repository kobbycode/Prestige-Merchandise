import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useJsApiLoader, Libraries } from "@react-google-maps/api";
import { db } from "@/lib/firebase";
import { StoreSettings } from "@/types/settings";

interface StoreSettingsContextType {
    settings: StoreSettings;
    loading: boolean;
}

const defaultSettings: StoreSettings = {
    facebookUrl: "",
    whatsappNumber: "0247654321", // Default from footer
    location: "Abossey Okai- Former Odasani Hotel, HQ68+PRH, Accra, Ghana",
    locations: [
        "Abossey Okai- Former Odasani Hotel, HQ68+PRH, Accra, Ghana",
        "Kasoa Amanfro- Pink FM, Accra - Cape Coast Rd, Kasoa, Ghana"
    ],
    storeLocations: [], // Will be populated by geocoding
    phone: "054 123 4567",
    email: "sales@prestigemerchgh.com",
    businessHours: {
        monSat: "8am - 6pm",
        sunday: "Closed"
    },
    menuItems: [
        { label: "Home", path: "/", active: true },
        { label: "Steering Systems", path: "/shop?category=steering", active: true },
        { label: "Services", path: "/services", active: true },
        { label: "Parts", path: "/parts", active: true },
        { label: "Fleet Solutions", path: "/fleet-solutions", active: true },
        { label: "About", path: "/about", active: true },
        { label: "Book Diagnosis", path: "/contact", active: true }
    ]
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);

    const [libraries] = useState<Libraries>(['places']);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    useEffect(() => {
        setLoading(true);
        const docRef = doc(db, "settings", "general");

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as StoreSettings;

                // Set initial settings from Firestore
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    businessHours: {
                        ...prev.businessHours,
                        ...data.businessHours
                    }
                }));
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching store settings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Geocode locations when settings.locations changes and map is loaded
    useEffect(() => {
        if (!isLoaded || !settings.locations || settings.locations.length === 0) return;

        const geocodeLocations = async () => {
            const geocoder = new google.maps.Geocoder();
            const newStoreLocations: any[] = [];
            const uniqueLocations = [...new Set(settings.locations?.filter(Boolean))];

            await Promise.all(uniqueLocations.map(async (loc, index) => {
                try {
                    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                        geocoder.geocode({ address: loc + ", Ghana" }, (results, status) => {
                            if (status === "OK" && results) {
                                resolve(results);
                            } else {
                                reject(status);
                            }
                        });
                    });

                    if (result && result.length > 0) {
                        const location = result[0].geometry.location;
                        newStoreLocations.push({
                            id: `store-${index}`,
                            name: loc, // Use the address string as the name for now
                            address: result[0].formatted_address,
                            coordinates: {
                                latitude: location.lat(),
                                longitude: location.lng()
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error geocoding ${loc}:`, error);
                }
            }));

            // Only update if we actually found something and it's different (shallow check length)
            if (newStoreLocations.length > 0) {
                setSettings(prev => ({
                    ...prev,
                    storeLocations: newStoreLocations
                }));
            }
        };

        // Debounce slightly to avoid rapid updates if settings change fast
        const timeoutId = setTimeout(() => {
            geocodeLocations();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [isLoaded, JSON.stringify(settings.locations)]);

    return (
        <StoreSettingsContext.Provider value={{ settings, loading }}>
            {children}
        </StoreSettingsContext.Provider>
    );
};

export const useStoreSettings = () => {
    const context = useContext(StoreSettingsContext);
    if (context === undefined) {
        throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
    }
    return context;
};
