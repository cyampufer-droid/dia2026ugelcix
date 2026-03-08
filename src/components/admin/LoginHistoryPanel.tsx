import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface LoginLog {
  id: string;
  nombre_completo: string;
  role: string;
  logged_in_at: string;
}

const roleLabels: Record<string, string> = {
  administrador: 'Admin',
  director: 'Director',
  subdirector: 'Subdir.',
  docente: 'Docente',
  especialista: 'Especialista',
  estudiante: 'Estudiante',
  padre: 'Padre',
};

const LoginHistoryPanel = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);

  const fetchLogs = async (count: number) => {
    setLoading(true);
    const { data } = await supabase
      .from('login_logs')
      .select('id, nombre_completo, role, logged_in_at')
      .order('logged_in_at', { ascending: false })
      .limit(count);
    setLogs((data as LoginLog[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs(limit);
  }, [limit]);

  const formatRole = (role: string) => {
    return role.split(', ').map(r => roleLabels[r.trim()] || r).join(', ');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Historial de Ingresos
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => fetchLogs(limit)} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay registros de ingresos aún.</p>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.nombre_completo}</p>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{formatRole(log.role)}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.logged_in_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </span>
                </div>
              ))}
            </div>
            {logs.length >= limit && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setLimit(prev => prev + 20)}
              >
                Cargar más
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LoginHistoryPanel;
