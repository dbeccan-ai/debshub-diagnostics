import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import Dashboard from "./pages/Dashboard";
import Tests from "./pages/Tests";
import TakeTest from "./pages/TakeTest";
import Checkout from "./pages/Checkout";
import VerifyPayment from "./pages/VerifyPayment";
import Results from "./pages/Results";
import Curriculum from "./pages/Curriculum";
import AdminPendingReviews from "./pages/AdminPendingReviews";
import AdminInvitations from "./pages/AdminInvitations";
import AdminAllResults from "./pages/AdminAllResults";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import ManualGrading from "./pages/ManualGrading";
import SchoolSetup from "./pages/SchoolSetup";
import ReadingRecovery from "./pages/ReadingRecovery";
import ReadingRecoveryAuth from "./pages/ReadingRecoveryAuth";
import ReadingRecoveryDashboard from "./pages/ReadingRecoveryDashboard";
import ReadingRecoveryDiagnostic from "./pages/ReadingRecoveryDiagnostic";
import ReadingRecoveryResults from "./pages/ReadingRecoveryResults";
import ELADiagnosticHub from "./pages/ELADiagnosticHub";
import TakeELATest from "./pages/TakeELATest";
import Grade4Diagnostic from "./pages/Grade4Diagnostic";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Grade4Diagnostic />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/test/:attemptId" element={<TakeTest />} />
            <Route path="/checkout/:attemptId" element={<Checkout />} />
            <Route path="/verify-payment" element={<VerifyPayment />} />
            <Route path="/results/:attemptId" element={<Results />} />
            <Route path="/curriculum/:attemptId" element={<Curriculum />} />
            <Route path="/admin/pending-reviews" element={<AdminPendingReviews />} />
            <Route path="/admin/grade/:attemptId" element={<ManualGrading />} />
            <Route path="/admin/invitations" element={<AdminInvitations />} />
            <Route path="/admin/all-results" element={<AdminAllResults />} />
            <Route path="/register" element={<Register />} />
            <Route path="/school-setup" element={<SchoolSetup />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/reading-recovery" element={<ReadingRecovery />} />
            <Route path="/reading-recovery/auth" element={<ReadingRecoveryAuth />} />
            <Route path="/reading-recovery/dashboard" element={<ReadingRecoveryDashboard />} />
            <Route path="/reading-recovery/diagnostic" element={<ReadingRecoveryDiagnostic />} />
            <Route path="/reading-recovery/results/:transcriptId" element={<ReadingRecoveryResults />} />
            <Route path="/diagnostics/ela" element={<ELADiagnosticHub />} />
            <Route path="/diagnostics/ela/:grade" element={<TakeELATest />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
