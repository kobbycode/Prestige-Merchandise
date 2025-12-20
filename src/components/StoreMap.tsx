import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Loader2 } from "lucide-react";

// Fix Leaflet default icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface StoreMapProps {
    locations: string[];
}

interface LocationMarker {
    address: string;
    lat: number;
    lng: number;
}

// Component to update map center when markers change
const MapUpdater = ({ markers }: { markers: LocationMarker[] }) => {
    const map = useMap();

    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [markers, map]);

    return null;
};

const StoreMap = ({ locations }: StoreMapProps) => {
    const [markers, setMarkers] = useState<LocationMarker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const geocodeLocations = async () => {
            setLoading(true);
            const newMarkers: LocationMarker[] = [];
            const uniqueLocations = [...new Set(locations.filter(Boolean))];

            // If no locations, default to Abossey Okai approximate center
            if (uniqueLocations.length === 0) {
                // Add a default fallback if needed, or just leave empty
            }

            for (const loc of uniqueLocations) {
                try {
                    // Using Nominatim for geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc + ", Ghana")}&limit=1`
                    );
                    const data = await response.json();

                    if (data && data.length > 0) {
                        newMarkers.push({
                            address: loc,
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon)
                        });
                    } else {
                        console.warn(`Could not geocode location: ${loc}`);
                        // Fallback logic could go here - e.g. try without ", Ghana" or hardcoded fallback
                        if (loc.toLowerCase().includes("abossey okai")) {
                            newMarkers.push({
                                address: loc,
                                lat: 5.5698,
                                lng: -0.2223
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error geocoding ${loc}:`, error);
                }
                // Rate limiting nicety
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            setMarkers(newMarkers);
            setLoading(false);
        };

        if (locations.length > 0) {
            geocodeLocations();
        } else {
            setLoading(false);
        }
    }, [JSON.stringify(locations)]);

    if (loading) {
        return (
            <div className="h-[400px] w-full bg-muted/20 flex items-center justify-center rounded-lg border">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading map...</p>
                </div>
            </div>
        );
    }

    if (markers.length === 0) {
        // Default view if no markers found (Accra)
        return (
            <div className="h-[400px] w-full rounded-lg border overflow-hidden">
                <MapContainer center={[5.6037, -0.1870]} zoom={13} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </MapContainer>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full rounded-lg border overflow-hidden z-0">
            <MapContainer center={[markers[0].lat, markers[0].lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker, idx) => (
                    <Marker key={idx} position={[marker.lat, marker.lng]}>
                        <Popup>
                            <div className="font-semibold text-sm">
                                {marker.address}
                            </div>
                        </Popup>
                    </Marker>
                ))}
                <MapUpdater markers={markers} />
            </MapContainer>
        </div>
    );
};

export default StoreMap;
