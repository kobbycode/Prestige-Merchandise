import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
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
import { Eye, Loader2, Search, Filter, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { deleteDoc, doc, writeBatch, addDoc, serverTimestamp } from "firebase/firestore";
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

import { Order } from "@/types/order";

const AdminOrders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [date, setDate] = useState<DateRange | undefined>();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    // Filter orders based on search query, status, and date range
    const filteredOrders = orders.filter((order) => {
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        const searchLower = searchQuery.toLowerCase();
        const customerName = `${order.customerDetails.firstName} ${order.customerDetails.lastName}`.toLowerCase();
        const phone = order.customerDetails.phone.toLowerCase();
        const orderId = order.id.toLowerCase();

        const matchesSearch = customerName.includes(searchLower) ||
            phone.includes(searchLower) ||
            orderId.includes(searchLower);

        let matchesDate = true;
        if (date?.from && date?.to && order.createdAt?.seconds) {
            const orderDate = new Date(order.createdAt.seconds * 1000);
            const from = new Date(date.from);
            const to = new Date(date.to);
            // Set time to boundaries to ensure inclusive comparison
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            matchesDate = orderDate >= from && orderDate <= to;
        } else if (date?.from && order.createdAt?.seconds) {
            const orderDate = new Date(order.createdAt.seconds * 1000);
            const from = new Date(date.from);
            from.setHours(0, 0, 0, 0);
            matchesDate = orderDate >= from;
        }

        return matchesStatus && matchesSearch && matchesDate;
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

    const handleDeleteOrder = async () => {
        if (!deleteId) return;
        try {
            const orderToDelete = orders.find(o => o.id === deleteId);
            await deleteDoc(doc(db, "orders", deleteId));

            // Notify customer if order exists
            if (orderToDelete) {
                await addDoc(collection(db, "notifications"), {
                    userId: orderToDelete.userId,
                    type: "order_status",
                    title: "Order Deleted",
                    message: `Your Order #${orderToDelete.id.substring(0, 8).toUpperCase()} has been deleted by an administrator.`,
                    read: false,
                    createdAt: serverTimestamp(),
                    link: "/account/orders"
                });
            }

            setOrders(prev => prev.filter(o => o.id !== deleteId));
            toast.success("Order deleted successfully");
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error("Failed to delete order");
        } finally {
            setDeleteId(null);
        }
    };

    const handleClearAll = async () => {
        try {
            const batch = writeBatch(db);
            orders.forEach((order) => {
                const docRef = doc(db, "orders", order.id);
                batch.delete(docRef);
            });
            await batch.commit();
            setOrders([]);
            toast.success("All orders deleted successfully");
        } catch (error) {
            console.error("Error clearing orders:", error);
            toast.error("Failed to clear orders");
        } finally {
            setIsDeletingAll(false);
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h1>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by customer name, order ID, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="w-full sm:w-[180px]">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <SelectValue placeholder="Filter by Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full sm:w-auto">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                    "w-full sm:w-[260px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "LLL dd, y")} -{" "}
                                            {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    {date && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-8 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setDate(undefined)}
                        >
                            <X className="mr-1 h-3 w-3" /> Clear
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex justify-end">
                {orders.length > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeletingAll(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear All Orders
                    </Button>
                )}
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
                        <div className="space-y-4">
                            {/* Mobile View: Cards */}
                            <div className="block md:hidden space-y-4">
                                {filteredOrders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-lg border p-4 space-y-3 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-semibold">
                                                    {order.customerDetails.firstName} {order.customerDetails.lastName}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    ID: {order.id.substring(0, 8).toUpperCase()}
                                                </div>
                                            </div>
                                            <Badge className={getStatusClassName(order.status)} variant="outline">
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Date</div>
                                                <div>
                                                    {order.createdAt?.seconds
                                                        ? format(new Date(order.createdAt.seconds * 1000), "MMM dd, yyyy")
                                                        : "N/A"}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-muted-foreground">Total</div>
                                                <div className="font-semibold">GH₵ {order.amount.toFixed(2)}</div>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex justify-end gap-2 border-t mt-2">
                                            <Link to={`/admin/orders/${order.id}`}>
                                                <Button variant="outline" size="sm" className="h-8">
                                                    <Eye className="mr-2 h-3.5 w-3.5" />
                                                    View
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => setDeleteId(order.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
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
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link to={`/admin/orders/${order.id}`}>
                                                            <Button variant="ghost" size="icon">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => setDeleteId(order.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the order from the database.
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
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete ALL orders from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll} className="bg-red-600 hover:bg-red-700">
                            Delete All Orders
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};

export default AdminOrders;
