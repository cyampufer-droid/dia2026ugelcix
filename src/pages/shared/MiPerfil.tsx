import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Building2, GraduationCap, Save, Loader2 } from 'lucide-react';

interface NivelGrado {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

const MiPerfil = () => {
  const { user, profile, roles, primaryRole } = useAuth();
  const [institucionNombre, setInstitucionNombre] = useState<string | null>(null);
  const [nivelesGrados, setNivelesGrados] = useState<NivelGrado[]>([]);
  const [selectedGradoSeccion, setSelectedGradoSeccion] = useState(profile?.grado_seccion_id || '');
  const [aulaInfo, setAulaInfo] = useState<NivelGrado | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
        // Fetch institution name
        if (profile?.institucion_id) {
          const { data: inst } = await supabase
            .from('instituciones')
            .select('nombre')
            .eq('id', profile.institucion_id)
            .single();
          if (inst) setInstitucionNombre(inst.nombre);

          // Fetch niveles/grados for the institution
          const { data: ng } = await supabase
            .from('niveles_grados')
            .select('id, nivel, grado, seccion')
            .eq('institucion_id', profile.institucion_id)
            .order('nivel')
            .order('grado')
            .order('seccion');
          setNivelesGrados(ng ?? []);
        }

        // Fetch current aula info
        if (profile?.grado_seccion_id) {
          const { data: aula } = await supabase
            .from('niveles_grados')
            .select('id, nivel, grado, seccion')
            .eq('id', profile.grado_seccion_id)
            .single();
          if (aula) setAulaInfo(aula);
          setSelectedGradoSeccion(profile.grado_seccion_id);
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

      if (error) throw error;

      // Update local aula info
      const ng = nivelesGrados.find(n => n.id === selectedGradoSeccion);
      setAulaInfo(ng || null);
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      toast.error('Error al actualizar: ' + (err.message || 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  };

  const canEditAula = primaryRole === 'docente' || primaryRole === 'estudiante';

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

      {/* Nivel / Grado / Sección */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <GraduationCap className="h-5 w-5" />
            Nivel / Grado / Sección
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aulaInfo && !canEditAula && (
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
          )}

          {canEditAula && profile?.institucion_id && nivelesGrados.length > 0 && (
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

          {!aulaInfo && !canEditAula && (
            <p className="text-muted-foreground text-sm">No tiene aula asignada.</p>
          )}

          {canEditAula && (!profile?.institucion_id || nivelesGrados.length === 0) && (
            <p className="text-muted-foreground text-sm">
              {!profile?.institucion_id
                ? 'Debe tener una institución asignada para seleccionar un aula.'
                : 'No hay aulas configuradas en su institución aún.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MiPerfil;
