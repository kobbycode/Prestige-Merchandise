import { Link } from "react-router-dom";


const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-foreground">Quick Links</h3>
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
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-foreground">Contact Us</h3>
            <ul className="space-y-2 text-sm">
              <li>📍 Abossey Okai, Near Total Filling Station</li>
              <li>📞 054 123 4567</li>
              <li>📱 WhatsApp: 024 765 4321</li>
              <li>📧 sales@prestigemerchgh.com</li>
              <li className="pt-2">
                <strong>Business Hours:</strong>
                <br />
                Mon-Sat: 8am - 6pm
                <br />
                Sunday: Closed
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
