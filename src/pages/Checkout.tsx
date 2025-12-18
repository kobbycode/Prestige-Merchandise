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
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
import { Loader2, ArrowLeft, ShieldCheck, CreditCard, Banknote } from "lucide-react";
import { initEmailJS, sendOrderConfirmation } from "@/lib/emailService";
import { checkAndAlertLowStock } from "@/lib/stockMonitor";
import { usePaystackPayment } from "react-paystack";

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
    const { formatPrice, currency, exchangeRate, convertPrice } = useCurrency();
    const location = useLocation();
    const { items, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "paystack_momo" | "paystack_telecel" | "paystack_at" | "paystack_card">("cod");

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

    // Initialize EmailJS
    useState(() => {
        initEmailJS();
    });

    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

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

    useEffect(() => {
        if (user) {
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
                    addressList.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
                    setSavedAddresses(addressList);
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

    // Calculate total in GHS for Paystack (Paystack expects amount in pesewas)
    // If currency is USD, convert to GHS first
    const totalInGhs = currency === 'GHS' ? cartTotal : cartTotal * exchangeRate;
    const paystackAmount = Math.round(totalInGhs * 100);

    const getPaystackProvider = (method: string) => {
        switch (method) {
            case 'paystack_momo': return 'mtn';
            case 'paystack_telecel': return 'vod'; // Vodafone is now Telecel in Ghana
            case 'paystack_at': return 'atl'; // AirtelTigo is now AT
            default: return null;
        }
    };

    const getReadablePaymentMethod = (method: string) => {
        switch (method) {
            case 'cod': return 'Cash on Delivery';
            case 'paystack_momo': return 'MTN Mobile Money';
            case 'paystack_telecel': return 'Telecel Cash';
            case 'paystack_at': return 'AirtelTigo Money';
            case 'paystack_card': return 'Card Payment';
            default: return 'Online Payment';
        }
    };

    const paystackConfig = {
        reference: (new Date()).getTime().toString(),
        email: form.getValues("email"),
        amount: paystackAmount, // Amount is in kobo (pesewas)
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
        currency: 'GHS',
        channels: paymentMethod === 'paystack_card' ? ['card'] : ['mobile_money'],
        metadata: {
            custom_filters: {
                supported_mobile_money_providers: getPaystackProvider(paymentMethod) ? [getPaystackProvider(paymentMethod)] : ['mtn', 'vod', 'atl']
            },
            custom_fields: [
                {
                    display_name: "Mobile Number",
                    variable_name: "mobile_number",
                    value: form.getValues("phone").replace(/^\+233/, '0')
                },
                {
                    display_name: "Payment Method",
                    variable_name: "payment_method",
                    value: getReadablePaymentMethod(paymentMethod)
                }
            ]
        }
    };

    const initializePayment = usePaystackPayment(paystackConfig);

    const onSuccess = (reference: any) => {
        // Implementation for whatever you want to do with reference and after success call.
        console.log(reference);
        const data = form.getValues();
        processOrder(data, "prepaid", reference.reference);
    };

    const onClose = () => {
        toast.info("Payment cancelled");
        setIsSubmitting(false);
    };

    const onSubmit = async (data: CheckoutValues) => {
        if (items.length === 0) {
            toast.error("Your cart is empty");
            navigate("/shop");
            return;
        }

        if (!user) {
            setPendingData(data);
            setShowAuthDialog(true);
            return;
        }

        setIsSubmitting(true);

        if (paymentMethod.startsWith('paystack')) {
            // Check if key is present
            const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
            if (!paystackKey || paystackKey === 'your_paystack_public_key' || paystackKey === '') {
                console.error("Paystack Public Key is missing or invalid in environment variables.");
                toast.error("Payment configuration error: VITE_PAYSTACK_PUBLIC_KEY is not set correctly in your .env file.");
                setIsSubmitting(false);
                return;
            }

            // Hint for MoMo users
            if (paymentMethod !== 'paystack_card') {
                toast.info("Please wait for the Paystack window and then check your phone for the payment prompt.", {
                    duration: 8000
                });
            }

            // Trigger Paystack Popup
            initializePayment({ onSuccess, onClose });
        } else {
            // Cash on Delivery
            await processOrder(data, "cod");
        }
    };



    const processOrder = async (data: CheckoutValues, paymentMethodType: "cod" | "prepaid", paymentReference?: string) => {
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
                paymentMethod: getReadablePaymentMethod(paymentMethod),
                paymentStatus: paymentMethodType === "prepaid" ? "paid" : "unpaid",
                paymentReference: paymentReference || null,
                currency,
                exchangeRate,
                createdAt: serverTimestamp(),
            };

            let orderId = "";

            await runTransaction(db, async (transaction) => {
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

                const productRefs = items.map(item => doc(db, "products", item.product.id));
                const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

                productDocs.forEach((doc, index) => {
                    if (!doc.exists()) throw new Error(`Product not found.`);
                    const stock = doc.data().stock;
                    if (stock < items[index].quantity) {
                        throw new Error(`Insufficient stock for ${items[index].product.name}.`);
                    }
                });

                items.forEach((item, index) => {
                    const newStock = productDocs[index].data().stock - item.quantity;
                    transaction.update(productRefs[index], { stock: newStock });
                });

                const newOrderRef = doc(collection(db, "orders"));
                orderId = newOrderRef.id;
                transaction.set(newOrderRef, { ...orderData, id: orderId });
            });

            if (orderId) {
                sendOrderConfirmation(
                    { ...orderData, orderId: orderId },
                    data.email,
                    formatPrice
                ).catch(err => console.error("Failed to send confirmation email:", err));

                if (user?.uid) {
                    try {
                        const adminDocRef = doc(db, "admins", user.uid);
                        const adminDoc = await getDoc(adminDocRef);

                        if (!adminDoc.exists()) {
                            await addDoc(collection(db, "notifications"), {
                                userId: user.uid,
                                type: "new_order",
                                title: "Order Placed Successfully",
                                message: `Your order #${orderId.slice(0, 8)} has been placed.`,
                                read: false,
                                createdAt: serverTimestamp(),
                                data: { orderId: orderId },
                                link: `/account/orders/${orderId}`
                            });
                        }
                    } catch (error) {
                        console.error("Failed to create notification:", error);
                    }
                }

                try {
                    await addDoc(collection(db, "notifications"), {
                        recipientRole: "admin",
                        type: "new_order",
                        title: "New Order",
                        message: `New order #${orderId.slice(0, 8)} (${formatPrice(cartTotal)})`,
                        read: false,
                        createdAt: serverTimestamp(),
                        data: { orderId: orderId },
                        link: `/admin/orders/${orderId}`
                    });
                } catch (error) {
                    console.error("Failed to notify admins:", error);
                }
            }

            items.forEach(async (item) => {
                try {
                    const productRef = doc(db, "products", item.product.id);
                    const snap = await import("firebase/firestore").then(m => m.getDoc(productRef));
                    if (snap.exists()) {
                        checkAndAlertLowStock(item.product.id, snap.data().stock);
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
            setIsSubmitting(false); // Reset submitting state on error
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
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Shipping Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form {...form}>
                                        <form className="space-y-4">
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
                                                <FormField control={form.control} name="firstName" render={({ field }) => (
                                                    <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Daniel" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="lastName" render={({ field }) => (
                                                    <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Mensah" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>

                                            <FormField control={form.control} name="email" render={({ field }) => (
                                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="daniel.mensah@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />

                                            <FormField control={form.control} name="phone" render={({ field }) => (
                                                <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="024 XXX XXXX" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />

                                            <FormField control={form.control} name="address" render={({ field }) => (
                                                <FormItem><FormLabel>Delivery Address</FormLabel><FormControl><Input placeholder="Street name, landmark..." {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={form.control} name="city" render={({ field }) => (
                                                    <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Accra" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name="region" render={({ field }) => (
                                                    <FormItem><FormLabel>Region</FormLabel><FormControl><Input placeholder="Greater Accra" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>

                                            <FormField control={form.control} name="notes" render={({ field }) => (
                                                <FormItem><FormLabel>Order Notes (Optional)</FormLabel><FormControl><Input placeholder="Any special instructions..." {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Payment Method</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <RadioGroup value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                            <RadioGroupItem value="cod" id="cod" />
                                            <Label htmlFor="cod" className="flex-1 flex items-center cursor-pointer">
                                                <div className="mr-4 h-10 w-12 flex items-center justify-center overflow-hidden rounded-md bg-white border">
                                                    <img src="/assets/payment/cash-on-delivery.jpg" alt="COD" className="h-full w-full object-contain" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">Cash on Delivery</span>
                                                    <span className="text-secondary-foreground text-sm">Pay with cash upon delivery</span>
                                                </div>
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                            <RadioGroupItem value="paystack_momo" id="paystack_momo" />
                                            <Label htmlFor="paystack_momo" className="flex-1 flex items-center cursor-pointer">
                                                <div className="mr-4 h-10 w-12 flex items-center justify-center overflow-hidden rounded-md bg-white border">
                                                    <img src="/assets/payment/mtn-momo.png" alt="MTN MoMo" className="h-full w-full object-contain" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">MTN Mobile Money</span>
                                                    <span className="text-secondary-foreground text-sm">Instant payment via MTN MoMo</span>
                                                </div>
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                            <RadioGroupItem value="paystack_telecel" id="paystack_telecel" />
                                            <Label htmlFor="paystack_telecel" className="flex-1 flex items-center cursor-pointer">
                                                <div className="mr-4 h-10 w-12 flex items-center justify-center overflow-hidden rounded-md bg-white border">
                                                    <img src="/assets/payment/telecel-cash.jpg" alt="Telecel Cash" className="h-full w-full object-contain" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">Telecel Cash</span>
                                                    <span className="text-secondary-foreground text-sm">Instant payment via Telecel Cash</span>
                                                </div>
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                            <RadioGroupItem value="paystack_at" id="paystack_at" />
                                            <Label htmlFor="paystack_at" className="flex-1 flex items-center cursor-pointer">
                                                <div className="mr-4 h-10 w-12 flex items-center justify-center overflow-hidden rounded-md bg-white border">
                                                    <img src="/assets/payment/airteltigo-money.png" alt="AirtelTigo Money" className="h-full w-full object-contain" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">AirtelTigo Money</span>
                                                    <span className="text-secondary-foreground text-sm">Instant payment via AT Money</span>
                                                </div>
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                                            <RadioGroupItem value="paystack_card" id="paystack_card" />
                                            <Label htmlFor="paystack_card" className="flex-1 flex items-center cursor-pointer">
                                                <div className="mr-4 h-10 w-12 flex items-center justify-center overflow-hidden rounded-md bg-white border">
                                                    <img src="/assets/payment/card-payment.jpg" alt="Card Payment" className="h-full w-full object-contain" />
                                                </div>
                                                <div>
                                                    <span className="font-semibold block">Card Payment</span>
                                                    <span className="text-secondary-foreground text-sm">Visa / Mastercard</span>
                                                </div>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </CardContent>
                            </Card>
                        </div>

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
                                                <p className="font-medium">{formatPrice(item.product.price * item.quantity)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{formatPrice(cartTotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span className="text-muted-foreground text-xs italic">Calculated at delivery</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total</span>
                                        <span>{formatPrice(cartTotal)}</span>
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
                                            paymentMethod.startsWith('paystack') ? `Pay ${formatPrice(cartTotal)} Now` : "Place Order"
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
