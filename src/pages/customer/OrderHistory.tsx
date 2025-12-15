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
                const adminsQuery = query(collection(db, "admins"));
                const adminSnaps = await getDocs(adminsQuery);
                const adminNotifications = adminSnaps.docs.map(adminDoc => ({
                    userId: adminDoc.id,
                    type: "info",
                    title: "Order Cancelled by User",
                    message: `Order #${orderToDelete.id.substring(0, 8).toUpperCase()} was deleted by the customer.`,
                    read: false,
                    createdAt: serverTimestamp(),
                    link: "/admin/orders"
                }));

                const batch = writeBatch(db);
                adminNotifications.forEach(notif => {
                    const ref = doc(collection(db, "notifications"));
                    batch.set(ref, notif);
                });
                await batch.commit();
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
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold">Order History</h1>
                        {orders.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsDeletingAll(true)}
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
                        <Card>
                            <CardContent className="text-center py-12">
                                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start shopping to see your orders here
                                </p>
                                <Link to="/shop">
                                    <Button>Browse Products</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {orders.map((order) => (
                                <Card key={order.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-base">
                                                    Order #{order.id.substring(0, 8).toUpperCase()}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {order.createdAt?.seconds
                                                        ? format(new Date(order.createdAt.seconds * 1000), "PPP")
                                                        : "N/A"}
                                                </p>
                                            </div>
                                            <Badge className={getStatusClassName(order.status)} variant="outline">
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                                </p>
                                                <p className="text-lg font-bold">GH₵ {order.amount.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link to={`/account/orders/${order.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => setDeleteId(order.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
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
