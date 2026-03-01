import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./components/AppLayout";

// Lazy-loaded pages for code splitting (optimized for low-end devices)
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsuarios = lazy(() => import("./pages/admin/AdminUsuarios"));
const AdminInstituciones = lazy(() => import("./pages/admin/AdminInstituciones"));
const DirectorDashboard = lazy(() => import("./pages/director/DirectorDashboard"));
const InstitucionSetup = lazy(() => import("./pages/director/InstitucionSetup"));
const NivelesSetup = lazy(() => import("./pages/director/NivelesSetup"));
const PersonalRegistro = lazy(() => import("./pages/director/PersonalRegistro"));
const DirectorResultados = lazy(() => import("./pages/director/DirectorResultados"));
const DocenteDashboard = lazy(() => import("./pages/docente/DocenteDashboard"));
const EstudiantesRegistro = lazy(() => import("./pages/docente/EstudiantesRegistro"));
const Digitacion = lazy(() => import("./pages/docente/Digitacion"));
const DocenteResultados = lazy(() => import("./pages/docente/DocenteResultados"));
const EstudiantePrueba = lazy(() => import("./pages/estudiante/EstudiantePrueba"));
const EstudianteResultados = lazy(() => import("./pages/estudiante/EstudianteResultados"));
const EspecialistaDashboard = lazy(() => import("./pages/especialista/EspecialistaDashboard"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min cache for performance
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Index />} />

              {/* Admin routes */}
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrador']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['administrador']}><AdminUsuarios /></ProtectedRoute>} />
                <Route path="/admin/instituciones" element={<ProtectedRoute allowedRoles={['administrador']}><AdminInstituciones /></ProtectedRoute>} />
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
