import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useStoreSettings();

  return (
    <footer className="bg-sidebar text-sidebar-foreground mt-auto border-t border-sidebar-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Book Diagnosis</Link></li>
              <li><Link to="/track" className="hover:text-primary transition-colors">Track Order</Link></li>
              <li><Link to="/contact?subject=fleet" className="hover:text-primary transition-colors">Fleet Solutions</Link></li>
            </ul>
          </div>

          {/* Steering Systems */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Steering Systems</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><Link to="/shop?category=steering_racks" className="hover:text-primary transition-colors">Steering Racks</Link></li>
              <li><Link to="/shop?category=power_steering_pumps" className="hover:text-primary transition-colors">Power Steering Pumps</Link></li>
              <li><Link to="/shop?category=eps_systems" className="hover:text-primary transition-colors">EPS Modules</Link></li>
              <li><Link to="/shop?category=steering_columns" className="hover:text-primary transition-colors">Columns & Shafts</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
             <h3 className="text-lg font-bold mb-4 text-white">Expert Services</h3>
             <ul className="space-y-2 text-gray-400 text-sm">
               <li><Link to="/services" className="hover:text-primary transition-colors">Hydraulic Repair</Link></li>
               <li><Link to="/services" className="hover:text-primary transition-colors">Electric Steering (EPS)</Link></li>
               <li><Link to="/services" className="hover:text-primary transition-colors">Leak & Noise Diagnosis</Link></li>
               <li><Link to="/services" className="hover:text-primary transition-colors">Rack Rebuilding</Link></li>
             </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary">Contact Us</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                 <span>📍</span>
                 <span>
                   {settings.location || "Abossey Okai, Accra, Ghana"}
                   {settings.locations && settings.locations.length > 0 && (
                     <span className="block text-xs mt-1 text-gray-500">Other branches: {settings.locations.join(", ")}</span>
                   )}
                 </span>
              </li>
              <li className="flex items-center gap-2">
                <span>📞</span>
                <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">{settings.phone}</a>
              </li>
              <li className="flex items-center gap-2">
                <span>📱</span> 
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: {settings.whatsappNumber}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>📧</span>
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a>
              </li>
              <li className="pt-2 border-t border-white/10 mt-2">
                <span className="block text-white font-semibold mb-1">Business Hours:</span>
                Mon-Sat: {settings.businessHours?.monSat || "8:00 AM - 6:00 PM"}
                <br />
                Sunday: {settings.businessHours?.sunday || "Closed"}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-sm text-gray-500">
          <p>Copyright © {currentYear} Prestige Steering Specialists. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
