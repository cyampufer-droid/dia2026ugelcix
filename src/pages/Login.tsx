import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, BookOpen, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Error de acceso', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(email, password, { dni, nombre_completo: nombre });
      toast({ title: 'Cuenta creada', description: 'Puede iniciar sesión.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-secondary">
              <GraduationCap className="h-8 w-8 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">UGEL Chiclayo</h1>
              <p className="text-sm opacity-80">Región Lambayeque</p>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Diagnóstico Integral de Aprendizajes
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Plataforma de evaluación educativa 2026 para medir y mejorar los aprendizajes de los estudiantes de la región.
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
            <div className="p-2 rounded-lg gradient-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">UGEL Chiclayo 2026</h1>
          </div>

          <Card className="shadow-card border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">Bienvenido</CardTitle>
              <CardDescription>Accede a la plataforma de diagnóstico</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Ingresar</TabsTrigger>
                  <TabsTrigger value="register">Registrarse</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
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
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="reg-dni">DNI</Label>
                      <Input id="reg-dni" value={dni} onChange={e => setDni(e.target.value)} required placeholder="12345678" maxLength={8} />
                    </div>
                    <div>
                      <Label htmlFor="reg-nombre">Nombre Completo</Label>
                      <Input id="reg-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Juan Pérez García" />
                    </div>
                    <div>
                      <Label htmlFor="reg-email">Correo electrónico</Label>
                      <Input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                      <Label htmlFor="reg-pass">Contraseña</Label>
                      <Input id="reg-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" minLength={6} />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Registrando…' : 'Crear Cuenta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
