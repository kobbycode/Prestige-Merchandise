import { useState, useEffect } from "react";
import { getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
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
    phone: z.string().min(10, "Valid phone number is required"),
    address: z.string().min(5, "Delivery address is required"),
    city: z.string().min(2, "City is required"),
    region: z.string().min(2, "Region is required"),
    notes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

const Checkout = () => {
    const navigate = useNavigate();
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

    // Fetch user details and addresses
    useEffect(() => {
        if (user) {
            // Pred-fill email
            if (user.email) {
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

                    // Auto-fill default address
                    const defaultAddr = addressList.find(a => a.isDefault);
                    if (defaultAddr) {
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

    const onSubmit = async (data: CheckoutValues) => {
        if (items.length === 0) {
            toast.error("Your cart is empty");
            navigate("/shop");
            return;
        }

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
                for (const item of items) {
                    const productRef = doc(db, "products", item.product.id);
                    // We need to read again or if we read above we can use that data, but inside transaction 
                    // reading multiple times is fine or we can optimize. simple read again is cleaner code for now.
                    // Actually we can't reuse the doc snapshot easily for update unless we passed it.
                    // But standard pattern is read then write.
                    // Since we read all first to validate, we can now write all.
                    // Note: Firestore requires all reads before any writes.

                    // Optimization: We can just use increment(-quantity) without reading IF we didn't care about negative stock,
                    // but we DO care. So the read loop above is correct.
                    // Now we perform writes.

                    // We need to calculate new stock to set it precisely? 
                    // No, invalidation logic is handled by the transaction lock.
                    // We can use increment, OR calculate from the read value. 
                    // Let's re-read to be safe? No, transaction snapshot is consistent.
                    // IMPORTANT: Firestore transactions failing if you read after write?
                    // "All reads must happen before any writes."

                    // So we must have read everything in step 1.
                    // In step 2 we calculate new values based on what we read?
                    // But we didn't store the snapshots. Let's modify approach to store snapshots.
                    // Actually, simple standard way for e-commerce:

                    // Re-implement loop to Read AND modify in memory, then commit? No.
                    // Standard:
                    // Loop items: Read stock. Check.
                    // Loop items: Update stock.
                    // But we can't read then write then read then write.
                    // We must Read Item 1, Read Item 2...
                    // Then Write Item 1, Write Item 2...
                }

                // Let's redo correctly:
                const productRefs = items.map(item => doc(db, "products", item.product.id));
                const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

                // Check availability
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
                transaction.set(newOrderRef, { ...orderData, id: orderId }); // Ensure ID is in data if needed, or just rely on doc ID
            });


            // Post-transaction actions (Non-blocking)

            // 1. Send Order Confirmation Email
            if (orderId) {
                // We used set with a generated ref, so we have the ID.
                // orderData doesn't have the ID yet in the object passed to addDoc (which we replaced).
                sendOrderConfirmation(
                    { ...orderData, orderId: orderId }, // Use the actual ID
                    data.email
                ).catch(err => console.error("Failed to send confirmation email:", err));

                // 2. Notify Customer (only if they're not an admin)
                if (user?.uid) {
                    try {
                        // Check if the user is an admin
                        const adminDocRef = doc(db, "admins", user.uid);
                        const adminDoc = await getDoc(adminDocRef);

                        // Only send customer notification if user is NOT an admin
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
                            console.log("Customer notification created successfully");
                        }
                    } catch (error) {
                        console.error("Failed to create customer notification:", error);
                        toast.error("Order placed but notification failed");
                    }
                }

                // 3. Notify Admins
                try {
                    // Fetch all admins (including super_admin)
                    const adminsQuery = query(collection(db, "admins"));
                    const adminSnaps = await getDocs(adminsQuery);

                    const notificationPromises = adminSnaps.docs.map(adminDoc =>
                        addDoc(collection(db, "notifications"), {
                            userId: adminDoc.id,
                            type: "new_order",
                            title: "New Order",
                            message: `New order #${orderId.slice(0, 8)} from ${data.firstName} ${data.lastName}`,
                            read: false,
                            createdAt: serverTimestamp(),
                            data: { orderId: orderId },
                            link: `/admin/orders/${orderId}`
                        })
                    );
                    await Promise.all(notificationPromises);
                    console.log(`Admin notifications created for ${adminSnaps.docs.length} admins`);
                } catch (error) {
                    console.error("Failed to notify admins:", error);
                    toast.error("Order placed but admin notifications failed");
                }
            }


            // 2. Check Low Stock Levels and Alert Admin
            // We need to check the *new* stock levels.
            items.forEach(async (item) => {
                try {
                    // We can fetch the new stock or calculate it. 
                    // Fetching is safer to ensure we get the committed value.
                    // But getting it from DB is an extra read.
                    // Let's simply call our helper which fetches and checks.
                    // Note: This calls checkAndAlertLowStock which does a read effectively.
                    // Depending on implementation of checkAndAlertLowStock.
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
                                                                <Input placeholder="John" {...field} />
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
                                                                <Input placeholder="Doe" {...field} />
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
                                                            <Input type="email" placeholder="john.doe@example.com" {...field} />
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
        </div>
    );
};

export default Checkout;
