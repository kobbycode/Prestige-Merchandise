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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Products
                const productsSnap = await getDocs(collection(db, "products"));
                const products: Product[] = [];
                let activeCount = 0;
                let lowStockCount = 0;
                let value = 0;
                const catCounts: Record<string, number> = {};

                productsSnap.forEach(doc => {
                    const p = { id: doc.id, ...doc.data() } as Product;
                    products.push(p);
                    if (p.status === 'active') activeCount++;
                    if (p.stock <= 5) lowStockCount++;
                    value += p.price * p.stock;

                    // Category counts
                    if (p.category) {
                        catCounts[p.category] = (catCounts[p.category] || 0) + 1;
                    }
                });

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

                // Fetch Recent Orders
                const recentOrdersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
                const recentOrdersSnap = await getDocs(recentOrdersQuery);
                const recentOrders: Order[] = [];
                recentOrdersSnap.forEach(doc => recentOrders.push({ id: doc.id, ...doc.data() } as Order));

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
                setRecentOrders(recentOrders);

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your store's performance</p>
                </div>
                <Link to="/admin/products/new">
                    <Button>Add Product</Button>
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
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Products by Category</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={categoryData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--primary))"} opacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentProducts.map((product) => (
                                <div key={product.id} className="flex items-center">
                                    <div className="h-9 w-9 rounded overflow-hidden bg-muted">
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
                                            <p className="text-xs text-muted-foreground">
                                                {product.category || "Uncategorized"}
                                            </p>
                                            {product.stock <= 5 && (
                                                <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Low Stock</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-auto font-medium text-sm">
                                        GH₵ {product.price.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                            {recentProducts.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center">No products added yet.</p>
                            )}

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
                        <CardTitle>Order Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {orderStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={orderStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {orderStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
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
                                <div key={order.id} className="flex items-center">
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {order.customerDetails.firstName} {order.customerDetails.lastName}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-muted-foreground">
                                                {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), "PPp") : "N/A"}
                                            </p>
                                            <Badge className={getStatusClassName(order.status)} variant="outline">
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-medium">GH₵ {order.amount.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                                        </div>
                                        <Link to={`/admin/orders/${order.id}`}>
                                            <Button variant="ghost" size="sm">
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {recentOrders.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center">No orders yet.</p>
                            )}

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
            </div>
        </div>
    );
};

export default Dashboard;
