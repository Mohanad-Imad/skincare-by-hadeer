import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import { FloatingReviewButton } from "./components/FloatingReviewButton";
import { DynamicTheme } from "./components/DynamicTheme";
import { DynamicMetadata } from "./components/DynamicMetadata";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { PWASplashScreen } from "./components/PWASplashScreen";

// Lazy load non-critical routes for better performance
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Consultation = lazy(() => import("./pages/Consultation"));
const CelebrityRoutines = lazy(() => import("./pages/CelebrityRoutines"));
const CelebrityRoutineDetails = lazy(() => import("./pages/CelebrityRoutineDetails"));
const ProblemSubCategories = lazy(() => import("./pages/ProblemSubCategories"));
const Guarantee = lazy(() => import("./pages/Guarantee"));
const Makeup = lazy(() => import("./pages/Makeup"));
const SubmitReview = lazy(() => import("./pages/SubmitReview"));
const Profile = lazy(() => import("./pages/Profile"));

// Admin pages - lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminBlogPosts = lazy(() => import("./pages/admin/AdminBlogPosts"));
const AdminDiscountCodes = lazy(() => import("./pages/admin/AdminDiscountCodes"));
const AdminProductDiscounts = lazy(() => import("./pages/admin/AdminProductDiscounts"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners"));
const AdminSecondaryBanners = lazy(() => import("./pages/admin/AdminSecondaryBanners"));
const AdminShippingSettings = lazy(() => import("./pages/admin/AdminShippingSettings"));
const AdminConsultations = lazy(() => import("./pages/admin/AdminConsultations"));
const AdminCelebrityRoutines = lazy(() => import("./pages/admin/AdminCelebrityRoutines"));
const AdminQuickLinks = lazy(() => import("./pages/admin/AdminQuickLinks"));
const AdminBrandsLinks = lazy(() => import("./pages/admin/AdminBrandsLinks"));
const AdminTertiaryBanners = lazy(() => import("./pages/admin/AdminTertiaryBanners"));
const AdminProblemCategories = lazy(() => import("./pages/admin/AdminProblemCategories"));
const AdminMakeupBanner = lazy(() => import("./pages/admin/AdminMakeupBanner"));
const AdminMakeupCategories = lazy(() => import("./pages/admin/AdminMakeupCategories"));
const AdminStoreSettings = lazy(() => import("./pages/admin/AdminStoreSettings"));
const AdminCustomerReviews = lazy(() => import("./pages/admin/AdminCustomerReviews"));
const AdminProductReviews = lazy(() => import("./pages/admin/AdminProductReviews"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminGuarantee = lazy(() => import("./pages/admin/AdminGuarantee"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <DynamicTheme />
        <DynamicMetadata />
        <PWASplashScreen />
        <PWAInstallPrompt />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <FloatingReviewButton />
          <Suspense fallback={<div className="min-h-screen" />}>
            <Routes>
              <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/categories" element={<Categories />} />
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
          <Route path="/submit-review" element={<SubmitReview />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="customer-reviews" element={<AdminCustomerReviews />} />
            <Route path="product-reviews" element={<AdminProductReviews />} />
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
            <Route path="store-settings" element={<AdminStoreSettings />} />
            <Route path="guarantee" element={<AdminGuarantee />} />
          </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
