import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Services from "./pages/Services";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import CustomerLogin from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Categories from "./pages/admin/Categories";
import BlogAdmin from "./pages/admin/Blog";
import BlogPostForm from "./pages/admin/BlogPostForm";
import Admins from "./pages/admin/Admins";
import Profile from "./pages/admin/Profile";
import ProductForm from "./pages/admin/ProductForm";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminReviews from "./pages/admin/Reviews";
import AdminSettings from "./pages/admin/Settings";
import AdminMessages from "./pages/admin/Messages";
import OrderDetail from "./pages/admin/OrderDetail";
import AdminLayout from "./components/layout/AdminLayout";
import CustomerProfile from "./pages/customer/Profile";
import OrderHistory from "./pages/customer/OrderHistory";
import CustomerOrderDetail from "./pages/customer/CustomerOrderDetail";
import Wishlist from "./pages/customer/Wishlist";
import TrackOrder from "./pages/customer/TrackOrder";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import ScrollToTop from "./components/ScrollToTop";
import InstallPrompt from "./components/InstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <NotificationProvider>
          <WishlistProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <InstallPrompt />
                <BrowserRouter>
                  <ScrollToTop />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPostDetail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/track" element={<TrackOrder />} />

                    {/* Customer Auth */}
                    <Route path="/login" element={<CustomerLogin />} />
                    <Route path="/register" element={<Register />} />

                    {/* Customer Account */}
                    <Route path="/account" element={<CustomerProfile />} />
                    <Route path="/account/wishlist" element={<Wishlist />} />
                    <Route path="/account/orders" element={<OrderHistory />} />
                    <Route path="/account/orders/:id" element={<CustomerOrderDetail />} />

                    {/* Admin Routes */}
                    <Route path="/admin/login" element={<Login />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="products" element={<Products />} />
                      <Route path="products/new" element={<ProductForm />} />
                      <Route path="products/:id/edit" element={<ProductForm />} />
                      <Route path="categories" element={<Categories />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="orders/:id" element={<OrderDetail />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="blog" element={<BlogAdmin />} />
                      <Route path="blog/new" element={<BlogPostForm />} />
                      <Route path="blog/:id/edit" element={<BlogPostForm />} />
                      <Route path="admins" element={<Admins />} />
                      <Route path="messages" element={<AdminMessages />} />
                      <Route path="settings" element={<AdminSettings />} />
                      <Route path="profile" element={<Profile />} />
                    </Route>

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </WishlistProvider>
        </NotificationProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider >
);

export default App;
