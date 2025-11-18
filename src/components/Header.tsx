import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaWhatsapp } from "react-icons/fa";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/about", label: "About" },
    { to: "/services", label: "Services" },
    { to: "/blog", label: "Blog" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="bg-secondary text-secondary-foreground sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src={logo} alt="Prestige Merchandise" className="h-12 w-12" />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-primary-foreground">The Prestige Merchandise</h1>
              <p className="text-xs text-secondary-foreground/80">Genuine Auto Parts</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-medium transition-colors ${
                  location.pathname === link.to 
                    ? "text-primary" 
                    : "text-secondary-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Contact Actions */}
          <div className="flex items-center gap-2">
            <a href="tel:0541234567" className="hidden md:block">
              <Button variant="outline" size="sm" className="gap-2">
                <Phone className="h-4 w-4" />
                054 123 4567
              </Button>
            </a>
            <a 
              href="https://wa.me/233247654321" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="default" size="sm" className="gap-2 bg-accent hover:bg-accent/90">
                <FaWhatsapp className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            </a>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-secondary-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-secondary-foreground/20 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block py-2 font-medium transition-colors ${
                  location.pathname === link.to 
                    ? "text-primary" 
                    : "text-secondary-foreground hover:text-primary"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <a href="tel:0541234567" className="block py-2 md:hidden">
              <Button variant="outline" size="sm" className="gap-2 w-full">
                <Phone className="h-4 w-4" />
                054 123 4567
              </Button>
            </a>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
