import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHome from "./pages/admin/AdminHome";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminBlogPosts from "./pages/admin/AdminBlogPosts";
import AdminDiscountCodes from "./pages/admin/AdminDiscountCodes";
import AdminProductDiscounts from "./pages/admin/AdminProductDiscounts";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminSecondaryBanners from "./pages/admin/AdminSecondaryBanners";
import AdminShippingSettings from "./pages/admin/AdminShippingSettings";
import MyOrders from "./pages/MyOrders";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Consultation from "./pages/Consultation";
import AdminConsultations from "./pages/admin/AdminConsultations";
import CelebrityRoutines from "./pages/CelebrityRoutines";
import CelebrityRoutineDetails from "./pages/CelebrityRoutineDetails";
import AdminCelebrityRoutines from "./pages/admin/AdminCelebrityRoutines";
import AdminQuickLinks from "./pages/admin/AdminQuickLinks";
import AdminBrandsLinks from "./pages/admin/AdminBrandsLinks";
import AdminTertiaryBanners from "./pages/admin/AdminTertiaryBanners";
import AdminProblemCategories from "./pages/admin/AdminProblemCategories";
import ProblemSubCategories from "./pages/ProblemSubCategories";
import Guarantee from "./pages/Guarantee";
import Makeup from "./pages/Makeup";
import AdminMakeupBanner from "./pages/admin/AdminMakeupBanner";
import AdminMakeupCategories from "./pages/admin/AdminMakeupCategories";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/celebrity-routines" element={<CelebrityRoutines />} />
          <Route path="/celebrity-routines/:id" element={<CelebrityRoutineDetails />} />
          <Route path="/problems/:slug" element={<ProblemSubCategories />} />
          <Route path="/guarantee" element={<Guarantee />} />
          <Route path="/makeup" element={<Makeup />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="discount-codes" element={<AdminDiscountCodes />} />
            <Route path="product-discounts" element={<AdminProductDiscounts />} />
            <Route path="shipping-settings" element={<AdminShippingSettings />} />
            <Route path="blog-posts" element={<AdminBlogPosts />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="secondary-banners" element={<AdminSecondaryBanners />} />
            <Route path="tertiary-banners" element={<AdminTertiaryBanners />} />
            <Route path="quick-links" element={<AdminQuickLinks />} />
            <Route path="brands-links" element={<AdminBrandsLinks />} />
            <Route path="problem-categories" element={<AdminProblemCategories />} />
            <Route path="consultations" element={<AdminConsultations />} />
            <Route path="celebrity-routines" element={<AdminCelebrityRoutines />} />
            <Route path="makeup-banner" element={<AdminMakeupBanner />} />
            <Route path="makeup-categories" element={<AdminMakeupCategories />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
