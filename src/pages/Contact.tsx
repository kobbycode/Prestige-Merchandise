import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useEffect } from "react";

const Contact = () => {
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    if (settings.locations && settings.locations.length > 0) {
      setLocations(settings.locations);
      setSelectedLocation(settings.locations[0]);
    } else if (settings.location) {
      // Fallback for legacy data not yet migrated or if array empty
      const locs = settings.location.split('/').map(l => l.trim()).filter(Boolean);
      setLocations(locs);
      if (locs.length > 0) {
        setSelectedLocation(locs[0]);
      }
    }
  }, [settings.locations, settings.location]);

  const [formData, setFormData] = useState({
    name: "",
    message: "",
    email: "",
    phone: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple validation
    if (!formData.name || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name and message.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would send to a server
    toast({
      title: "Message Sent!",
      description: "We'll get back to you as soon as possible.",
    });

    // Reset form
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Page Header */}
        <section className="bg-secondary text-secondary-foreground py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl opacity-90">Get in touch with us — we're here to help</p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Have questions about our products or services? We'd love to hear from you.
                Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-6">
                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Address{settings.locations && settings.locations.length > 1 ? 'es' : ''}</h3>
                        {settings.locations && settings.locations.length > 0 ? (
                          <div className="space-y-2">
                            {settings.locations.map((loc, idx) => (
                              <p key={idx} className="text-muted-foreground whitespace-pre-line border-l-2 border-primary/20 pl-2">
                                {loc}
                              </p>
                            ))}
                            <p className="text-muted-foreground mt-1">Accra, Ghana</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground whitespace-pre-line">
                            {settings.location}
                            <br />
                            Accra, Ghana
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Phone</h3>
                        <p className="text-muted-foreground">
                          📞 <a href={`tel:${settings.phone?.replace(/\s/g, '')}`} className="hover:text-primary">{settings.phone}</a>
                          <br />
                          📱 WhatsApp: <a href={`https://wa.me/${settings.whatsappNumber}`} className="hover:text-primary">{settings.whatsappNumber}</a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Email</h3>
                        <p className="text-muted-foreground">
                          <a href={`mailto:${settings.email}`} className="hover:text-primary">
                            {settings.email}
                          </a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">Business Hours</h3>
                        <p className="text-muted-foreground">
                          Monday - Saturday: {settings.businessHours?.monSat}
                          <br />
                          Sunday: {settings.businessHours?.sunday}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick WhatsApp Button */}
              <a
                href="https://wa.me/233247654321?text=Hello, I'd like to inquire about your auto parts"
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-6"
              >
                <Button size="lg" className="w-full gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Chat with Us on WhatsApp
                </Button>
              </a>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="shadow-card">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6">Send Us a Message</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-2">
                        Phone Number
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="024 000 0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Tell us what you need..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Google Map */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-6 text-center">Find Us on the Map</h2>

            {locations.length > 1 && (
              <div className="flex flex-col items-center mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center uppercase tracking-wider">Select a Branch to View</h3>
                <div className="flex justify-center gap-2 flex-wrap">
                  {locations.map((loc, index) => (
                    <Button
                      key={index}
                      variant={selectedLocation === loc ? "default" : "outline"}
                      onClick={() => setSelectedLocation(loc)}
                      className={`min-w-[120px] transition-all ${selectedLocation === loc ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      {/* Truncate if too long, or use first part */}
                      {loc.includes(',') ? loc.split(',')[0] : loc.substring(0, 20) + (loc.length > 20 ? '...' : '')}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Card className="shadow-card overflow-hidden">
              <div className="aspect-video w-full relative">
                <iframe
                  key={selectedLocation}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedLocation.trim())}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map showing ${selectedLocation}`}
                />
              </div>
            </Card>
            <div className="flex flex-col items-center mt-4 gap-2">
              <p className="text-center text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Selected: <span className="font-semibold text-foreground">{selectedLocation}</span></span>
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="link" className="text-primary gap-2">
                  Get Directions <div className="h-4 w-4 ml-1">↗</div>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
