import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Building2, GraduationCap, Save, Loader2, KeyRound, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface NivelGrado {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

const MiPerfil = () => {
  const { user, profile, roles, primaryRole, refreshProfile } = useAuth();
  const [institucionNombre, setInstitucionNombre] = useState<string | null>(null);
  const [nivelesGrados, setNivelesGrados] = useState<NivelGrado[]>([]);
  const [selectedGradoSeccion, setSelectedGradoSeccion] = useState(profile?.grado_seccion_id || '');
  const [aulaInfo, setAulaInfo] = useState<NivelGrado | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Dual role state
  const [togglingDocente, setTogglingDocente] = useState(false);
  const [docenteAulaId, setDocenteAulaId] = useState(profile?.grado_seccion_id || '');

  const isDirectorOrSub = roles.includes('director') || roles.includes('subdirector');
  const hasDocenteRole = roles.includes('docente');

  const roleLabels: Record<string, string> = {
    administrador: 'Administrador',
    director: 'Director(a)',
    subdirector: 'Subdirector(a)',
    docente: 'Docente',
    especialista: 'Especialista UGEL',
    estudiante: 'Estudiante',
    padre: 'Padre de Familia',
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (profile?.institucion_id) {
          const { data: inst } = await supabase
            .from('instituciones')
            .select('nombre')
            .eq('id', profile.institucion_id)
            .single();
          if (inst) setInstitucionNombre(inst.nombre);

          const { data: ng } = await supabase
            .from('niveles_grados')
            .select('id, nivel, grado, seccion')
            .eq('institucion_id', profile.institucion_id)
            .order('nivel')
            .order('grado')
            .order('seccion');
          setNivelesGrados(ng ?? []);
        }

        if (profile?.grado_seccion_id) {
          const { data: aula } = await supabase
            .from('niveles_grados')
            .select('id, nivel, grado, seccion')
            .eq('id', profile.grado_seccion_id)
            .single();
          if (aula) setAulaInfo(aula);
          setSelectedGradoSeccion(profile.grado_seccion_id);
          setDocenteAulaId(profile.grado_seccion_id);
        }
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [profile?.institucion_id, profile?.grado_seccion_id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ grado_seccion_id: selectedGradoSeccion || null })
        .eq('user_id', user.id);

      if (error) {
        toast.error('Error al actualizar: ' + (error.message || 'Intente nuevamente'));
        return;
      }

      const ng = nivelesGrados.find(n => n.id === selectedGradoSeccion);
      setAulaInfo(ng || null);
      await refreshProfile();
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      toast.error('Error de conexión. Verifique su internet e intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Contraseña actualizada correctamente');
    } catch (err: any) {
      toast.error('Error al cambiar contraseña: ' + (err.message || 'Error desconocido'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleDocente = async (activate: boolean) => {
    if (!user) return;
    
    if (activate && !docenteAulaId) {
      toast.error('Seleccione un aula antes de activar el rol docente');
      return;
    }

    setTogglingDocente(true);
    try {
      const { data, error } = await supabase.functions.invoke('toggle-docente-role', {
        body: {
          action: activate ? 'activate' : 'deactivate',
          grado_seccion_id: activate ? docenteAulaId : null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(activate ? 'Rol docente activado. Ahora tiene acceso a los módulos de docente.' : 'Rol docente desactivado.');
      
      // Refresh profile and roles
      await refreshProfile();
      
      if (!activate) {
        setDocenteAulaId('');
        setAulaInfo(null);
      }
    } catch (err: any) {
      toast.error('Error: ' + (err.message || 'Error desconocido'));
    } finally {
      setTogglingDocente(false);
    }
  };

  const canEditAula = primaryRole === 'docente' && !isDirectorOrSub;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Información de su cuenta y asignación</p>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">DNI</Label>
              <p className="font-mono font-medium">{profile?.dni || '—'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Rol(es)</Label>
              <div className="flex gap-1 flex-wrap mt-0.5">
                {roles.map(r => (
                  <Badge key={r} variant="secondary">{roleLabels[r] || r}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Apellidos y Nombres</Label>
            <p className="font-medium">{profile?.nombre_completo || '—'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Correo Electrónico</Label>
            <p className="text-sm">{user?.email || '—'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Institution Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Institución Educativa
          </CardTitle>
        </CardHeader>
        <CardContent>
          {institucionNombre ? (
            <p className="font-medium">{institucionNombre}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              No tiene institución asignada. Contacte a su director o administrador.
            </p>
          )}
        </CardContent>
      </Card>

      {/* También soy docente - only for directors/subdirectors */}
      {isDirectorOrSub && profile?.institucion_id && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              También soy Docente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si usted tiene un aula a cargo, active esta opción para acceder a los módulos de digitación de resultados y gestión de estudiantes.
            </p>

            {!hasDocenteRole ? (
              <div className="space-y-3">
                <div>
                  <Label>Seleccione su aula</Label>
                  <Select value={docenteAulaId} onValueChange={setDocenteAulaId}>
                    <SelectTrigger><SelectValue placeholder="Seleccione aula a cargo" /></SelectTrigger>
                    <SelectContent>
                      {nivelesGrados.map(ng => (
                        <SelectItem key={ng.id} value={ng.id}>
                          {ng.nivel} - {ng.grado} "{ng.seccion}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => handleToggleDocente(true)} 
                  disabled={togglingDocente || !docenteAulaId}
                  className="w-full"
                >
                  {togglingDocente ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
                  {togglingDocente ? 'Activando…' : 'Activar Rol Docente'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                  <Badge variant="default">Docente activo</Badge>
                  {aulaInfo && (
                    <span className="text-sm text-foreground">
                      {aulaInfo.nivel} - {aulaInfo.grado} "{aulaInfo.seccion}"
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleToggleDocente(false)} 
                  disabled={togglingDocente}
                  size="sm"
                >
                  {togglingDocente ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {togglingDocente ? 'Desactivando…' : 'Desactivar Rol Docente'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nivel / Grado / Sección - for pure docentes only */}
      {canEditAula && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Nivel / Grado / Sección
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.institucion_id && nivelesGrados.length > 0 && (
              <div className="space-y-3">
                {aulaInfo && (
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div>
                      <Label className="text-muted-foreground text-xs">Nivel actual</Label>
                      <p className="font-medium">{aulaInfo.nivel}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Grado actual</Label>
                      <p className="font-medium">{aulaInfo.grado}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Sección actual</Label>
                      <p className="font-medium">{aulaInfo.seccion}</p>
                    </div>
                  </div>
                )}
                <div>
                  <Label>Cambiar Nivel / Grado / Sección</Label>
                  <Select value={selectedGradoSeccion} onValueChange={setSelectedGradoSeccion}>
                    <SelectTrigger><SelectValue placeholder="Seleccione aula" /></SelectTrigger>
                    <SelectContent>
                      {nivelesGrados.map(ng => (
                        <SelectItem key={ng.id} value={ng.id}>
                          {ng.nivel} - {ng.grado} "{ng.seccion}"
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? 'Guardando…' : 'Guardar Cambios'}
                </Button>
              </div>
            )}

            {(!profile?.institucion_id || nivelesGrados.length === 0) && (
              <p className="text-muted-foreground text-sm">
                {!profile?.institucion_id
                  ? 'Debe tener una institución asignada para seleccionar un aula.'
                  : 'No hay aulas configuradas en su institución aún.'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aula info for estudiantes */}
      {primaryRole === 'estudiante' && aulaInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Nivel / Grado / Sección
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Nivel</Label>
                <p className="font-medium">{aulaInfo.nivel}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Grado</Label>
                <p className="font-medium">{aulaInfo.grado}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Sección</Label>
                <p className="font-medium">{aulaInfo.seccion}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="new-pass">Nueva contraseña</Label>
            <Input id="new-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <Label htmlFor="confirm-pass">Confirmar contraseña</Label>
            <Input id="confirm-pass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita la contraseña" />
          </div>
          <Button onClick={handleChangePassword} disabled={changingPassword || !newPassword}>
            {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <KeyRound className="h-4 w-4 mr-2" />}
            {changingPassword ? 'Cambiando…' : 'Cambiar Contraseña'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MiPerfil;
