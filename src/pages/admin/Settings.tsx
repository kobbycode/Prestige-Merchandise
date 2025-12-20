import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Facebook, Phone, MapPin, Mail, Clock, Trash2, Plus, Link as LinkIcon } from "lucide-react";
import { StoreSettings } from "@/types/settings";

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [settings, setSettings] = useState<StoreSettings>({
        facebookUrl: "",
        whatsappNumber: "0247654321",
        locations: [
            "Abossey Okai- Former Odasani Hotel, HQ68+PRH, Accra, Ghana",
            "Kasoa Amanfro- Pink FM, Accra - Cape Coast Rd, Kasoa, Ghana"
        ],
        location: "Abossey Okai- Former Odasani Hotel, HQ68+PRH, Accra, Ghana",
        phone: "054 123 4567",
        email: "sales@prestigemerchgh.com",
        businessHours: {
            monSat: "8am to 6pm",
            sunday: "Closed"
        }
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "settings", "general");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as StoreSettings;

                // Migration: If locations array is missing but legacy location string exists, split it
                let locations = data.locations || [];
                if (locations.length === 0 && data.location) {
                    locations = data.location.split('/').map(l => l.trim()).filter(Boolean);
                }

                // Fallback default if absolutely nothing exists
                if (locations.length === 0) {
                    locations = ["Abossey Okai, Near Total Filling Station"];
                }

                setSettings({
                    facebookUrl: data.facebookUrl || "",
                    whatsappNumber: data.whatsappNumber || "",
                    locations: locations,
                    location: data.location || "", // Keep for reference
                    phone: data.phone || "",
                    email: data.email || "",
                    businessHours: {
                        monSat: data.businessHours?.monSat || "",
                        sunday: data.businessHours?.sunday || ""
                    },
                    menuItems: data.menuItems || [
                        { label: "Home", path: "/", active: true },
                        { label: "Steering Systems", path: "/shop?category=steering", active: true },
                        { label: "Services", path: "/services", active: true },
                        { label: "Parts", path: "/parts", active: true },
                        { label: "Fleet Solutions", path: "/fleet-solutions", active: true },
                        { label: "About", path: "/about", active: true },
                        { label: "Book Diagnosis", path: "/contact", active: true }
                    ]
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const docRef = doc(db, "settings", "general");

            // Sync legacy field for backward compatibility
            const locationString = settings.locations?.join(' / ') || settings.location || "";

            await setDoc(docRef, {
                ...settings,
                location: locationString, // Update legacy field based on new array
                updatedAt: new Date().toISOString()
            }, { merge: true });

            toast.success("Settings saved successfully");
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof StoreSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleBusinessHoursChange = (field: 'monSat' | 'sunday', value: string) => {
        setSettings(prev => ({
            ...prev,
            businessHours: {
                ...prev.businessHours,
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Store Settings</h1>
                <p className="text-muted-foreground">Manage your store's global configuration, contact info, and business hours.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Navigation Menu */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="h-5 w-5" />
                            Navigation Menu
                        </CardTitle>
                        <CardDescription>
                            Customize the main navigation links displayed in the header.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            {(settings.menuItems || []).map((item, index) => (
                                <div key={index} className="flex gap-2 items-start p-3 bg-muted/20 rounded-md border text-sm">
                                    <div className="grid gap-2 flex-1 sm:grid-cols-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Label</Label>
                                            <Input
                                                value={item.label}
                                                onChange={(e) => {
                                                    const newItems = [...(settings.menuItems || [])];
                                                    newItems[index] = { ...item, label: e.target.value };
                                                    setSettings(prev => ({ ...prev, menuItems: newItems }));
                                                }}
                                                placeholder="Link Name"
                                                className="h-8"
                                            />
                                        </div>
                                        <div className="space-y-1 sm:col-span-2">
                                            <Label className="text-xs text-muted-foreground">URL Path</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={item.path}
                                                    onChange={(e) => {
                                                        const newItems = [...(settings.menuItems || [])];
                                                        newItems[index] = { ...item, path: e.target.value };
                                                        setSettings(prev => ({ ...prev, menuItems: newItems }));
                                                    }}
                                                    placeholder="/path"
                                                    className="h-8"
                                                />
                                                <div className="flex bg-background border rounded-md h-8 items-center px-2 space-x-2 shrink-0">
                                                    <Label htmlFor={`active-${index}`} className="text-xs cursor-pointer select-none">Show</Label>
                                                    <input
                                                        type="checkbox"
                                                        id={`active-${index}`}
                                                        checked={item.active}
                                                        onChange={(e) => {
                                                            const newItems = [...(settings.menuItems || [])];
                                                            newItems[index] = { ...item, active: e.target.checked };
                                                            setSettings(prev => ({ ...prev, menuItems: newItems }));
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            const newItems = settings.menuItems?.filter((_, i) => i !== index);
                                            setSettings(prev => ({ ...prev, menuItems: newItems }));
                                        }}
                                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10 mt-6"
                                    >
                                        <span className="sr-only">Delete</span>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setSettings(prev => ({
                                    ...prev,
                                    menuItems: [...(prev.menuItems || []), { label: "New Link", path: "/", active: true }]
                                }))}
                                className="w-full border-dashed"
                            >
                                <Plus className="mr-2 h-3 w-3" />
                                Add Menu Item
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Social Media */}
                <Card>
                    <CardHeader>
                        <CardTitle>Social Media</CardTitle>
                        <CardDescription>
                            Configure social media links
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="facebook" className="flex items-center gap-2">
                                <Facebook className="h-4 w-4 text-blue-600" />
                                Facebook Page URL
                            </Label>
                            <Input
                                id="facebook"
                                placeholder="https://facebook.com/your-page"
                                value={settings.facebookUrl}
                                onChange={(e) => handleChange('facebookUrl', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-green-600" />
                                WhatsApp Number
                            </Label>
                            <Input
                                id="whatsapp"
                                placeholder="233247654321"
                                value={settings.whatsappNumber}
                                onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">International format without '+' (e.g., 233...)</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>
                            These details will be displayed in the website footer
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Phone Number
                                </Label>
                                <Input
                                    id="phone"
                                    placeholder="054 123 4567"
                                    value={settings.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                />
                            </div>

                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="sales@prestigemerchgh.com"
                                value={settings.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Locations
                            </Label>

                            <div className="space-y-3">
                                {settings.locations?.map((loc, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            value={loc}
                                            onChange={(e) => {
                                                const newLocations = [...(settings.locations || [])];
                                                newLocations[index] = e.target.value;
                                                setSettings(prev => ({ ...prev, locations: newLocations }));
                                            }}
                                            placeholder={`Location ${index + 1}`}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                const newLocations = settings.locations?.filter((_, i) => i !== index);
                                                setSettings(prev => ({ ...prev, locations: newLocations }));
                                            }}
                                            className="shrink-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                        >
                                            <span className="sr-only">Delete</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                                        </Button>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSettings(prev => ({
                                        ...prev,
                                        locations: [...(prev.locations || []), ""]
                                    }))}
                                    className="w-full border-dashed"
                                >
                                    + Add Another Location
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    Add multiple store locations. Use the first one for your main branch.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle>Business Hours</CardTitle>
                        <CardDescription>
                            Set your operating hours
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="monSat" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Mon to Sat
                                </Label>
                                <Input
                                    id="monSat"
                                    placeholder="8am to 6pm"
                                    value={settings.businessHours?.monSat}
                                    onChange={(e) => handleBusinessHoursChange('monSat', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sunday" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Sunday
                                </Label>
                                <Input
                                    id="sunday"
                                    placeholder="Closed"
                                    value={settings.businessHours?.sunday}
                                    onChange={(e) => handleBusinessHoursChange('sunday', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={saving} className="w-full md:w-auto">
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default Settings;
