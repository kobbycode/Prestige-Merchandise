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
import { Loader2, ArrowLeft, MapPin, Phone, Calendar, Truck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Order } from "@/types/order";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderTimeline from "@/components/order/OrderTimeline";
import { generateInvoice } from "@/lib/invoiceGenerator";
import { Printer } from "lucide-react";

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

                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold">Order Details</h1>
                            <p className="text-muted-foreground flex items-center gap-2 text-sm mt-1">
                                ID: <span className="font-mono">{order.id}</span>
                                <span className="text-gray-300">|</span>
                                <Calendar className="h-3 w-3" />
                                {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "PPP") : "N/A"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => generateInvoice(order)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Download Invoice
                            </Button>
                            <Badge className={getStatusClassName(order.status)} variant="outline">
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                        </div>
                    </div>

                    {/* Tracking Information */}
                    {order.trackingNumber && (
                        <Card className="mb-6 bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-primary" />
                                    Shipment Tracking
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Carrier</p>
                                        <p className="font-medium">{order.trackingCarrier || "Unknown Carrier"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tracking Number</p>
                                        <p className="font-medium font-mono">{order.trackingNumber}</p>
                                    </div>
                                </div>
                                {order.trackingUrl && (
                                    <Button className="w-full mt-4" asChild>
                                        <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                                            Track Shipment
                                        </a>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}

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
                                            <div key={index} className="py-4 flex gap-4">
                                                <div className="h-16 w-16 bg-muted rounded overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">?</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold">{item.name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.variant && <span className="mr-2 border px-1 rounded text-xs">{item.variant}</span>}
                                                        Qty: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-right font-medium">
                                                    {formatPrice(item.price * item.quantity)}
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
