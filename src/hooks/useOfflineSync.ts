import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getPendingDigitaciones, markAsSynced, clearSyncedRecords } from '@/lib/offlineDb';
import { useToast } from '@/hooks/use-toast';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshPendingCount = useCallback(async () => {
    const pending = await getPendingDigitaciones();
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const syncToCloud = useCallback(async () => {
    if (!isOnline) {
      toast({ title: 'Sin conexión', description: 'Espere a tener internet para sincronizar.', variant: 'destructive' });
      return;
    }

    setIsSyncing(true);
    try {
      const pending = await getPendingDigitaciones();
      if (pending.length === 0) {
        toast({ title: 'Todo sincronizado', description: 'No hay datos pendientes.' });
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const record of pending) {
        // Calculate score
        const puntaje = record.respuestas.filter(r => r !== '').length; // Simplified; real logic compares against key

        const { error } = await supabase
          .from('resultados')
          .upsert({
            estudiante_id: record.estudiante_id,
            evaluacion_id: record.evaluacion_id,
            respuestas_dadas: record.respuestas,
            puntaje_total: puntaje,
            fecha_sincronizacion: new Date().toISOString(),
          }, { onConflict: 'estudiante_id,evaluacion_id' })
          .select();

        if (error) {
          console.error('Sync error:', error);
          errorCount++;
        } else {
          await markAsSynced(record.id);
          successCount++;
        }
      }

      await clearSyncedRecords();
      await refreshPendingCount();

      toast({
        title: `Sincronización completada`,
        description: `${successCount} registros sincronizados${errorCount > 0 ? `, ${errorCount} errores` : ''}.`,
        variant: errorCount > 0 ? 'destructive' : 'default',
      });
    } catch (err) {
      console.error('Sync failed:', err);
      toast({ title: 'Error de sincronización', description: 'Intente nuevamente.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, toast, refreshPendingCount]);

  return { isOnline, pendingCount, isSyncing, syncToCloud, refreshPendingCount };
}
