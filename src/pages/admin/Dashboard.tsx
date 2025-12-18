import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCurrency } from "@/contexts/CurrencyContext";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, Category } from "@/types/product";
import { Order } from "@/types/order";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FolderTree, AlertTriangle, TrendingUp, CheckCircle, ArrowRight, ShoppingCart, Clock, DollarSign, Eye } from "lucide-react";
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
    const { formatPrice } = useCurrency();
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        totalCategories: 0,
        lowStockProducts: 0,
        totalValue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        totalViews: 0
    });
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [categoryData, setCategoryData] = useState<{ name: string, value: number }[]>([]);
    const [orderStatusData, setOrderStatusData] = useState<{ name: string, value: number }[]>([]);
    const [revenueChartData, setRevenueChartData] = useState<{ date: string, revenue: number }[]>([]);
    const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
    const [mostViewedProducts, setMostViewedProducts] = useState<Product[]>([]);
    const [topSellingProducts, setTopSellingProducts] = useState<{ name: string, sales: number, revenue: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

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
                let totalViews = 0;
                const catCounts: Record<string, number> = {};

                productsSnap.forEach(doc => {
                    const data = doc.data();
                    const p = { id: doc.id, ...data } as Product;
                    products.push(p);
                    if (p.status === 'active') activeCount++;
                    if (p.stock <= 10) {
                        lowStockCount++;
                        lowStockList.push(p);
                    }
                    if (p.price && p.stock) {
                        value += p.price * p.stock;
                    }
                    totalViews += (p.views || 0);

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
                const productSales: Record<string, { count: number, revenue: number, name: string }> = {};
                const categoryRevenue: Record<string, number> = {};

                ordersSnap.forEach(doc => {
                    const o = { id: doc.id, ...doc.data() } as Order;
                    orders.push(o);
                    revenue += (o.amount || 0);
                    if (o.status === 'pending') pendingCount++;
                    const status = o.status || 'unknown';
                    statusCounts[status] = (statusCounts[status] || 0) + 1;

                    // Track product sales and category revenue
                    if (Array.isArray(o.items)) {
                        o.items.forEach(item => {
                            if (item.product) {
                                const productId = item.id || item.product.id;
                                if (!productSales[productId]) {
                                    productSales[productId] = { count: 0, revenue: 0, name: item.product.name || 'Unknown Product' };
                                }
                                const qty = item.quantity || 0;
                                const price = item.product.price || 0;
                                productSales[productId].count += qty;
                                productSales[productId].revenue += price * qty;

                                const cat = item.product.category;
                                if (cat) {
                                    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + price * qty;
                                }
                            }
                        });
                    }
                });

                // Fetch Recent Orders
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
                    totalRevenue: revenue,
                    totalViews
                });

                setRecentProducts(recent);
                setRecentOrders(recentOrdersList);

                // Most Viewed Products
                const mostViewed = [...products]
                    .sort((a, b) => (b.views || 0) - (a.views || 0))
                    .slice(0, 5);
                setMostViewedProducts(mostViewed);

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
                    .sort((a, b) => (a.createdAt.seconds - b.createdAt.seconds)) // Oldest first
                    .reduce((acc: any[], order) => {
                        try {
                            const date = format(new Date(order.createdAt.seconds * 1000), "MMM dd");
                            const existing = acc.find(item => item.date === date);
                            if (existing) {
                                existing.revenue += order.amount;
                            } else {
                                acc.push({ date, revenue: order.amount });
                            }
                        } catch (e) {
                            // Ignore invalid dates
                        }
                        return acc;
                    }, [])
                    .slice(-14);

                setRevenueChartData(revData);

                // Top Selling Products
                const topSelling = Object.values(productSales)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map(p => ({
                        name: p.name,
                        sales: p.count,
                        revenue: p.revenue
                    }));
                setTopSellingProducts(topSelling);

                // Sales by Category (Revenue based)
                const catRevenueData = Object.entries(categoryRevenue)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);
                setCategoryData(catRevenueData);

            } catch (error: any) {
                console.error("Error fetching dashboard data:", error);
                setError(error.message || "Failed to load dashboard data");
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

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <h3 className="font-bold mb-2">Error Loading Dashboard</h3>
                <p>{error}</p>
                <Button variant="outline" className="mt-4 border-red-300 text-red-800 hover:bg-red-100" onClick={() => window.location.reload()}>
                    Retry
                </Button>
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                        title="Total Product Views"
                        value={stats.totalViews}
                        icon={Eye}
                        description="Total views across all products"
                    />
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
                        value={formatPrice(stats.totalValue)}
                        icon={TrendingUp}
                        description="Total stock value"
                    />
                    <StatCard
                        title="Low Stock Alerts"
                        value={stats.lowStockProducts}
                        icon={AlertTriangle}
                        description="Products with stock ≤ 10"
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
                        value={formatPrice(stats.totalRevenue)}
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
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatPrice(value)} />
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
                                                        {formatPrice(product.price)}
                                                    </div>
                                                    {product.stock <= 10 && (
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
                                                    {product.stock <= 10 && (
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Low Stock</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-auto font-medium text-sm">{formatPrice(product.price)}</div>
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
                                                    <p className="text-sm font-bold">{formatPrice(order.amount)}</p>
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
                                                <p className="text-sm font-medium">{formatPrice(order.amount)}</p>
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

            {/* Top Selling & Category Sales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={topSellingProducts}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                                />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">Product</span>
                                                            <span className="font-bold text-muted-foreground">{label}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[0.70rem] uppercase text-muted-foreground">Sales</span>
                                                            <span className="font-bold">{payload[0].value}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Revenue by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatPrice(value as number)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-12">No sales data yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Most Viewed Products */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-12">
                    <CardHeader>
                        <CardTitle>Most Viewed Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {mostViewedProducts.map((product) => (
                                <div key={product.id} className="flex items-center">
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
                                        <p className="text-sm font-medium leading-none">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.category || "Uncategorized"}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm">
                                        {product.views || 0} views
                                    </div>
                                </div>
                            ))}
                            {mostViewedProducts.length === 0 && <p className="text-sm text-muted-foreground text-center">No views yet.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
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
                                        {lowStockItems.length === 0 ? (
                                            <tr>
                                                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                                                    No items are currently low on stock.
                                                </td>
                                            </tr>
                                        ) : (
                                            lowStockItems.map((product) => (
                                                <tr key={product.id} className="border-b bg-white/50 hover:bg-white last:border-0">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded bg-white border flex items-center justify-center overflow-hidden shrink-0">
                                                                {product.images && product.images[0] ? (
                                                                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Package className="h-5 w-5 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div className="font-medium text-sm">{product.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {product.category || "Uncategorized"}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                                                            {product.stock} left
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link to={`/admin/products/${product.id}/edit`}>
                                                                <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                                                                    Restock
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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
