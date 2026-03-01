import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";

// Director
import DirectorDashboard from "./pages/director/DirectorDashboard";
import InstitucionSetup from "./pages/director/InstitucionSetup";
import NivelesSetup from "./pages/director/NivelesSetup";
import PersonalRegistro from "./pages/director/PersonalRegistro";
import DirectorResultados from "./pages/director/DirectorResultados";

// Docente
import DocenteDashboard from "./pages/docente/DocenteDashboard";
import EstudiantesRegistro from "./pages/docente/EstudiantesRegistro";
import Digitacion from "./pages/docente/Digitacion";
import DocenteResultados from "./pages/docente/DocenteResultados";

// Estudiante
import EstudiantePrueba from "./pages/estudiante/EstudiantePrueba";
import EstudianteResultados from "./pages/estudiante/EstudianteResultados";

// Especialista
import EspecialistaDashboard from "./pages/especialista/EspecialistaDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />

            {/* Admin routes */}
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrador']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['administrador']}><AdminUsuarios /></ProtectedRoute>} />
              <Route path="/admin/instituciones" element={<ProtectedRoute allowedRoles={['administrador']}><InstitucionSetup /></ProtectedRoute>} />
            </Route>

            {/* Director routes */}
            <Route element={<AppLayout />}>
              <Route path="/director" element={<ProtectedRoute allowedRoles={['director', 'subdirector', 'administrador']}><DirectorDashboard /></ProtectedRoute>} />
              <Route path="/director/institucion" element={<ProtectedRoute allowedRoles={['director', 'subdirector', 'administrador']}><InstitucionSetup /></ProtectedRoute>} />
              <Route path="/director/niveles" element={<ProtectedRoute allowedRoles={['director', 'subdirector', 'administrador']}><NivelesSetup /></ProtectedRoute>} />
              <Route path="/director/personal" element={<ProtectedRoute allowedRoles={['director', 'subdirector', 'administrador']}><PersonalRegistro /></ProtectedRoute>} />
              <Route path="/director/resultados" element={<ProtectedRoute allowedRoles={['director', 'subdirector', 'administrador']}><DirectorResultados /></ProtectedRoute>} />
            </Route>

            {/* Docente routes */}
            <Route element={<AppLayout />}>
              <Route path="/docente" element={<ProtectedRoute allowedRoles={['docente', 'administrador']}><DocenteDashboard /></ProtectedRoute>} />
              <Route path="/docente/estudiantes" element={<ProtectedRoute allowedRoles={['docente', 'administrador']}><EstudiantesRegistro /></ProtectedRoute>} />
              <Route path="/docente/digitacion" element={<ProtectedRoute allowedRoles={['docente', 'administrador']}><Digitacion /></ProtectedRoute>} />
              <Route path="/docente/resultados" element={<ProtectedRoute allowedRoles={['docente', 'administrador']}><DocenteResultados /></ProtectedRoute>} />
            </Route>

            {/* Estudiante routes */}
            <Route element={<AppLayout />}>
              <Route path="/estudiante" element={<ProtectedRoute allowedRoles={['estudiante', 'administrador']}><EstudiantePrueba /></ProtectedRoute>} />
              <Route path="/estudiante/resultados" element={<ProtectedRoute allowedRoles={['estudiante', 'padre', 'administrador']}><EstudianteResultados /></ProtectedRoute>} />
            </Route>

            {/* Especialista routes */}
            <Route element={<AppLayout />}>
              <Route path="/especialista" element={<ProtectedRoute allowedRoles={['especialista', 'administrador']}><EspecialistaDashboard /></ProtectedRoute>} />
              <Route path="/especialista/reportes" element={<ProtectedRoute allowedRoles={['especialista', 'administrador']}><EspecialistaDashboard /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
