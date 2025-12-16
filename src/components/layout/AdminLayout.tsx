import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Package,
    FileText,
    LogOut,
    Menu,
    X,
    Settings,
    Shield,
    FolderTree,
    Star,
    ShoppingBag,
    User
} from "lucide-react";
import { NotificationDropdown } from "../notifications/NotificationDropdown";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { isAuthenticated, loading, logout, role } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate("/admin/login");
            } else if (role !== 'admin' && role !== 'super_admin') {
                // If user is authenticated as customer but access admin panel, deny access
                toast.error("Access Denied: You do not have admin permissions.");
                navigate("/"); // Redirect to shop home
            }
        }
    }, [isAuthenticated, role, loading, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate("/admin/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: ShoppingBag, label: "Orders", path: "/admin/orders" },
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: FolderTree, label: "Categories", path: "/admin/categories" },
        { icon: Star, label: "Reviews", path: "/admin/reviews" },
        { icon: FileText, label: "Blog Posts", path: "/admin/blog" },
        // Only show Admins management to super_admin
        ...(role === 'super_admin' ? [{ icon: Shield, label: "Manage Admins", path: "/admin/admins" }] : []),
        { icon: Settings, label: "Settings", path: "/admin/settings" },
        { icon: User, label: "Profile", path: "/admin/profile" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">

            {/* Mobile Sidebar Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity",
                    isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-secondary text-secondary-foreground border-r shadow-xl transform transition-transform duration-200 lg:transform-none print:hidden",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-white/10 flex items-center gap-3">
                        <img src={logo} alt="Logo" className="h-10 w-auto bg-white rounded-full p-1" />
                        <span className="font-bold text-lg text-primary">Admin Panel</span>
                        <button
                            className="ml-auto lg:hidden hover:text-primary"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path !== "/admin" && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium",
                                        isActive
                                            ? "bg-primary text-black font-bold shadow-md"
                                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    )}
                                    onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-white/10">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-2"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Logout
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Logout</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to log out of the admin panel?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogClose>
                                    <Button variant="destructive" onClick={handleLogout}>Logout</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-secondary text-secondary-foreground border-b border-white/10 h-16 flex items-center px-4 justify-between print:hidden">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="lg:hidden hover:bg-white/10 hover:text-white mr-2" onClick={() => setIsSidebarOpen(true)}>
                            <Menu className="h-6 w-6" />
                        </Button>
                        <span className="font-semibold text-primary lg:hidden">Admin Menu</span>
                    </div>

                    <div className="flex items-center gap-4 ml-auto">
                        <NotificationDropdown />
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
