import { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import ChatbotWidget from "./components/ChatbotWidget";
import { lazyRetry } from "@/lib/lazyRetry";

// Lazy-loaded pages with retry logic for chunk loading failures
const Index = lazyRetry(() => import("./pages/Index"));
const Login = lazyRetry(() => import("./pages/Login"));
const NotFound = lazyRetry(() => import("./pages/NotFound"));
const AdminDashboard = lazyRetry(() => import("./pages/admin/AdminDashboard"));
const AdminUsuarios = lazyRetry(() => import("./pages/admin/AdminUsuarios"));
const AdminInstituciones = lazyRetry(() => import("./pages/admin/AdminInstituciones"));
const AdminResultados = lazyRetry(() => import("./pages/admin/AdminResultados"));
const DirectorDashboard = lazyRetry(() => import("./pages/director/DirectorDashboard"));
const InstitucionSetup = lazyRetry(() => import("./pages/director/InstitucionSetup"));
const NivelesSetup = lazyRetry(() => import("./pages/director/NivelesSetup"));
const PersonalRegistro = lazyRetry(() => import("./pages/director/PersonalRegistro"));
const DirectorResultados = lazyRetry(() => import("./pages/director/DirectorResultados"));
const DocenteDashboard = lazyRetry(() => import("./pages/docente/DocenteDashboard"));
const EstudiantesRegistro = lazyRetry(() => import("./pages/docente/EstudiantesRegistro"));
const Digitacion = lazyRetry(() => import("./pages/docente/Digitacion"));
const DocenteResultados = lazyRetry(() => import("./pages/docente/DocenteResultados"));
const EstudiantePrueba = lazyRetry(() => import("./pages/estudiante/EstudiantePrueba"));
const EstudianteResultados = lazyRetry(() => import("./pages/estudiante/EstudianteResultados"));
const EspecialistaDashboard = lazyRetry(() => import("./pages/especialista/EspecialistaDashboard"));
const EspecialistaUsuarios = lazyRetry(() => import("./pages/especialista/EspecialistaUsuarios"));
const PlanesRefuerzoListing = lazyRetry(() => import("./pages/shared/PlanesRefuerzoListing"));
const MiPerfil = lazyRetry(() => import("./pages/shared/MiPerfil"));
const GuiaUsuario = lazyRetry(() => import("./pages/shared/GuiaUsuario"));
const TutorialInteractivo = lazyRetry(() => import("./pages/shared/TutorialInteractivo"));
const CambiarContrasena = lazyRetry(() => import("./pages/shared/CambiarContrasena"));
const MigracionDatos = lazyRetry(() => import("./pages/admin/MigracionDatos"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/cambiar-contrasena" element={<CambiarContrasena />} />
                <Route path="/" element={<Index />} />

                {/* Admin routes */}
                <Route element={<AppLayout />}>
                  <Route path="/admin" element={<ProtectedRoute allowedRoles={['administrador']}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['administrador']}><AdminUsuarios /></ProtectedRoute>} />
                  <Route path="/admin/instituciones" element={<ProtectedRoute allowedRoles={['administrador']}><AdminInstituciones /></ProtectedRoute>} />
                  <Route path="/admin/resultados" element={<ProtectedRoute allowedRoles={['administrador']}><AdminResultados /></ProtectedRoute>} />
                  <Route path="/admin/planes-refuerzo" element={<ProtectedRoute allowedRoles={['administrador']}><PlanesRefuerzoListing /></ProtectedRoute>} />
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
                  <Route path="/especialista/usuarios" element={<ProtectedRoute allowedRoles={['especialista', 'administrador']}><EspecialistaUsuarios /></ProtectedRoute>} />
                  <Route path="/especialista/reportes" element={<ProtectedRoute allowedRoles={['especialista', 'administrador']}><EspecialistaDashboard /></ProtectedRoute>} />
                  <Route path="/especialista/planes-refuerzo" element={<ProtectedRoute allowedRoles={['especialista', 'administrador']}><PlanesRefuerzoListing /></ProtectedRoute>} />
                </Route>

                {/* Shared routes */}
                <Route element={<AppLayout />}>
                  <Route path="/perfil" element={<ProtectedRoute allowedRoles={['director', 'subdirector', 'docente', 'estudiante', 'especialista', 'administrador']}><MiPerfil /></ProtectedRoute>} />
                </Route>

                <Route path="/guia" element={<GuiaUsuario />} />
                <Route path="/tutorial" element={<TutorialInteractivo />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatbotWidget />
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
