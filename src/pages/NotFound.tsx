import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Home, ChevronLeft, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: Page not found (V1.2.1)");
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center animate-in fade-in zoom-in duration-500">
          <div className="relative mb-8">
            <h1 className="text-[150px] font-black text-primary/5 select-none leading-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background border-2 border-primary/20 rounded-2xl p-6 shadow-xl rotate-3">
                <Package className="h-12 w-12 text-primary animate-bounce-slow" />
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-4">Lost in the warehouse?</h2>
          <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
            The part you're looking for might have been moved or is currently out of stock. Let's get you back on track.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-xl"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Link to="/">
              <Button size="lg" className="w-full gap-2 rounded-xl shadow-lg shadow-primary/20">
                <Home className="h-4 w-4" />
                Head Home
              </Button>
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Quick Search</p>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Find a part..."
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigate(`/shop?search=${(e.target as HTMLInputElement).value}`);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
