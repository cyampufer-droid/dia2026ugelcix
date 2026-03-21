import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';
import { Download, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExportUsersButtonProps {
  label?: string;
  fileName?: string;
}

const ExportUsersButton = ({ label = 'Exportar Excel', fileName = 'usuarios' }: ExportUsersButtonProps) => {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await invokeEdgeFunction('export-users', {});
      if (!data?.users?.length) {
        toast({ title: 'Sin datos', description: 'No hay usuarios para exportar.', variant: 'destructive' });
        return;
      }

      const rows = data.users.map((u: any, i: number) => ({
        'N°': i + 1,
        'DNI': u.dni,
        'Apellidos y Nombres': u.nombre_completo,
        'Rol': u.roles,
        'Correo': u.email,
        'Institución': u.institucion,
        'Distrito': u.distrito,
        'Centro Poblado': u.centro_poblado,
        'Tipo Gestión': u.tipo_gestion,
        'Nivel': u.nivel,
        'Grado': u.grado,
        'Sección': u.seccion,
        'PIP': u.is_pip ? 'Sí' : 'No',
        'Fecha Registro': u.created_at,
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      // Auto-size columns
      const colWidths = Object.keys(rows[0]).map(key => ({
        wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] || '').length)).toString().length + 2,
      }));
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);

      toast({ title: 'Exportación completada', description: `${data.total} usuarios exportados a Excel.` });
    } catch (err: any) {
      toast({ title: 'Error al exportar', description: err.message || 'Error desconocido', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={exporting}>
      {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      {exporting ? 'Exportando…' : label}
    </Button>
  );
};

export default ExportUsersButton;
