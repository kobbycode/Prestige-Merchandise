import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, getDocs, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, MapPin, Phone, User, Calendar, CreditCard, Printer } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Order } from "@/types/order";
import { initEmailJS, sendOrderStatusUpdate } from "@/lib/emailService";
import { generateInvoice } from "@/lib/invoiceGenerator";

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchOrder(id);
        }
        // Initialize EmailJS
        initEmailJS();
    }, [id]);

    const fetchOrder = async (orderId: string) => {
        try {
            const docRef = doc(db, "orders", orderId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
            } else {
                toast.error("Order not found");
                navigate("/admin/orders");
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            toast.error("Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus: Order['status']) => {
        if (!order) return;
        const oldStatus = order.status;
        setUpdating(true);
        try {
            const docRef = doc(db, "orders", order.id);

            // Create status history entry
            const statusHistoryEntry = {
                status: newStatus,
                timestamp: Timestamp.now(),
            };

            // Update both status and statusHistory
            await updateDoc(docRef, {
                status: newStatus,
                statusHistory: arrayUnion(statusHistoryEntry)
            });

            // Update local state with new statusHistory
            const updatedHistory = [...(order.statusHistory || []), statusHistoryEntry];
            setOrder({ ...order, status: newStatus, statusHistory: updatedHistory });

            // Create in-app notification for the customer (only if they're not an admin)
            if (order.userId && order.userId !== "guest") {
                try {
                    // Check if the user is an admin
                    const adminDocRef = doc(db, "admins", order.userId);
                    const adminDoc = await getDoc(adminDocRef);

                    // Only send customer notification if user is NOT an admin
                    if (!adminDoc.exists()) {
                        await addDoc(collection(db, "notifications"), {
                            userId: order.userId,
                            type: "order_status",
                            title: "Order Status Updated",
                            message: `Your order #${order.id.slice(0, 8)} is now ${newStatus}.`,
                            read: false,
                            createdAt: serverTimestamp(),
                            data: { orderId: order.id },
                            link: `/account/orders/${order.id}`
                        });
                    }
                } catch (error) {
                    console.error("Error creating customer notification:", error);
                }
            }

            // Notify all admins with admin-oriented message
            try {
                const adminsQuery = query(collection(db, "admins"));
                const adminSnaps = await getDocs(adminsQuery);
                const customerName = `${order.customerDetails.firstName} ${order.customerDetails.lastName}`;

                const adminNotifications = adminSnaps.docs.map(adminDoc =>
                    addDoc(collection(db, "notifications"), {
                        userId: adminDoc.id,
                        type: "order_status",
                        title: "Order Status Updated",
                        message: `Order #${order.id.slice(0, 8)} from ${customerName} is now ${newStatus}.`,
                        read: false,
                        createdAt: serverTimestamp(),
                        data: { orderId: order.id },
                        link: `/admin/orders/${order.id}`
                    })
                );
                await Promise.all(adminNotifications);
            } catch (error) {
                console.error("Error creating admin notifications:", error);
            }

            // Send status update email (non-blocking)
            const customerEmail = order.customerDetails.email;
            if (customerEmail) {
                sendOrderStatusUpdate(
                    order,
                    customerEmail,
                    oldStatus,
                    newStatus
                ).catch(err => {
                    console.error("Failed to send status update email:", err);
                });
            }

            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setUpdating(false);
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
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <Button variant="outline" size="icon" onClick={() => navigate("/admin/orders")} className="print:hidden">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 w-full">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight print:text-xl">Order Details</h1>
                            <p className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                                <span className="whitespace-nowrap">ID: <span className="font-mono">{order.id}</span></span>
                                <span className="text-gray-300 print:hidden hidden sm:inline">|</span>
                                <span className="print:hidden flex items-center whitespace-nowrap">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "PPP p") : "N/A"}
                                </span>
                            </p>
                        </div>

                        <Button variant="outline" className="print:hidden gap-2 w-full sm:w-auto" onClick={() => generateInvoice(order!)}>
                            <Printer className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>
                <div className="w-full md:w-auto md:ml-auto flex items-center justify-between md:justify-start gap-3 print:hidden">
                    <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Status:</span>
                    <Select
                        value={order.status}
                        onValueChange={handleStatusUpdate}
                        disabled={updating}
                    >
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content - Items */}
                <div className="md:col-span-2 space-y-6">
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
                                            GH₵ {(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total Amount</span>
                                <span>GH₵ {order.amount.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Customer Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">{order.customerDetails.firstName} {order.customerDetails.lastName}</p>
                                    <p className="text-sm text-muted-foreground">Customer</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">{order.customerDetails.phone}</p>
                                    <p className="text-sm text-muted-foreground">Mobile</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">Delivery Address</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {order.customerDetails.address}<br />
                                        {order.customerDetails.city}, {order.customerDetails.region}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {order.customerDetails.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic text-muted-foreground whitespace-pre-wrap">
                                    "{order.customerDetails.notes}"
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium">Cash on Delivery</p>
                                    <p className="text-sm text-muted-foreground">
                                        Badge: <Badge className={getStatusClassName(order.status)} variant="outline">{order.status}</Badge>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default OrderDetail;
