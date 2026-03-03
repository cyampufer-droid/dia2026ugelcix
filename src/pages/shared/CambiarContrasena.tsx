import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import diaLogo from '@/assets/dia_ugel_cix_2026.png';

const CambiarContrasena = () => {
  const { user, profile, primaryRole, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    // Prevent using DNI as the new password
    if (profile?.dni && newPassword === profile.dni) {
      toast.error('La nueva contraseña no puede ser igual a su DNI');
      return;
    }

    setSaving(true);
    try {
      // Update auth password
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;

      // Clear flag
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ must_change_password: false } as any)
          .eq('user_id', user.id);
        if (profileError) throw profileError;
      }

      // Refresh profile in context
      await refreshProfile();

      toast.success('Contraseña actualizada correctamente');

      // Navigate to role dashboard
      const roleRoutes: Record<string, string> = {
        administrador: '/admin',
        director: '/director',
        subdirector: '/director',
        docente: '/docente',
        especialista: '/especialista',
        estudiante: '/estudiante',
        padre: '/estudiante/resultados',
      };
      navigate(primaryRole ? (roleRoutes[primaryRole] || '/') : '/', { replace: true });
    } catch (err: any) {
      toast.error('Error: ' + (err.message || 'No se pudo cambiar la contraseña'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <img src={diaLogo} alt="DIA UGEL Chiclayo" className="h-14 w-14 object-contain" />
          <h1 className="text-xl font-bold text-foreground">DIA 2026</h1>
        </div>

        <Card className="shadow-card border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl font-bold">Cambio de Contraseña Obligatorio</CardTitle>
            <CardDescription>
              Por seguridad, debe cambiar su contraseña en su primer inicio de sesión. La nueva contraseña no puede ser igual a su DNI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChange} className="space-y-4">
              <div>
                <Label htmlFor="new-pass">Nueva contraseña</Label>
                <Input
                  id="new-pass"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirm-pass">Confirmar contraseña</Label>
                <Input
                  id="confirm-pass"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita la contraseña"
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving || !newPassword}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
                {saving ? 'Guardando…' : 'Cambiar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CambiarContrasena;
