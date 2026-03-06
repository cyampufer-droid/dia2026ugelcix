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

      // Load answer keys for all evaluaciones referenced
      const evalIds = [...new Set(pending.map(r => r.evaluacion_id))];
      const { data: evaluaciones } = await supabase
        .from('evaluaciones')
        .select('id, config_preguntas')
        .in('id', evalIds);

      const answerKeyMap: Record<string, string[]> = {};
      for (const ev of evaluaciones || []) {
        const config = ev.config_preguntas as { respuestas_correctas?: string[] } | null;
        if (config?.respuestas_correctas) {
          answerKeyMap[ev.id] = config.respuestas_correctas;
        }
      }

      let successCount = 0;
      let errorCount = 0;

      for (const record of pending) {
        // Calculate score by comparing against answer key
        const answerKey = answerKeyMap[record.evaluacion_id];
        let puntaje = 0;
        if (answerKey) {
          for (let i = 0; i < record.respuestas.length; i++) {
            if (record.respuestas[i] && record.respuestas[i] === answerKey[i]) {
              puntaje++;
            }
          }
        }

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
