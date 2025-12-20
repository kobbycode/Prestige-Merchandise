import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StoreSettings } from "@/types/settings";

interface StoreSettingsContextType {
    settings: StoreSettings;
    loading: boolean;
}

const defaultSettings: StoreSettings = {
    facebookUrl: "",
    whatsappNumber: "0247654321", // Default from footer
    location: "Abossey Okai, Near Total Filling Station",
    storeLocations: [
        {
            id: "abossey-okai",
            name: "Abossey Okai (Main Branch)",
            address: "Near Total Filling Station, Abossey Okai",
            coordinates: { latitude: 5.5600, longitude: -0.2200 } // Approx coords
        },
        {
            id: "north-industrial",
            name: "North Industrial Area (Warehouse)",
            address: "Plot 22, North Industrial Area, Accra",
            coordinates: { latitude: 5.5800, longitude: -0.2050 } // Approx coords
        }
    ],
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

    useEffect(() => {
        setLoading(true);
        const docRef = doc(db, "settings", "general");

        // Use onSnapshot for real-time updates across the app
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as StoreSettings;
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
