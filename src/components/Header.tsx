import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone, MessageCircle, User, LogOut, ShoppingBag, Search, Heart, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types/product";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Loader2 } from "lucide-react";

import logo from "@/assets/logo.png";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useNotifications } from "@/contexts/NotificationContext";
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
  const { settings } = useStoreSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { formatPrice } = useCurrency();
  const location = useLocation();
  const navigate = useNavigate();

  // Trigger bounce animation when cart count changes
  useEffect(() => {
    if (cartCount > 0) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  // Live search suggestions effect
  useEffect(() => {
    const fetchSuggestions = async () => {
      const trimmedQuery = searchQuery.trim();
      if (trimmedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const productsRef = collection(db, "products");
        const q = query(
          productsRef,
          where("status", "==", "active"),
          where("name", ">=", trimmedQuery),
          where("name", "<=", trimmedQuery + "\uf8ff"),
          limit(5)
        );

        const querySnapshot = await getDocs(q);
        const results: Product[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as Product);
        });

        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close suggestions when location changes
  useEffect(() => {
    setShowSuggestions(false);
    setSearchQuery("");
  }, [location.pathname]);

  const handleSuggestionClick = (productId: string) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchQuery("");
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  const baseNavLinks = settings.menuItems?.filter(item => item.active).map(item => ({
    to: item.path,
    label: item.label
  })) || [
      { to: "/", label: "Home" },
      { to: "/shop?category=steering", label: "Steering Systems" },
      { to: "/services", label: "Services" },
      { to: "/blog", label: "Blog" },
      { to: "/parts", label: "Parts" },
      { to: "/fleet-solutions", label: "Fleet Solutions" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Book Diagnosis" },
    ];

  // Debug: Log all menu items before filtering
  console.log("Menu items before filter:", baseNavLinks);

  // Remove "Blog post", "Blog Post", or any variation, and items pointing to /blog/:slug
  const cleanedLinks = baseNavLinks.filter(link => {
    const labelLower = link.label.toLowerCase();
    const isBlogPost = labelLower === "blog post" || labelLower === "blog posts";
    const isBlogDetailPath = link.to.includes("/blog/");
    return !isBlogPost && !isBlogDetailPath;
  });

  console.log("Menu items after filter:", cleanedLinks);

  // Ensure only "Blog" is present
  const navLinks = cleanedLinks.some(link => link.to === "/blog")
    ? cleanedLinks
    : [...cleanedLinks.slice(0, 3), { to: "/blog", label: "Blog" }, ...cleanedLinks.slice(3)];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="relative flex items-center h-28 md:h-32 shrink-0 z-50">
            <img
              src={logo}
              alt="Prestige Merchandise"
              className="h-full w-auto object-contain transition-all hover:scale-105"
            />
          </Link>

          {/* Desktop Search Center */}
          <div className="hidden lg:flex flex-1 max-w-md mx-auto relative px-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search steering pumps, racks, parts..."
                  className="pl-9 h-10 w-full bg-white/10 border-transparent focus:border-primary text-white placeholder:text-gray-400 rounded-none transition-all focus:bg-white/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </form>

            {/* Desktop Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-popover border border-border bg-white text-black shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="py-2">
                  <p className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/50">
                    Quick Matches
                  </p>
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border/50 last:border-0"
                      onClick={() => handleSuggestionClick(product.id)}
                    >
                      <div className="h-10 w-10 shrink-0 bg-muted rounded-none overflow-hidden border border-border">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-primary font-bold">{formatPrice(product.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Sticky Call/Help Buttons */}
            <a href={`tel:${settings.phone?.replace(/\s/g, '')}`} className="hidden xl:flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-none transition-colors">
              <Phone className="h-4 w-4 text-primary" />
              <span>Call Now</span>
            </a>
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-2 px-3 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-none transition-colors mr-2"
            >
              <MessageCircle className="h-4 w-4 text-green-500" />
              <span>WhatsApp</span>
            </a>

            <nav className="flex items-center gap-4 mr-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-white/10 gap-2 rounded-none">
                      <User className="h-4 w-4" />
                      <span className="hidden xl:inline">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-none">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/orders" className="cursor-pointer">Orders</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/account/wishlist" className="cursor-pointer">Wishlist</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-red-500 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-white/10 rounded-none">Login</Button>
                </Link>
              )}
            </nav>

            {/* Notification Bell - Desktop */}
            <NotificationDropdown className="relative p-2 hover:bg-white/10 rounded-none" />

            <Button
              variant="ghost"
              size="icon"
              className={`relative hover:bg-white/10 rounded-none ${isCartBouncing ? "animate-bounce" : ""}`}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className={`h-5 w-5 ${isCartBouncing ? "text-primary" : ""}`} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </Button>
            <CurrencySelector />
          </div>
          {/* Mobile Actions */}
          <div className="flex items-center gap-1 lg:hidden">
            <a href={`tel:${settings.phone?.replace(/\s/g, '')}`} className="p-2 text-white hover:bg-white/10 rounded-none">
              <Phone className="h-5 w-5 text-primary" />
            </a>
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="p-2 text-white hover:bg-white/10 rounded-none">
              <MessageCircle className="h-5 w-5 text-green-500" />
            </a>

            <button
              className="p-2 text-white hover:bg-white/10 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Lower Nav (Categories) */}
      <div className="hidden lg:flex items-center justify-center py-2 mt-2 gap-8 text-sm border-t border-white/10">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`font-medium transition-colors hover:text-primary ${location.pathname === link.to.split('?')[0] ? "text-primary" : "text-gray-300"
              }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Mobile Lower Nav (Horizontal Scrollable) */}
      <div className="lg:hidden border-t border-white/10 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 px-4 py-2 min-w-max">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-none transition-colors ${location.pathname === link.to.split('?')[0]
                ? "text-primary bg-primary/10"
                : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Utility Menu (Hamburger) */}
      {isMenuOpen && (
        <nav className="lg:hidden pb-4 border-t border-white/10 pt-4 space-y-4 animate-in slide-in-from-top-5">
          <form onSubmit={handleSearch} className="relative px-4">
            <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search parts..."
              className="pl-9 h-10 w-full bg-white/10 border-transparent text-white placeholder:text-gray-400 focus:bg-white/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="px-4 space-y-2">
            <div className="flex items-center justify-around py-4 border-y border-white/10">
              {/* Wishlist */}
              <Link to="/account/wishlist" className="relative p-2 text-white hover:bg-white/10 rounded-lg flex flex-col items-center gap-1" onClick={() => setIsMenuOpen(false)}>
                <div className="relative">
                  <Heart className="h-6 w-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Wishlist</span>
              </Link>

              {/* Notifications */}
              <Link to="/notifications" className="relative p-2 text-white hover:bg-white/10 rounded-lg flex flex-col items-center gap-1" onClick={() => setIsMenuOpen(false)}>
                <div className="relative">
                  <NotificationDropdown className="p-0 hover:bg-transparent text-white" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Alerts</span>
              </Link>

              {/* Cart */}
              <button
                className="relative p-2 text-white hover:bg-white/10 rounded-lg flex flex-col items-center gap-1"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsCartOpen(true);
                }}
              >
                <div className="relative">
                  <ShoppingBag className="h-6 w-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Cart</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-3 rounded-none bg-green-600/20 text-green-400 font-medium hover:bg-green-600/30 transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              <Link
                to="/account"
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-4 w-4" /> Account
              </Link>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <CurrencySelector />
              {isAuthenticated && (
                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-red-400 text-sm font-medium flex items-center gap-1">
                  <LogOut className="h-3 w-3" /> Sign Out
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
      <CartSheet />
    </header>
  );
};

export default Header;

