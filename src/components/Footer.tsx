import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-yellow-400">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-primary transition-colors">
                  Shop
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-primary transition-colors font-semibold text-yellow-400">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-yellow-400">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              {settings.locations && settings.locations.length > 0 ? (
                settings.locations.map((loc, idx) => (
                  <li key={idx}>📍 {loc}</li>
                ))
              ) : (
                <li>📍 {settings.location}</li>
              )}
              <li>📞 {settings.phone}</li>
              <li>📱 WhatsApp: {settings.whatsappNumber}</li>
              <li>📧 {settings.email}</li>
              <li className="pt-2">
                <strong>Business Hours:</strong>
                <br />
                Mon-Sat: {settings.businessHours?.monSat}
                <br />
                Sunday: {settings.businessHours?.sunday}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center text-sm">
          <p>Copyright © {currentYear} The Prestige Merchandise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
