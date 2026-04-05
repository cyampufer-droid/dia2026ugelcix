import { useState, useEffect, useCallback } from 'react';
import { getPendingDigitaciones, markAsSynced, clearSyncedRecords } from '@/lib/offlineDb';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/invokeEdgeFunction';

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

      const records = pending.map(r => ({
        estudiante_id: r.estudiante_id,
        evaluacion_id: r.evaluacion_id,
        respuestas: r.respuestas,
      }));

      const result = await invokeEdgeFunction('save-digitacion', { records });
      const successCount = result?.success || 0;
      const errorCount = result?.errors || 0;

      if (successCount > 0) {
        for (const record of pending) {
          await markAsSynced(record.id);
        }
      }

      await clearSyncedRecords();
      await refreshPendingCount();

      toast({
        title: `Sincronización completada`,
        description: `${successCount} registros sincronizados${errorCount > 0 ? `, ${errorCount} errores` : ''}. Puntajes calculados automáticamente.`,
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
