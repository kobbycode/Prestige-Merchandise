import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone, MessageCircle, User, LogOut, ShoppingBag, Search, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CartSheet from "./cart/CartSheet";
import { NotificationDropdown } from "./notifications/NotificationDropdown";
import CurrencySelector from "./CurrencySelector";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-secondary text-secondary-foreground shadow-sm">
      <div className="container mx-auto px-4 py-2 md:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="relative flex items-center h-12 md:h-16 w-32 md:w-48 z-50">
            <img
              src={logo}
              alt="Prestige Merchandise"
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[120px] md:h-[160px] w-auto max-w-none transition-all hover:scale-105"
            />
          </Link>

          {/* Centered Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-sm mx-6">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search parts..."
                className="pl-8 h-9 bg-background/90 border-transparent focus:border-primary placeholder:text-muted-foreground text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-4">


            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-medium transition-colors ${location.pathname === link.to
                  ? "text-yellow-400 font-bold"
                  : "text-secondary-foreground/80 hover:text-white"
                  }`}
              >
                {link.label}
              </Link>
            ))}

            <CurrencySelector />

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

            {/* Wishlist Button */}
            <Link to="/account/wishlist">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-secondary-foreground hover:text-white hover:bg-white/10"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

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
                  <DropdownMenuItem asChild>
                    <Link to="/account/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      My Wishlist
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

            {/* Mobile Wishlist Button */}
            <Link to="/account/wishlist">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-secondary-foreground hover:text-white"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>

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
                    : "text-white hover:bg-white/10 hover:text-white"
                    }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-2">
                <CurrencySelector />
              </div>

              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="block py-2 px-3 rounded-md font-medium text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login / Register
                </Link>
              )}
              {isAuthenticated && (
                <>
                  <Link
                    to="/account"
                    className="block py-2 px-3 rounded-md font-medium text-white hover:bg-white/10 hover:text-white"
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
