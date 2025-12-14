import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { isAuthenticated, logout } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Package,
    FileText,
    LogOut,
    Menu,
    X
} from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/admin/login");
        }
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: Package, label: "Products", path: "/admin/products" },
        { icon: FileText, label: "Blog Posts", path: "/admin/blog" },
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
                    "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-secondary text-secondary-foreground border-r shadow-xl transform transition-transform duration-200 lg:transform-none",
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
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-2"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-5 w-5" />
                            Logout
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-secondary text-secondary-foreground border-b border-white/10 h-16 flex items-center px-4 lg:hidden">
                    <Button variant="ghost" size="icon" className="hover:bg-white/10 hover:text-white" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="ml-3 font-semibold text-primary">Admin Menu</span>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
