import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import { Loader2, KeyRound, Trash2 } from 'lucide-react';

interface Student {
  id: string;
  user_id?: string;
  dni: string;
  nombre_completo: string;
  email: string;
  grado_seccion_id?: string | null;
}

interface Aula {
  id: string;
  nivel: string;
  grado: string;
  seccion: string;
}

interface EditStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  aulas?: Aula[];
}

const EditStudentDialog = ({ student, open, onOpenChange, onSaved, aulas = [] }: EditStudentDialogProps) => {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [gradoSeccionId, setGradoSeccionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const { toast } = useToast();

  // Sync form when student changes
  const handleOpenChange = (v: boolean) => {
    if (v && student) {
      setDni(student.dni);
      setNombre(student.nombre_completo);
      setGradoSeccionId(student.grado_seccion_id || '');
    }
    onOpenChange(v);
  };

  if (!student) return null;

  const isOrphan = !student.grado_seccion_id;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{8}$/.test(dni)) {
      toast({ title: 'Error', description: 'DNI debe ser exactamente 8 dígitos', variant: 'destructive' });
      return;
    }
    if (!nombre.trim()) {
      toast({ title: 'Error', description: 'Nombre es requerido', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setAction('update');
    try {
      const newEmail = `${dni}@dia.ugel.local`;
      const payload: any = {
        action: 'update',
        user_id: student.user_id,
        dni,
        nombre_completo: nombre.trim(),
        email: newEmail,
      };
      // If assigning an aula to orphan student
      if (isOrphan && gradoSeccionId) {
        payload.grado_seccion_id = gradoSeccionId;
      }
      await invokeEdgeFunction('manage-user', payload);
      toast({ title: 'Estudiante actualizado', description: nombre.trim() });
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al actualizar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleResetPassword = async () => {
    setIsLoading(true);
    setAction('reset');
    try {
      await invokeEdgeFunction('manage-user', {
        action: 'reset-password',
        user_id: student.user_id,
      });
      toast({ title: 'Contraseña reseteada', description: `La nueva contraseña es el DNI: ${student.dni}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al resetear contraseña', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setAction('delete');
    try {
      await invokeEdgeFunction('manage-user', {
        action: 'delete',
        user_id: student.user_id,
      });
      toast({ title: 'Estudiante eliminado', description: student.nombre_completo });
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Error al eliminar', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Estudiante</DialogTitle>
          <DialogDescription>Modifique los datos del estudiante. El correo se actualiza automáticamente según el DNI.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 mt-2">
          <div>
            <Label>DNI del Estudiante</Label>
            <Input value={dni} onChange={e => setDni(e.target.value)} required maxLength={8} pattern="\d{8}" placeholder="12345678" />
          </div>
          <div>
            <Label>Apellidos y Nombres</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="García Pérez María" />
          </div>
          {isOrphan && aulas.length > 0 && (
            <div>
              <Label className="text-destructive">Asignar Aula (requerido)</Label>
              <Select value={gradoSeccionId} onValueChange={setGradoSeccionId}>
                <SelectTrigger><SelectValue placeholder="Seleccione aula" /></SelectTrigger>
                <SelectContent>
                  {aulas.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nivel} - {a.grado} "{a.seccion}"</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Este estudiante no tiene aula asignada. Seleccione una para que aparezca correctamente.</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && action === 'update' ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</> : 'Guardar Cambios'}
          </Button>
        </form>

        <div className="flex gap-2 mt-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={handleResetPassword} disabled={isLoading} className="flex-1">
            {isLoading && action === 'reset' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
            Resetear Contraseña
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isLoading} className="flex-1">
                <Trash2 className="h-4 w-4 mr-1" />Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará permanentemente a <strong>{student.nombre_completo}</strong> (DNI: {student.dni}) y todos sus resultados. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isLoading && action === 'delete' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;
