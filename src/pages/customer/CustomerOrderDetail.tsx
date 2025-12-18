import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2, ArrowLeft, MapPin, Phone, Calendar, Truck, Package, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Order } from "@/types/order";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderTimeline from "@/components/order/OrderTimeline";
import { generateInvoice } from "@/lib/invoiceGenerator";

const CustomerOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id && user) {
            fetchOrder(id);
        }
    }, [id, user]);

    const fetchOrder = async (orderId: string) => {
        try {
            const docRef = doc(db, "orders", orderId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const orderData = { id: docSnap.id, ...docSnap.data() } as Order;

                // Security check: ensure order belongs to current user
                if (orderData.userId !== user?.uid) {
                    toast.error("Unauthorized access");
                    navigate("/account/orders");
                    return;
                }

                setOrder(orderData);
            } else {
                toast.error("Order not found");
                navigate("/account/orders");
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Failed to load order");
            navigate("/account/orders");
        } finally {
            setLoading(false);
        }
    };

    const getStatusClassName = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-transparent";
            case "processing": return "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-transparent";
            case "shipped": return "bg-purple-100 text-purple-800 hover:bg-purple-100/80 border-transparent";
            case "delivered": return "bg-green-100 text-green-800 hover:bg-green-100/80 border-transparent";
            case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-100/80 border-transparent";
            default: return "";
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 bg-muted/30">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <Button variant="ghost" className="mb-6 pl-0" onClick={() => navigate("/account/orders")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Order Details</h1>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mt-2">
                                <span className="text-muted-foreground flex items-center gap-1 font-medium italic">
                                    ID: <span className="font-mono text-foreground font-bold not-italic">{order.id}</span>
                                </span>
                                <span className="text-gray-300 hidden sm:inline">|</span>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span>{order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "PPP") : "N/A"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateInvoice(order)}
                                className="h-10 px-4 rounded-xl border-primary/20 hover:bg-primary/5 shadow-sm"
                            >
                                <Printer className="mr-2 h-4 w-4 text-primary" />
                                Download Invoice
                            </Button>
                            <Badge className={`${getStatusClassName(order.status)} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`} variant="outline">
                                {order.status}
                            </Badge>
                        </div>
                    </div>


                    {/* Order Timeline */}
                    <Card className="mb-6">
                        <CardContent className="pt-4">
                            <OrderTimeline order={order} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Order Items */}
                        <div className="md:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Order Items</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="py-4 flex items-start gap-4">
                                                <div className="h-20 w-20 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/50">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform hover:scale-110" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                            <Package className="h-8 w-8 opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm md:text-base line-clamp-2">{item.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {item.variant && (
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase font-bold">
                                                                {item.variant}
                                                            </Badge>
                                                        )}
                                                        <p className="text-xs text-muted-foreground font-medium">
                                                            Qty: <span className="text-foreground">{item.quantity}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-primary text-sm md:text-base whitespace-nowrap">
                                                        {formatPrice(item.price * item.quantity)}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        {formatPrice(item.price)} each
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="flex justify-between items-center font-bold text-lg">
                                        <span>Total Amount</span>
                                        <span>{formatPrice(order.amount)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment & Delivery Info */}
                        <div>
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Payment Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="font-medium">{order.paymentMethod || "Cash on Delivery"}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-muted-foreground">Status:</span>
                                            <Badge
                                                variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                                                className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-transparent' : 'bg-gray-100 text-gray-800 border-transparent'}
                                            >
                                                {order.paymentStatus ? order.paymentStatus.toUpperCase() : "PENDING"}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Delivery Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">{order.customerDetails.phone}</p>
                                            <p className="text-sm text-muted-foreground">Contact</p>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="font-medium">Delivery Address</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {order.customerDetails.firstName} {order.customerDetails.lastName}<br />
                                                {order.customerDetails.address}<br />
                                                {order.customerDetails.city}, {order.customerDetails.region}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div >
            </main >

            <Footer />
        </div >
    );
};

export default CustomerOrderDetail;
