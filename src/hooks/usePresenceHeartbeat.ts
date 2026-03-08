import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const HEARTBEAT_INTERVAL = 60_000; // 1 minute

export const usePresenceHeartbeat = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const updatePresence = async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch (e) {
        // silent
      }
    };

    // Immediate update
    updatePresence();

    const interval = setInterval(updatePresence, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);
};
