import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, Category } from "@/types/product";
import { Order } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FolderTree, AlertTriangle, TrendingUp, CheckCircle, ArrowRight, ShoppingCart, Clock, DollarSign } from "lucide-react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const StatCard = ({ title, value, icon: Icon, description, alert }: any) => (
    <Card className={`shadow-sm hover:shadow-md transition-all ${alert ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-primary'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-primary'}`} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        totalCategories: 0,
        lowStockProducts: 0,
        totalValue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
    });
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [categoryData, setCategoryData] = useState<{ name: string, count: number }[]>([]);
    const [orderStatusData, setOrderStatusData] = useState<{ name: string, value: number }[]>([]);
    const [revenueChartData, setRevenueChartData] = useState<{ date: string, revenue: number }[]>([]);
    const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Products
                const productsSnap = await getDocs(collection(db, "products"));
                const products: Product[] = [];
                const lowStockList: Product[] = [];
                let activeCount = 0;
                let lowStockCount = 0;
                let value = 0;
                const catCounts: Record<string, number> = {};

                productsSnap.forEach(doc => {
                    const p = { id: doc.id, ...doc.data() } as Product;
                    products.push(p);
                    if (p.status === 'active') activeCount++;
                    if (p.stock <= 5) {
                        lowStockCount++;
                        lowStockList.push(p);
                    }
                    value += p.price * p.stock;

                    // Category counts
                    if (p.category) {
                        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
                    }
                });

                setLowStockItems(lowStockList);

                // Fetch Categories
                const categoriesSnap = await getDocs(collection(db, "categories"));
                const totalCategories = categoriesSnap.size;

                // Fetch Recent Products
                const recentProductsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(5));
                const recentProductsSnap = await getDocs(recentProductsQuery);
                const recent: Product[] = [];
                recentProductsSnap.forEach(doc => recent.push({ id: doc.id, ...doc.data() } as Product));

                // Fetch Orders
                const ordersSnap = await getDocs(collection(db, "orders"));
                const orders: Order[] = [];
                let pendingCount = 0;
                let revenue = 0;
                const statusCounts: Record<string, number> = {};

                ordersSnap.forEach(doc => {
                    const o = { id: doc.id, ...doc.data() } as Order;
                    orders.push(o);
                    revenue += o.amount;
                    if (o.status === 'pending') pendingCount++;
                    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
                });

                // Fetch Recent Orders (Fetch more to get meaningful data for charts, e.g. last 20 or 50)
                // Actually, for the chart we might want ALL orders or just slice from the main orders array
                // But the 'recentOrders' view is limited to 5.
                // Let's repurpose 'recentOrders' state for the list, and use 'orders' for the chart.

                const recentOrdersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
                const recentOrdersSnap = await getDocs(recentOrdersQuery);
                const recentOrdersList: Order[] = [];
                recentOrdersSnap.forEach(doc => recentOrdersList.push({ id: doc.id, ...doc.data() } as Order));

                setStats({
                    totalProducts: products.length,
                    activeProducts: activeCount,
                    totalCategories,
                    lowStockProducts: lowStockCount,
                    totalValue: value,
                    totalOrders: orders.length,
                    pendingOrders: pendingCount,
                    totalRevenue: revenue
                });

                setRecentProducts(recent);
                setRecentOrders(recentOrdersList);

                // For chart: Use all orders, sort by date
                setRecentOrders(orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 7)); // Just showing last 7 for chart? 
                // Wait, if I overwrite recentOrders with 7 items, the list only shows 7. 
                // But the chart needs potentially more data or same data. 
                // Let's keep recentOrders for the list (5 items) and create a separate state for chart if needed?
                // OR just use the 'orders' array we already fetched which has EVERYTHING.
                // The previous code block for the chart used 'recentOrders'.
                // Let's update the chart logic to use 'allOrders' (which I need to save to state) OR just process 'orders' here and save processed data.

                // Let's create `revenueChartData` state.
                const processedRevenueData = orders.reduce((acc: any[], order) => {
                    if (!order.createdAt?.seconds) return acc;
                    const date = format(new Date(order.createdAt.seconds * 1000), "MMM dd");
                    const existing = acc.find(item => item.date === date);
                    if (existing) {
                        existing.revenue += order.amount;
                    } else {
                        acc.push({ date, revenue: order.amount });
                    }
                    return acc;
                }, [])
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // sort by date roughly? "MMM dd" isn't year-safe but okay for recent.
                // Actually safer to sort by raw timestamp then format.
                // Re-doing chart data logic:

                // Group by date string (unique key)
                const revenueMap = new Map<string, number>();
                orders.forEach(o => {
                    if (o.createdAt?.seconds) {
                        const d = new Date(o.createdAt.seconds * 1000);
                        const key = format(d, "MMM dd");
                        revenueMap.set(key, (revenueMap.get(key) || 0) + o.amount);
                    }
                });
                // Convert to array and taking last 7 days? Or just all available days?
                // Let's take last 7 entries for cleanliness.
                const chartDataRaw = Array.from(revenueMap.entries()).map(([date, revenue]) => ({ date, revenue }));
                // We need them sorted chronologically. This map order isn't guaranteed.
                // Since we want simple "Trends", let's just reverse the recent logic or robustly sort.
                // Robust:
                // ... ignoring subtle sort issues for now, the original list was unordered.
                // Let's use the 'orders' array which is effectively random unless sorted.
                // 'orders' array isn't sorted in the fetch above (no orderBy).
                // Let's just rely on the fact that for a small shop, sorting by string 'MMM dd' might fail across years but works for now.
                // Better: Use `recentOrders` (which was 5 items) from before? No that's too small.
                // Let's save `orders` to a state `allOrders` or just `recentOrders`? 
                // I will save `recentOrders` as the short list (5) and add `revenueData` state.

                setRecentOrders(recentOrdersList); // Keep list as 5

                // Format category chart data
                const chartData = Object.entries(catCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 7);
                setCategoryData(chartData);

                // Format order status chart data
                const statusChartData = Object.entries(statusCounts)
                    .map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value
                    }));
                setOrderStatusData(statusChartData);

                // PROCESS REVENUE DATA FOR STATE
                const revData = orders
                    .filter(o => o.createdAt?.seconds)
                    .sort((a, b) => (a.createdAt!.seconds - b.createdAt!.seconds)) // Oldest first
                    .reduce((acc: any[], order) => {
                        const date = format(new Date(order.createdAt.seconds * 1000), "MMM dd");
                        const existing = acc.find(item => item.date === date);
                        if (existing) {
                            existing.revenue += order.amount;
                        } else {
                            acc.push({ date, revenue: order.amount });
                        }
                        return acc;
                    }, [])
                    .slice(-7); // Last 7 days with activity

                setRevenueChartData(revData);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

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

    const COLORS = ['hsl(var(--primary))', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];


    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-sm md:text-base text-muted-foreground">Overview of your store's performance</p>
                </div>
                <Link to="/admin/products/new" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto">Add Product</Button>
                </Link>
            </div>

            {/* Product Stats */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Inventory</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Products"
                        value={stats.totalProducts}
                        icon={Package}
                        description={`${stats.activeProducts} active in store`}
                    />
                    <StatCard
                        title="Categories"
                        value={stats.totalCategories}
                        icon={FolderTree}
                        description="Product categories"
                    />
                    <StatCard
                        title="Inventory Value"
                        value={`GH₵ ${stats.totalValue.toLocaleString()}`}
                        icon={TrendingUp}
                        description="Total stock value"
                    />
                    <StatCard
                        title="Low Stock Alerts"
                        value={stats.lowStockProducts}
                        icon={AlertTriangle}
                        description="Products with stock ≤ 5"
                        alert={stats.lowStockProducts > 0}
                    />
                </div>
            </div>

            {/* Order Stats */}
            <div>
                <h2 className="text-lg font-semibold mb-3">Orders & Revenue</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="Total Orders"
                        value={stats.totalOrders}
                        icon={ShoppingCart}
                        description="All time orders"
                    />
                    <StatCard
                        title="Pending Orders"
                        value={stats.pendingOrders}
                        icon={Clock}
                        description="Awaiting processing"
                        alert={stats.pendingOrders > 0}
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`GH₵ ${stats.totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        description="All time revenue"
                    />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Revenue Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <AreaChart data={revenueChartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₵${value}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Recent Products */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentProducts.map((product) => (
                                <div key={product.id} className="space-y-4 sm:space-y-0">
                                    {/* Mobile: Boxed Card */}
                                    <div className="block sm:hidden bg-card rounded-lg border p-3 shadow-sm mb-4">
                                        <div className="flex gap-3">
                                            <div className="h-14 w-14 rounded overflow-hidden bg-muted shrink-0">
                                                {product.images && product.images[0] ? (
                                                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                        <Package className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">{product.category || "Uncategorized"}</p>
                                                <div className="flex justify-between items-center mt-1.5">
                                                    <div className="font-bold text-sm">
                                                        GH₵ {product.price.toLocaleString()}
                                                    </div>
                                                    {product.stock <= 5 && (
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Low Stock</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop: Row (Hidden on mobile) */}
                                    <div className="hidden sm:flex items-center gap-3">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded overflow-hidden bg-muted shrink-0">
                                                {product.images && product.images[0] ? (
                                                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                                        <Package className="h-4 w-4 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none line-clamp-1">{product.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-muted-foreground">{product.category || "Uncategorized"}</p>
                                                    {product.stock <= 5 && (
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Low Stock</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-auto font-medium text-sm">GH₵ {product.price.toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                            {recentProducts.length === 0 && <p className="text-sm text-muted-foreground text-center">No products added yet.</p>}
                            <div className="pt-4 text-center">
                                <Link to="/admin/products">
                                    <Button variant="outline" size="sm" className="w-full">
                                        View All Products <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Orders Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Order Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orderStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={65}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ paddingTop: "20px" }}
                                        formatter={(value, entry: any) => <span className="text-xs text-muted-foreground ml-1">{value} ({entry.payload.value})</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-12">No orders yet</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="space-y-4 sm:space-y-0">
                                    {/* Mobile: Boxed Card */}
                                    <div className="block sm:hidden bg-card rounded-lg border p-3 shadow-sm mb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {order.customerDetails.firstName} {order.customerDetails.lastName}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {order.items.length} items
                                                </p>
                                            </div>
                                            <Badge className={getStatusClassName(order.status)} variant="outline">
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-end border-t pt-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Ordered</p>
                                                <p className="text-xs font-medium">
                                                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "MMM dd, p") : "N/A"}
                                                </p>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <div className="mr-2">
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                    <p className="text-sm font-bold">GH₵ {order.amount.toFixed(2)}</p>
                                                </div>
                                                <Link to={`/admin/orders/${order.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop: Row (Hidden on mobile) */}
                                    <div className="hidden sm:flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {order.customerDetails.firstName} {order.customerDetails.lastName}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-xs text-muted-foreground">
                                                    {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "PPp") : "N/A"}
                                                </p>
                                                <Badge className={getStatusClassName(order.status)} variant="outline">
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="text-right">
                                                <p className="text-sm font-medium">GH₵ {order.amount.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                                            </div>
                                            <Link to={`/admin/orders/${order.id}`}>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground text-center">No orders yet.</p>}
                            <div className="pt-4 text-center">
                                <Link to="/admin/orders">
                                    <Button variant="outline" size="sm" className="w-full">
                                        View All Orders <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div >
            {/* Low Stock Detailed List */}
            {
                stats.lowStockProducts > 0 && (
                    <Card className="border-red-200 bg-red-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="h-5 w-5" />
                                Low Stock Alert
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-red-100 text-red-700">
                                        <tr>
                                            <th className="px-4 py-3">Product</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Current Stock</th>
                                            <th className="px-4 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Ideally we filter this from the main products list we fetched */}
                                        {/* Since we don't have the full product list in state (only count), we might need to fetch or filter if we kept them. */}
                                        {/* Wait, we only fetched counts in the original code, except 'recent'. 
                                        Actually, the original code DID get all products into a local array 'products' but only set 'recentProducts' to state. 
                                        I should improve the state to hold 'lowStockItems' 
                                     */}
                                        {/* Placeholder for now to show structure, will need to update state logic above to populate this. */}
                                        <tr>
                                            <td className="px-4 py-3" colSpan={4}>
                                                <div className="text-center text-muted-foreground">Detailed list requires state update. (Updating next step)</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )
            }
        </div >
    );
};

export default Dashboard;
