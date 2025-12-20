import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

interface StoreMapProps {
    locations: string[];
}

interface LocationMarker {
    address: string;
    lat: number;
    lng: number;
}

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 5.6037,
    lng: -0.1870
};

const StoreMap = ({ locations }: StoreMapProps) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
    });

    const [markers, setMarkers] = useState<LocationMarker[]>([]);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    useEffect(() => {
        if (!isLoaded || locations.length === 0) return;

        const geocodeLocations = async () => {
            const geocoder = new google.maps.Geocoder();
            const newMarkers: LocationMarker[] = [];
            const uniqueLocations = [...new Set(locations.filter(Boolean))];

            for (const loc of uniqueLocations) {
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
                        newMarkers.push({
                            address: loc,
                            lat: location.lat(),
                            lng: location.lng()
                        });
                    }
                } catch (error) {
                    console.error(`Error geocoding ${loc}:`, error);
                }
            }
            setMarkers(newMarkers);
        };

        geocodeLocations();
    }, [isLoaded, JSON.stringify(locations)]);

    useEffect(() => {
        if (map && markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach(marker => {
                bounds.extend({ lat: marker.lat, lng: marker.lng });
            });
            map.fitBounds(bounds);

            // Adjust zoom if there's only one marker so we don't zoom in too much
            if (markers.length === 1) {
                // Short timeout to allow fitBounds to finish before ensuring max zoom isn't too close
                // But fitBounds usually handles it. If not, listener:
                const listener = google.maps.event.addListener(map, "idle", () => {
                    if (map.getZoom()! > 15) map.setZoom(15);
                    google.maps.event.removeListener(listener);
                });
            }
        }
    }, [map, markers]);

    if (!isLoaded) {
        return (
            <div className="h-[400px] w-full bg-muted/20 flex items-center justify-center rounded-lg border">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading Google Map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full rounded-lg border overflow-hidden">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                }}
            >
                {markers.map((marker, idx) => (
                    <Marker
                        key={idx}
                        position={{ lat: marker.lat, lng: marker.lng }}
                        title={marker.address}
                    />
                ))}
            </GoogleMap>
        </div>
    );
};

export default StoreMap;
