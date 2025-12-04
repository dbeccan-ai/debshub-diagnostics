import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tests from "./pages/Tests";
import TakeTest from "./pages/TakeTest";
import Checkout from "./pages/Checkout";
import VerifyPayment from "./pages/VerifyPayment";
import Results from "./pages/Results";
import AdminPendingReviews from "./pages/AdminPendingReviews";
import AdminInvitations from "./pages/AdminInvitations";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/test/:attemptId" element={<TakeTest />} />
          <Route path="/checkout/:attemptId" element={<Checkout />} />
          <Route path="/verify-payment" element={<VerifyPayment />} />
          <Route path="/results/:attemptId" element={<Results />} />
          <Route path="/admin/pending-reviews" element={<AdminPendingReviews />} />
          <Route path="/admin/invitations" element={<AdminInvitations />} />
          <Route path="/register" element={<Register />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
