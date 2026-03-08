import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface OnlineUser {
  nombre_completo: string;
  dni: string;
  last_seen: string;
}

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const OnlineUsersPanel = () => {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnline = async () => {
    setLoading(true);
    const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
    const { data } = await supabase
      .from('profiles')
      .select('nombre_completo, dni, last_seen')
      .gte('last_seen', threshold)
      .order('last_seen', { ascending: false });
    setUsers((data as OnlineUser[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOnline();
    const interval = setInterval(fetchOnline, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Wifi className="h-4 w-4 text-green-500" />
          Usuarios en Línea
          <Badge variant="secondary" className="ml-1">{users.length}</Badge>
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={fetchOnline} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay usuarios en línea en este momento.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {users.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">DNI: {u.dni}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(u.last_seen), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnlineUsersPanel;
