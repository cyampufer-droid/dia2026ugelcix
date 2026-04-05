import { useState, useEffect, useCallback } from 'react';
import { getPendingDigitaciones, markAsSynced, clearSyncedRecords } from '@/lib/offlineDb';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

      // Fetch answer keys for score calculation
      const evalIds = [...new Set(records.map(r => r.evaluacion_id))];
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

      const upsertRows = records.map(r => {
        const answerKey = answerKeyMap[r.evaluacion_id] || [];
        let puntaje = 0;
        for (let i = 0; i < r.respuestas.length; i++) {
          if (r.respuestas[i] && answerKey[i] && r.respuestas[i] === answerKey[i]) puntaje++;
        }
        return {
          estudiante_id: r.estudiante_id,
          evaluacion_id: r.evaluacion_id,
          respuestas_dadas: r.respuestas,
          puntaje_total: puntaje,
          fecha_sincronizacion: new Date().toISOString(),
        };
      });

      let successCount = 0;
      let errorCount = 0;
      const BATCH_SIZE = 50;

      for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
        const batch = upsertRows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase
          .from('resultados')
          .upsert(batch, { onConflict: 'estudiante_id,evaluacion_id' });

        if (error) {
          console.error('Sync batch upsert error:', error);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          for (const row of batch) {
            const record = pending.find(p => p.estudiante_id === row.estudiante_id && p.evaluacion_id === row.evaluacion_id);
            if (record) await markAsSynced(record.id);
          }
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
