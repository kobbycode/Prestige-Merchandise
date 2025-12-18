import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, writeBatch, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Order } from "@/types/order";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const OrderHistory = () => {
    const { user } = useAuth();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        if (!user?.uid) return;

        try {
            const q = query(
                collection(db, "orders"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const ordersList: Order[] = [];
            querySnapshot.forEach((doc) => {
                ordersList.push({ id: doc.id, ...doc.data() } as Order);
            });
            setOrders(ordersList);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!deleteId) return;
        try {
            const orderToDelete = orders.find(o => o.id === deleteId);
            await deleteDoc(doc(db, "orders", deleteId));

            // Notify admins
            if (orderToDelete) {
                // Notify admins (Role-based)
                await addDoc(collection(db, "notifications"), {
                    recipientRole: "admin",
                    type: "info",
                    title: "Order Cancelled by User",
                    message: `Order #${orderToDelete.id.substring(0, 8).toUpperCase()} was deleted by the customer.`,
                    read: false,
                    createdAt: serverTimestamp(),
                    link: "/admin/orders"
                });
            }

            setOrders(prev => prev.filter(o => o.id !== deleteId));
            toast.success("Order deleted from history");
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Failed to delete order");
        } finally {
            setDeleteId(null);
        }
    };

    const handleClearAll = async () => {
        if (!user?.uid) return;
        try {
            const batch = writeBatch(db);
            orders.forEach((order) => {
                const docRef = doc(db, "orders", order.id);
                batch.delete(docRef);
            });
            await batch.commit();
            setOrders([]);
            toast.success("Order history cleared");
        } catch (error) {
            console.error("Error clearing history:", error);
            toast.error("Failed to clear history");
        } finally {
            setIsDeletingAll(false);
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

    if (!user) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 bg-muted/30">
                <div className="container mx-auto px-4 py-6 md:py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Order History</h1>
                            <p className="text-sm text-muted-foreground mt-1">Track and manage your recent orders</p>
                        </div>
                        {orders.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsDeletingAll(true)}
                                className="w-full md:w-auto"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear History
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-[50vh]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : orders.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="No orders yet"
                            description="You haven't placed any orders yet. Start shopping to find great parts for your vehicle."
                            actionLabel="Browse Shop"
                            actionLink="/shop"
                        />
                    ) : (
                        <div className="grid gap-4 stagger-animation">
                            {orders.map((order, index) => (
                                <Card
                                    key={order.id}
                                    className="overflow-hidden bg-card transition-all hover:shadow-md animate-fade-in-up"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="p-4 md:p-6 flex flex-col gap-4">
                                        {/* Order Header: ID, Date, Status */}
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-base md:text-lg">
                                                        #{order.id.substring(0, 8).toUpperCase()}
                                                    </span>
                                                    <Badge className={`w-fit px-2 py-0.5 text-xs font-medium rounded-full ${getStatusClassName(order.status)}`} variant="outline">
                                                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs md:text-sm text-muted-foreground">
                                                    Placed on {order.createdAt?.seconds
                                                        ? format(new Date(order.createdAt.seconds * 1000), "PPP 'at' p")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 md:hidden">
                                                {/* Mobile-only status moved next to ID above, or keep separate? 
                                                   Actually I put badge next to ID above. */}
                                            </div>
                                        </div>

                                        <div className="border-t border-border/50 my-1" />

                                        {/* Order Details: Items, Price, Actions */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                                                <div className="min-w-[60px]">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Items</p>
                                                    <p className="font-bold text-foreground text-sm">{order.items.length}</p>
                                                </div>
                                                <div className="min-w-[80px]">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Total</p>
                                                    <p className="font-black text-primary text-base">{formatPrice(order.amount)}</p>
                                                </div>
                                                <div className="min-w-[100px]">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Payment</p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                            {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                                                        </span>
                                                        {order.paymentMethod === 'Cash on Delivery' && (
                                                            <span className="text-[10px] text-muted-foreground font-medium">(COD)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 pt-2 sm:pt-0">
                                                <Link to={`/account/orders/${order.id}`} className="flex-1 sm:flex-none">
                                                    <Button variant="default" size="default" className="w-full sm:w-auto gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                                                    onClick={() => setDeleteId(order.id)}
                                                    title="Delete Order History"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this order from your history? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeletingAll} onOpenChange={setIsDeletingAll}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear Order History?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete all verified orders? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                            Clear History
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Footer />
        </div>
    );
};

export default OrderHistory;
