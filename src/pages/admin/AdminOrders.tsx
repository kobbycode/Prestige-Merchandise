import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Loader2, Search } from "lucide-react";
import { format } from "date-fns";

import { Order } from "@/types/order";

const AdminOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter orders based on search query
    const filteredOrders = orders.filter((order) => {
        const searchLower = searchQuery.toLowerCase();
        const customerName = `${order.customerDetails.firstName} ${order.customerDetails.lastName}`.toLowerCase();
        const phone = order.customerDetails.phone.toLowerCase();
        const orderId = order.id.toLowerCase();

        return (
            customerName.includes(searchLower) ||
            phone.includes(searchLower) ||
            orderId.includes(searchLower)
        );
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case "pending": return "secondary"; // yellow-ish usually, but using secondary for now or custom
            case "processing": return "default"; // blue
            case "shipped": return "default";
            case "delivered": return "outline"; // green ideally, but badge variants are limited. specific styling might be needed.
            case "cancelled": return "destructive";
            default: return "secondary";
        }
    };

    // Custom styles for correct semantic colors since badge variants are limited
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
            </div>

            {/* Search Bar */}
            <div className="max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by customer name, order ID, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            {searchQuery ? 'No orders found matching your search.' : 'No orders found.'}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium font-mono text-xs">
                                            {order.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">
                                                {order.customerDetails.firstName} {order.customerDetails.lastName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {order.customerDetails.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "PPP") : "N/A"}
                                        </TableCell>
                                        <TableCell>GH₵ {order.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusClassName(order.status)} variant="outline">
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link to={`/admin/orders/${order.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminOrders;
