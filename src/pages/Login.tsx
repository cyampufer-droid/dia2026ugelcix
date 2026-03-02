import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserFriendlyError } from '@/lib/errorMapper';
import diaLogo from '@/assets/dia_ugel_cix_2026.png';
import dgpLogo from '@/assets/logo_dgp_ugel_cix.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, primaryRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect authenticated users away from login
  useEffect(() => {
    if (!loading && user && primaryRole) {
      const roleRoutes: Record<string, string> = {
        administrador: '/admin',
        director: '/director',
        subdirector: '/director',
        docente: '/docente',
        especialista: '/especialista',
        estudiante: '/estudiante',
        padre: '/estudiante/resultados',
      };
      navigate(roleRoutes[primaryRole] || '/admin', { replace: true });
    }
  }, [loading, user, primaryRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      // Navigation is handled by the useEffect above
    } catch (err: any) {
      toast({ title: 'Error de acceso', description: getUserFriendlyError(err), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-accent blur-3xl" />
        </div>
        <div className="relative z-10 text-primary-foreground max-w-lg">
          <div className="flex items-center gap-4 mb-8">
            <img src={diaLogo} alt="DIA UGEL Chiclayo" className="h-20 w-20 object-contain" />
            <div>
              <h1 className="text-2xl font-bold">UGEL Chiclayo</h1>
              <p className="text-sm opacity-80">Dirección de Gestión Pedagógica</p>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Diagnóstico Integral de Aprendizajes
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Plataforma de evaluación educativa 2026 para medir y mejorar los aprendizajes de los estudiantes de la provincia de Chiclayo.
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary" />
              <span className="text-sm">Matemática · Lectura · Socioemocional</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Shield className="h-5 w-5 text-secondary" />
            <span className="text-sm">Protección de datos – Ley 29733</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={diaLogo} alt="DIA UGEL Chiclayo" className="h-14 w-14 object-contain" />
            <h1 className="text-xl font-bold text-foreground">UGEL Chiclayo 2026</h1>
          </div>

          <Card className="shadow-card border-border">
            <CardHeader className="text-center">
              <img src={dgpLogo} alt="DGP UGEL Chiclayo" className="h-16 w-16 object-contain rounded-full mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold text-foreground">Bienvenido</CardTitle>
              <CardDescription>Accede a la plataforma de diagnóstico</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
                </div>
                <div>
                  <Label htmlFor="login-pass">Contraseña</Label>
                  <Input id="login-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Las cuentas son creadas por el administrador o director de su institución.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
