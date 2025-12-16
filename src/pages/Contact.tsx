import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
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
                        <h3 className="font-bold mb-1">Address</h3>
                        <p className="text-muted-foreground">
                          Abossey Okai, Near Total Filling Station
                          <br />
                          Accra, Ghana
                        </p>
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
                          📞 <a href="tel:0541234567" className="hover:text-primary">054 123 4567</a>
                          <br />
                          📱 WhatsApp: <a href="https://wa.me/233247654321" className="hover:text-primary">024 765 4321</a>
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
                          <a href="mailto:sales@prestigemerchgh.com" className="hover:text-primary">
                            sales@prestigemerchgh.com
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
                          Monday - Saturday: 8:00 AM - 6:00 PM
                          <br />
                          Sunday: Closed
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
            <Card className="shadow-card overflow-hidden">
              <div className="aspect-video w-full">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.9785673620366!2d-0.23194468523385496!3d5.583348195952327!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf998495c024dd%3A0xe5c1c46395701c95!2sAbossey%20Okai%20Spare%20Parts!5e0!3m2!1sen!2sgh!4v1710593456789!5m2!1sen!2sgh"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="The Prestige Merchandise Location"
                />
              </div>
            </Card>
            <p className="text-center text-muted-foreground mt-4">
              Located at Abossey Okai, near Total Filling Station
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
