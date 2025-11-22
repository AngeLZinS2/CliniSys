import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Analytics from "./pages/admin/Analytics";
import Patients from "./pages/admin/Patients";
import Appointments from "./pages/admin/Appointments";
import Staff from "./pages/admin/Staff";
import Inventory from "./pages/admin/Inventory";
import PatientLayout from "./components/patient/PatientLayout";
import PatientDashboard from "./pages/patient/PatientDashboard";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientHistory from "./pages/patient/PatientHistory";
import PatientProfile from "./pages/patient/PatientProfile";
import AdminChat from "./pages/admin/Chat";
import PatientChat from "./pages/patient/Chat";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={
      <ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'receptionist']}>
        <AdminLayout />
      </ProtectedRoute>
    }>
      <Route index element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="analytics" element={<Analytics />} />
      <Route path="patients" element={<Patients />} />
      <Route path="appointments" element={<Appointments />} />
      <Route path="staff" element={<Staff />} />
      <Route path="inventory" element={<Inventory />} />
      <Route path="chat" element={<AdminChat />} />
    </Route>

    {/* Patient Routes */}
    <Route path="/patient" element={
      <ProtectedRoute allowedRoles={['patient']}>
        <PatientLayout />
      </ProtectedRoute>
    }>
      <Route index element={<Navigate to="/patient/dashboard" replace />} />
      <Route path="dashboard" element={<PatientDashboard />} />
      <Route path="appointments" element={<PatientAppointments />} />
      <Route path="history" element={<PatientHistory />} />
      <Route path="profile" element={<PatientProfile />} />
      <Route path="chat" element={<PatientChat />} />
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
