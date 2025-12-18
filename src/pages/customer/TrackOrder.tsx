import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2, Search, Truck, MapPin, Phone, Calendar, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Order } from "@/types/order";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderTimeline from "@/components/order/OrderTimeline";

const TrackOrder = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { formatPrice } = useCurrency();
    const [orderIdInput, setOrderIdInput] = useState(searchParams.get("orderId") || "");
    const [emailOrPhone, setEmailOrPhone] = useState("");
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const urlOrderId = searchParams.get("orderId");
        if (urlOrderId && !hasSearched) {
            setOrderIdInput(urlOrderId);
            // If they come from an email, we might not have their email/phone yet, 
            // so we'll just wait for them to fill that or try a "lazy" search if it was a direct link from a logged-in session.
        }
    }, [searchParams]);

    const handleTrack = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!orderIdInput.trim()) {
            toast.error("Please enter an Order ID");
            return;
        }

        setLoading(true);
        setHasSearched(true);
        try {
            const orderRef = doc(db, "orders", orderIdInput.trim());
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
                const data = orderSnap.data() as Order;

                // Security check: must match email OR phone
                const input = emailOrPhone.trim().toLowerCase();
                const customerEmail = data.customerDetails.email?.toLowerCase();
                const customerPhone = data.customerDetails.phone;

                if (input && (input === customerEmail || input === customerPhone || customerPhone.includes(input))) {
                    setOrder({ id: orderSnap.id, ...data });
                } else if (!input) {
                    toast.info("Please enter your registered Email or Phone number to view details.");
                } else {
                    toast.error("Order details don't match the provided Email/Phone.");
                }
            } else {
                toast.error("Order not found. Please check your Order ID.");
            }
        } catch (error) {
            console.error("Error tracking order:", error);
            toast.error("Failed to fetch order details.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusClassName = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800 border-transparent";
            case "processing": return "bg-blue-100 text-blue-800 border-transparent";
            case "shipped": return "bg-purple-100 text-purple-800 border-transparent";
            case "delivered": return "bg-green-100 text-green-800 border-transparent";
            case "cancelled": return "bg-red-100 text-red-800 border-transparent";
            default: return "";
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 bg-muted/30">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
                        <p className="text-muted-foreground">Enter your details to see real-time shipment updates.</p>
                    </div>

                    <Card className="mb-8">
                        <CardContent className="pt-6">
                            <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Order ID</label>
                                    <Input
                                        placeholder="e.g. 8f3daeeb..."
                                        value={orderIdInput}
                                        onChange={(e) => setOrderIdInput(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email or Phone</label>
                                    <Input
                                        placeholder="Enter registered email/phone"
                                        value={emailOrPhone}
                                        onChange={(e) => setEmailOrPhone(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button type="submit" className="w-full gap-2" disabled={loading}>
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        Track Order
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {order ? (
                        <div className="space-y-6 stagger-animation overflow-hidden">
                            {/* Short Status Banner */}
                            <Card className="bg-primary/5 border-primary/20 animate-fade-in-up">
                                <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-float">
                                            <Truck className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Current Status</p>
                                            <h3 className="text-2xl font-bold capitalize">{order.status}</h3>
                                        </div>
                                    </div>
                                    <Badge className={`${getStatusClassName(order.status)} px-4 py-1.5 text-sm rounded-full`} variant="outline">
                                        Estimated Delivery: {order.status === 'delivered' ? 'Delivered' : 'Within 2-5 Business Days'}
                                    </Badge>
                                </CardContent>
                            </Card>

                            {/* Tracking Details if Shipped */}
                            {order.trackingNumber && (
                                <Card className="border-primary/30 shadow-lg overflow-hidden animate-fade-in-up [animation-delay:100ms]">
                                    <div className="bg-primary px-6 py-4 font-bold flex items-center gap-2 text-primary-foreground">
                                        <div className="p-1 bg-white/20 rounded-lg">
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        Shipment Details
                                    </div>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-tight font-semibold">Logistics Carrier</p>
                                                <p className="text-lg font-bold">{order.trackingCarrier}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1 uppercase tracking-tight font-semibold">Tracking Number</p>
                                                <p className="text-lg font-mono font-bold text-primary">{order.trackingNumber}</p>
                                            </div>
                                        </div>
                                        {order.trackingUrl && (
                                            <Button className="w-full mt-6 h-12 text-lg font-bold" asChild>
                                                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                                                    Open Carrier Website <ArrowRight className="ml-2 h-5 w-5" />
                                                </a>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Order Timeline */}
                            <Card className="animate-fade-in-up [animation-delay:200ms]">
                                <CardHeader>
                                    <CardTitle>Order Progress</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <OrderTimeline order={order} />
                                </CardContent>
                            </Card>

                            {/* Order Summary Basics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-animation overflow-hidden">
                                <Card className="animate-fade-in-up [animation-delay:300ms]">
                                    <CardHeader className="pb-2"><CardTitle className="text-base">Delivery To</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <span>{order.customerDetails.address}, {order.customerDetails.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{order.customerDetails.phone}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="animate-fade-in-up [animation-delay:400ms]">
                                    <CardHeader className="pb-2"><CardTitle className="text-base">Order Info</CardTitle></CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>Ordered: {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "PPP") : "N/A"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm pt-1 border-t">
                                            <span className="text-muted-foreground">Amount:</span>
                                            <span className="font-bold">{formatPrice(order.amount)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        hasSearched && !loading && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground italic">No results found for the provided information.</p>
                            </div>
                        )
                    )}

                    {!order && (
                        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                            {[
                                { title: "Enter ID", desc: "Found in your confirmation email" },
                                { title: "Verify Info", desc: "Use your registered email or phone" },
                                { title: "Track Live", desc: "See real-time transit updates" }
                            ].map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center text-center p-4 border rounded-xl bg-white/50">
                                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary mb-2">{idx + 1}</div>
                                    <h4 className="font-bold">{step.title}</h4>
                                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default TrackOrder;
