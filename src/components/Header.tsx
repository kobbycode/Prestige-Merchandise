import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone, MessageCircle, User, LogOut, ShoppingBag, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartSheet from "./cart/CartSheet";
import { NotificationDropdown } from "./notifications/NotificationDropdown";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    { to: "/blog", label: "Blog" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-secondary/90 backdrop-blur-md supports-[backdrop-filter]:bg-secondary/60 text-secondary-foreground shadow-sm">
      <div className="container mx-auto px-4 py-2 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="Prestige Merchandise" className="h-12 w-auto md:h-20 transition-all" />
            <div className="hidden sm:block">
              <h1 className="text-lg md:text-xl font-bold text-secondary-foreground">The Prestige Merchandise</h1>
              <p className="text-[10px] md:text-xs text-secondary-foreground/80">Genuine Auto Parts</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">

            {/* Global Search Bar */}
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search parts..."
                className="pl-8 h-9 bg-background/90 border-transparent focus:border-primary placeholder:text-muted-foreground text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-medium transition-colors ${location.pathname === link.to
                  ? "text-white font-bold"
                  : "text-secondary-foreground/80 hover:text-white"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-secondary-foreground hover:text-white hover:bg-white/10"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* Notification Dropdown */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Auth Button / Dropdown */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-secondary-foreground hover:text-white hover:bg-white/10">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders" className="cursor-pointer">
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="icon" title="Login" className="text-secondary-foreground hover:text-white hover:bg-white/10">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            {/* Mobile Notification */}
            {isAuthenticated && <NotificationDropdown className="text-secondary-foreground hover:text-white hover:bg-white/10" />}

            {/* Mobile Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-secondary-foreground hover:text-white"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>

            <a
              href="https://wa.me/233247654321"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:scale-110 transition-transform"
            >
              <FaWhatsapp className="h-6 w-6 md:h-8 md:w-8" />
            </a>

            {/* Mobile Menu Button */}
            <button
              className="p-2 text-secondary-foreground hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t pt-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search parts..."
                className="pl-8 h-10 w-full bg-background/90 text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`block py-2 px-3 rounded-md font-medium transition-colors ${location.pathname === link.to
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="block py-2 px-3 rounded-md font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login / Register
                </Link>
              )}
              {isAuthenticated && (
                <>
                  <Link
                    to="/account"
                    className="block py-2 px-3 rounded-md font-medium text-foreground/80 hover:bg-muted hover:text-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-3" onClick={() => { logout(); setIsMenuOpen(false); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </>
              )}
            </div>
          </nav>
        )}
        <CartSheet />
      </div>
    </header>
  );
};

export default Header;
