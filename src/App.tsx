import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

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
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/usuarios" element={<AdminUsuarios />} />
              <Route path="/admin/instituciones" element={<InstitucionSetup />} />
            </Route>

            {/* Director routes */}
            <Route element={<AppLayout />}>
              <Route path="/director" element={<DirectorDashboard />} />
              <Route path="/director/institucion" element={<InstitucionSetup />} />
              <Route path="/director/niveles" element={<NivelesSetup />} />
              <Route path="/director/personal" element={<PersonalRegistro />} />
              <Route path="/director/resultados" element={<DirectorResultados />} />
            </Route>

            {/* Docente routes */}
            <Route element={<AppLayout />}>
              <Route path="/docente" element={<DocenteDashboard />} />
              <Route path="/docente/estudiantes" element={<EstudiantesRegistro />} />
              <Route path="/docente/digitacion" element={<Digitacion />} />
              <Route path="/docente/resultados" element={<DocenteResultados />} />
            </Route>

            {/* Estudiante routes */}
            <Route element={<AppLayout />}>
              <Route path="/estudiante" element={<EstudiantePrueba />} />
              <Route path="/estudiante/resultados" element={<EstudianteResultados />} />
            </Route>

            {/* Especialista routes */}
            <Route element={<AppLayout />}>
              <Route path="/especialista" element={<EspecialistaDashboard />} />
              <Route path="/especialista/reportes" element={<EspecialistaDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
