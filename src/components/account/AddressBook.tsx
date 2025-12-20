import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Address } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Plus, Trash2, Edit, Check, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const AddressBook = () => {
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        region: "",
        isDefault: false
    });

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const fetchAddresses = async () => {
        try {
            const q = query(
                collection(db, "users", user!.uid, "addresses"),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);
            const addressList: Address[] = [];
            snapshot.forEach((doc) => {
                addressList.push({ id: doc.id, ...doc.data() } as Address);
            });
            // Sort: default first
            addressList.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
            setAddresses(addressList);
        } catch (error) {
            console.error("Error fetching addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (address?: Address) => {
        if (address) {
            setEditingAddress(address);
            setFormData({
                firstName: address.firstName,
                lastName: address.lastName,
                phone: address.phone,
                address: address.address,
                city: address.city,
                region: address.region,
                isDefault: address.isDefault
            });
        } else {
            setEditingAddress(null);
            setFormData({
                firstName: "",
                lastName: "",
                phone: "",
                address: "",
                city: "",
                region: "",
                isDefault: addresses.length === 0 // First address is default by default
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const addressData = {
                ...formData,
                type: 'shipping',
                updatedAt: serverTimestamp()
            };

            // If setting as default, unset others // (Ideally use a transaction/batch but sequential is okay here for now)
            if (formData.isDefault && addresses.length > 0) {
                const batch = writeBatch(db);
                addresses.forEach(addr => {
                    if (addr.isDefault && addr.id !== editingAddress?.id) {
                        batch.update(doc(db, "users", user!.uid, "addresses", addr.id), { isDefault: false });
                    }
                });
                await batch.commit();
            }

            if (editingAddress) {
                await updateDoc(doc(db, "users", user!.uid, "addresses", editingAddress.id), addressData);
                toast.success("Address updated");
            } else {
                await addDoc(collection(db, "users", user!.uid, "addresses"), {
                    ...addressData,
                    createdAt: serverTimestamp()
                });
                toast.success("Address added");
            }

            setIsDialogOpen(false);
            fetchAddresses();
        } catch (error) {
            console.error("Error saving address:", error);
            toast.error("Failed to save address");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await deleteDoc(doc(db, "users", user!.uid, "addresses", id));
            toast.success("Address deleted");
            fetchAddresses();
        } catch (error) {
            toast.error("Failed to delete address");
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const batch = writeBatch(db);
            // Unset all
            addresses.forEach(addr => {
                if (addr.isDefault) {
                    batch.update(doc(db, "users", user!.uid, "addresses", addr.id), { isDefault: false });
                }
            });
            // Set new default
            batch.update(doc(db, "users", user!.uid, "addresses", id), { isDefault: true });

            await batch.commit();
            toast.success("Default address updated");
            fetchAddresses();
        } catch (error) {
            console.error("Error setting default:", error);
            toast.error("Failed to set default address");
            toast.error("Failed to set default address");
        }
    };

    const [isDetectingLocation, setIsDetectingLocation] = useState(false);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setIsDetectingLocation(true);
        toast.info("Detecting your location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Using OpenStreetMap Nominatim for free reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();

                    if (data && data.display_name) {
                        // Update form data state
                        const addr = data.address;

                        setFormData(prev => ({
                            ...prev,
                            address: data.display_name,
                            city: (addr.city || addr.town || addr.village || addr.suburb || prev.city),
                            region: (addr.state || addr.region || addr.county || prev.region)
                        }));

                        toast.success("Location detected and address updated");
                    } else {
                        toast.error("Could not determine address details");
                    }
                } catch (error) {
                    console.error("Error geocoding:", error);
                    toast.error("Failed to fetch address details. Please type manually.");
                } finally {
                    setIsDetectingLocation(false);
                }
            },
            (error) => {
                console.error("Error detecting location:", error);
                let msg = "Failed to detect location";
                if (error.code === 1) msg = "Location permission denied";
                if (error.code === 2) msg = "Location unavailable";
                if (error.code === 3) msg = "Location request timed out";
                toast.error(msg);
                setIsDetectingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    if (loading && addresses.length === 0) {
        return <div className="py-8 text-center text-muted-foreground">Loading addresses...</div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Address Book
                    </CardTitle>
                    <CardDescription>Manage your shipping addresses</CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                </Button>
            </CardHeader>
            <CardContent>
                {addresses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <MapPin className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p>No addresses saved yet.</p>
                        <Button variant="link" onClick={() => handleOpenDialog()}>Add your first address</Button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {addresses.map((addr) => (
                            <div key={addr.id} className={`relative p-4 rounded-lg border ${addr.isDefault ? 'border-primary ring-1 ring-primary/10 bg-primary/5' : 'bg-card'}`}>
                                {addr.isDefault && (
                                    <Badge className="absolute top-2 right-2" variant="secondary">Default</Badge>
                                )}
                                <div className="font-semibold mb-1">{addr.firstName} {addr.lastName}</div>
                                <div className="text-sm text-muted-foreground mb-1">{addr.phone}</div>
                                <div className="text-sm">{addr.address}</div>
                                <div className="text-sm mb-3">{addr.city}, {addr.region}</div>

                                <div className="flex gap-2 mt-auto">
                                    <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => handleOpenDialog(addr)}>
                                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                    </Button>
                                    {!addr.isDefault && (
                                        <Button variant="ghost" size="sm" className="h-8" onClick={() => handleSetDefault(addr.id)} title="Set as Default">
                                            <Star className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(addr.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                        <DialogDescription>
                            {editingAddress ? "Update your shipping details." : "Add a new shipping address to your account."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="020..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Street Address</Label>
                            <div className="relative">
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    required
                                    placeholder="House No, Street Name"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={detectLocation}
                                    disabled={isDetectingLocation}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                    title="Use my current location"
                                >
                                    {isDetectingLocation ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <MapPin className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="region">Region</Label>
                                <Input id="region" value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} required />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={formData.isDefault}
                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                            />
                            <Label htmlFor="isDefault">Set as default address</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Address"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default AddressBook;
