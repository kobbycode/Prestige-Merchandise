import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface StoreSettings {
    facebookUrl: string;
    whatsappNumber: string;
}

export const useStoreSettings = () => {
    const [settings, setSettings] = useState<StoreSettings>({
        facebookUrl: "",
        whatsappNumber: ""
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "settings", "general");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setSettings(docSnap.data() as StoreSettings);
                }
            } catch (error) {
                console.error("Error fetching store settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { settings, loading };
};
