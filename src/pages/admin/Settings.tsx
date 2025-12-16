import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Facebook, Phone, MapPin, Mail, Clock } from "lucide-react";
import { StoreSettings } from "@/types/settings";

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [settings, setSettings] = useState<StoreSettings>({
        facebookUrl: "",
        whatsappNumber: "0247654321",
        location: "Abossey Okai, Near Total Filling Station",
        phone: "054 123 4567",
        email: "sales@prestigemerchgh.com",
        businessHours: {
            monSat: "8am - 6pm",
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
                setSettings({
                    facebookUrl: data.facebookUrl || "",
                    whatsappNumber: data.whatsappNumber || "",
                    location: data.location || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    businessHours: {
                        monSat: data.businessHours?.monSat || "",
                        sunday: data.businessHours?.sunday || ""
                    }
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
            await setDoc(docRef, {
                ...settings,
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
                                <p className="text-xs text-muted-foreground">International format without '+'</p>
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

                        <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Location
                            </Label>
                            <Input
                                id="location"
                                placeholder="Abossey Okai, Near Total Filling Station"
                                value={settings.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                            />
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
                                    Mon - Sat
                                </Label>
                                <Input
                                    id="monSat"
                                    placeholder="8am - 6pm"
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
