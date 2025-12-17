import { useState, useEffect } from "react";
import { getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, serverTimestamp, runTransaction, doc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { initEmailJS, sendOrderConfirmation } from "@/lib/emailService";
import { checkAndAlertLowStock } from "@/lib/stockMonitor";

const checkoutSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().regex(/^(0|\+233)[235][0-9]{8}$/, "Please enter a valid Ghanaian phone number (e.g., 0244123456)"),
    address: z.string().min(5, "Delivery address is required"),
    city: z.string().min(2, "City is required"),
    region: z.string().min(2, "Region is required"),
    notes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Add useLocation
    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CheckoutValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            address: "",
            city: "",
            region: "",
            notes: "",
        },
    });

    // Initialize EmailJS on component mount
    useState(() => {
        initEmailJS();
    });

    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

    // Restore form data from redirect if available
    useEffect(() => {
        if (location.state?.checkoutData) {
            const data = location.state.checkoutData;
            form.setValue("firstName", data.firstName);
            form.setValue("lastName", data.lastName);
            form.setValue("email", data.email);
            form.setValue("phone", data.phone);
            form.setValue("address", data.address);
            form.setValue("city", data.city);
            form.setValue("region", data.region);
            form.setValue("notes", data.notes || "");
        }
    }, [location.state, form]);

    // Fetch user details and addresses
    useEffect(() => {
        if (user) {
            // Pred-fill email if not already filled by checkoutData
            if (user.email && !form.getValues("email")) {
                form.setValue("email", user.email);
            }

            const fetchAddresses = async () => {
                try {
                    const q = query(
                        collection(db, "users", user.uid, "addresses"),
                        orderBy("createdAt", "desc")
                    );
                    const snapshot = await getDocs(q);
                    const addressList: any[] = [];
                    snapshot.forEach((doc) => {
                        addressList.push({ id: doc.id, ...doc.data() });
                    });
                    // Sort default first
                    addressList.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));

                    setSavedAddresses(addressList);

                    // Auto-fill default address ONLY if form is empty (don't overwrite persisted data)
                    const defaultAddr = addressList.find(a => a.isDefault);
                    if (defaultAddr && !form.getValues("firstName")) {
                        fillFormWithAddress(defaultAddr);
                    }
                } catch (error) {
                    console.error("Error fetching addresses", error);
                }
            };
            fetchAddresses();
        }
    }, [user, form]);

    const fillFormWithAddress = (addr: any) => {
        form.setValue("firstName", addr.firstName);
        form.setValue("lastName", addr.lastName);
        form.setValue("phone", addr.phone);
        form.setValue("address", addr.address);
        form.setValue("city", addr.city);
        form.setValue("region", addr.region);
    };

    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [pendingData, setPendingData] = useState<CheckoutValues | null>(null);

    const onSubmit = async (data: CheckoutValues) => {
        if (items.length === 0) {
            toast.error("Your cart is empty");
            navigate("/shop");
            return;
        }

        // Check if user is logged in
        if (!user) {
            setPendingData(data);
            setShowAuthDialog(true);
            return;
        }

        await processOrder(data);
    };

    const processOrder = async (data: CheckoutValues) => {
        setIsSubmitting(true);

        try {
            const orderData = {
                userId: user?.uid || "guest",
                customerDetails: data,
                items: items.map(item => ({
                    productId: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    variant: item.variant || null,
                    image: item.product.images[0] || null
                })),
                amount: cartTotal,
                status: "pending",
                paymentMethod: "cod", // Cash on Delivery
                createdAt: serverTimestamp(),
            };

            let orderId = "";

            // Use a transaction to ensure stock is available and update it atomically
            await runTransaction(db, async (transaction) => {
                // 1. Check stock for all items
                for (const item of items) {
                    const productRef = doc(db, "products", item.product.id);
                    const productDoc = await transaction.get(productRef);

                    if (!productDoc.exists()) {
                        throw new Error(`Product ${item.product.name} no longer exists.`);
                    }

                    const currentStock = productDoc.data().stock;
                    if (currentStock < item.quantity) {
                        throw new Error(`Insufficient stock for ${item.product.name}. Only ${currentStock} left.`);
                    }
                }

                // 2. Reduce stock
                // We need to fetch docs effectively for updates inside map
                const productRefs = items.map(item => doc(db, "products", item.product.id));
                const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

                // Check availability (double check within transaction context of bulk read)
                productDocs.forEach((doc, index) => {
                    if (!doc.exists()) {
                        throw new Error(`Product ${items[index].product.name} not found.`);
                    }
                    const stock = doc.data().stock;
                    if (stock < items[index].quantity) {
                        throw new Error(`Insufficient stock for ${items[index].product.name}. Available: ${stock}`);
                    }
                });


                // Deduct stock
                items.forEach((item, index) => {
                    const newStock = productDocs[index].data().stock - item.quantity;
                    transaction.update(productRefs[index], { stock: newStock });
                });

                // Create Order
                const newOrderRef = doc(collection(db, "orders"));
                orderId = newOrderRef.id;
                transaction.set(newOrderRef, { ...orderData, id: orderId });
            });


            // Post-transaction actions (Non-blocking)

            // 1. Send Order Confirmation Email
            if (orderId) {
                sendOrderConfirmation(
                    { ...orderData, orderId: orderId },
                    data.email
                ).catch(err => console.error("Failed to send confirmation email:", err));

                // 2. Notify Customer (only if they're not an admin)
                if (user?.uid) {
                    try {
                        const adminDocRef = doc(db, "admins", user.uid);
                        const adminDoc = await getDoc(adminDocRef);

                        if (!adminDoc.exists()) {
                            await addDoc(collection(db, "notifications"), {
                                userId: user.uid,
                                type: "new_order",
                                title: "Order Placed Successfully",
                                message: `Your order #${orderId.slice(0, 8)} has been placed and is being processed.`,
                                read: false,
                                createdAt: serverTimestamp(),
                                data: { orderId: orderId },
                                link: `/account/orders/${orderId}`
                            });
                        }
                    } catch (error) {
                        console.error("Failed to create customer notification:", error);
                    }
                }

                // 3. Notify Admins (Role-based)
                try {
                    await addDoc(collection(db, "notifications"), {
                        recipientRole: "admin",
                        type: "new_order",
                        title: "New Order",
                        message: `New order #${orderId.slice(0, 8)} from ${data.firstName} ${data.lastName}`,
                        read: false,
                        createdAt: serverTimestamp(),
                        data: { orderId: orderId },
                        link: `/admin/orders/${orderId}`
                    });
                } catch (error) {
                    console.error("Failed to notify admins:", error);
                }
            }


            // 2. Check Low Stock Levels and Alert Admin
            items.forEach(async (item) => {
                try {
                    const productRef = doc(db, "products", item.product.id);
                    const snap = await import("firebase/firestore").then(m => m.getDoc(productRef));
                    if (snap.exists()) {
                        const currentStock = snap.data().stock;
                        checkAndAlertLowStock(item.product.id, currentStock);
                    }
                } catch (e) {
                    console.error("Error monitoring stock:", e);
                }
            });

            clearCart();
            toast.success("Order placed successfully!");
            navigate("/", { state: { orderId: orderId, success: true } });

        } catch (error: any) {
            console.error("Error placing order:", error);
            toast.error(error.message || "Failed to place order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAuthRedirect = () => {
        if (pendingData) {
            navigate("/register", {
                state: {
                    email: pendingData.email,
                    checkoutData: pendingData
                }
            });
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
                    <Button onClick={() => navigate("/shop")}>Return to Shop</Button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 bg-muted/30">
                <div className="container mx-auto px-4 py-8">
                    <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate(-1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    <h1 className="text-3xl font-bold mb-8">Checkout</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Checkout Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shipping Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                                            {/* Saved Addresses Selector */}
                                            {user && savedAddresses.length > 0 && (
                                                <div className="mb-6 p-4 border rounded-lg bg-muted/30">
                                                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                                        Load from Address Book
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {savedAddresses.map((addr) => (
                                                            <Button
                                                                key={addr.id}
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-auto py-2 px-3 text-left flex flex-col items-start gap-1"
                                                                onClick={() => {
                                                                    fillFormWithAddress(addr);
                                                                    toast.success("Address loaded");
                                                                }}
                                                            >
                                                                <div className="font-semibold text-xs flex items-center gap-2">
                                                                    {addr.firstName} {addr.lastName}
                                                                    {addr.isDefault && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded">Default</span>}
                                                                </div>
                                                                <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                                                                    {addr.address}, {addr.city}
                                                                </div>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="firstName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>First Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Daniel" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="lastName"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Last Name</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Mensah" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email</FormLabel>
                                                        <FormControl>
                                                            <Input type="email" placeholder="daniel.mensah@example.com" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="phone"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Phone Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="024 XXX XXXX" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="address"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Delivery Address</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Street name, landmark..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="city"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>City</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Accra" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="region"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Region</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Greater Accra" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="notes"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Order Notes (Optional)</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Any special instructions..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Method</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-secondary/10 border-primary/20">
                                        <ShieldCheck className="h-6 w-6 text-primary" />
                                        <div>
                                            <p className="font-semibold">Cash on Delivery</p>
                                            <p className="text-sm text-muted-foreground">Pay when your items are delivered.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-24">
                                <CardHeader>
                                    <CardTitle>Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="max-h-[300px] overflow-auto space-y-3 pr-2">
                                        {items.map((item) => (
                                            <div key={item.id} className="flex gap-3 text-sm">
                                                <div className="h-12 w-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                                                    {item.product.images[0] && <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium line-clamp-1">{item.product.name}</p>
                                                    <p className="text-muted-foreground text-xs">Qty: {item.quantity} {item.variant && `• ${item.variant}`}</p>
                                                </div>
                                                <p className="font-medium">GH₵ {(item.product.price * item.quantity).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>GH₵ {cartTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span className="text-muted-foreground text-xs italic">Calculated at delivery</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>GH₵ {cartTotal.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={form.handleSubmit(onSubmit)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Place Order"
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

            <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Account Required for Tracking</AlertDialogTitle>
                        <AlertDialogDescription>
                            In order to track your order progress, kindly sign in or register an account. It only takes a moment!
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleAuthRedirect}>Ok</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Checkout;
