import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
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
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
    });

    const [markers, setMarkers] = useState<LocationMarker[]>([]);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<LocationMarker | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    useEffect(() => {
        if (!isLoaded || locations.length === 0) return;

        const geocodeLocations = async () => {
            try {
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
                        // Continue with other locations even if one fails
                    }
                }
                setMarkers(newMarkers);
            } catch (error) {
                console.error('Error in geocoding:', error);
                setError('Failed to load map locations');
            }
        };

        geocodeLocations();
    }, [isLoaded, JSON.stringify(locations)]);

    useEffect(() => {
        if (map && markers.length > 0) {
            try {
                const bounds = new google.maps.LatLngBounds();
                markers.forEach(marker => {
                    bounds.extend({ lat: marker.lat, lng: marker.lng });
                });
                map.fitBounds(bounds);

                // Adjust zoom if there's only one marker so we don't zoom in too much
                if (markers.length === 1) {
                    const listener = google.maps.event.addListener(map, "idle", () => {
                        if (map.getZoom()! > 15) map.setZoom(15);
                        google.maps.event.removeListener(listener);
                    });
                }
            } catch (error) {
                console.error('Error adjusting map bounds:', error);
            }
        }
    }, [map, markers]);

    // Error loading Google Maps API
    if (loadError) {
        return (
            <div className="h-[400px] w-full bg-muted/20 flex items-center justify-center rounded-lg border">
                <div className="text-center text-muted-foreground">
                    <p>Unable to load map</p>
                    <p className="text-sm mt-2">Please check your internet connection</p>
                </div>
            </div>
        );
    }

    // Internal error
    if (error) {
        return (
            <div className="h-[400px] w-full bg-muted/20 flex items-center justify-center rounded-lg border">
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

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
                        onClick={() => setSelectedMarker(marker)}
                    />
                ))}

                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="p-2 min-w-[200px]">
                            <h3 className="font-semibold text-sm mb-1">{selectedMarker.address}</h3>
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMarker.lat},${selectedMarker.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-2 font-medium"
                            >
                                Get Directions
                                <span aria-hidden="true">→</span>
                            </a>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
};

export default StoreMap;
