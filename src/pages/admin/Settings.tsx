import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Facebook, Phone } from "lucide-react";

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [facebookUrl, setFacebookUrl] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const docRef = doc(db, "settings", "general");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setFacebookUrl(data.facebookUrl || "");
                setWhatsappNumber(data.whatsappNumber || "");
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
                facebookUrl,
                whatsappNumber,
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
                <p className="text-muted-foreground">Manage your store's global configuration and social links</p>
            </div>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>Social Media & Contact</CardTitle>
                        <CardDescription>
                            Configure the links that appear on product pages for customer interaction
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="facebook" className="flex items-center gap-2">
                                <Facebook className="h-4 w-4 text-blue-600" />
                                Facebook Page URL
                            </Label>
                            <Input
                                id="facebook"
                                placeholder="https://facebook.com/your-page"
                                value={facebookUrl}
                                onChange={(e) => setFacebookUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                The link to your store's Facebook profile or page
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-green-600" />
                                WhatsApp Business Number
                            </Label>
                            <Input
                                id="whatsapp"
                                placeholder="233247654321"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter number in international format without '+' (e.g., 233...)
                            </p>
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
