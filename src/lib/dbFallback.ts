import { isSupabaseConfigured } from './supabase';

export function isQuotaError(error: any): boolean {
  const msg = error?.message?.toLowerCase() || '';
  // Check both direct message and potential JSON wrapped error
  return (
    msg.includes('quota exceeded') || 
    msg.includes('resource-exhausted') ||
    msg.includes('insufficient permissions') ||
    msg.includes('quota limit exceeded')
  );
}

export async function withFallback<T>(
  firebaseCall: () => Promise<T>,
  supabaseCall: () => Promise<T>,
  options?: {
    fallbackCondition?: (error: any) => boolean;
    dualWrite?: boolean; // If true, successfully writing to Firebase will also attempt to write to Supabase
  }
): Promise<T> {
  const { fallbackCondition, dualWrite } = options || {};
  
  try {
    const result = await firebaseCall();
    
    // If dualWrite is enabled and Firebase succeeded, attempt to sync to Supabase in background
    if (dualWrite && isSupabaseConfigured()) {
      supabaseCall().catch(err => console.warn('Dual-write to Supabase failed:', err));
    }
    
    return result;
  } catch (error: any) {
    console.error('Firebase failed:', error);
    
    if ((isQuotaError(error) || (fallbackCondition && fallbackCondition(error))) && isSupabaseConfigured()) {
      console.warn('Switching to Supabase fallback...');
      try {
        return await supabaseCall();
      } catch (supabaseError) {
        console.error('Supabase fallback also failed:', supabaseError);
        throw error;
      }
    }
    
    throw error;
  }
}

/**
 * A real-time fallback that switches to Supabase Realtime if Firebase hits quota.
 */
export function onSnapshotWithFallback<T>(
  onSnapshotFn: (onNext: (data: T) => void, onError: (error: any) => void) => () => void,
  supabasePollFn: (onNext: (data: T) => void) => Promise<void>,
  onNext: (data: T) => void,
  onError: (error: any) => void,
  pollInterval = 3000,
  supabaseTable?: string,
  filter?: string
): () => void {
  let unsub: (() => void) | null = null;
  let interval: any = null;
  let channel: any = null;
  let isFallbackActive = false;

  const startFallback = () => {
    if (isFallbackActive) return;
    isFallbackActive = true;
    console.warn(`Starting Supabase fallback for ${supabaseTable || 'general table'}...`);
    
    // Initial fetch
    supabasePollFn(onNext).catch(e => console.error('Fallback initial failed', e));
    
    // Try Supabase Realtime if table is provided
    if (supabaseTable && isSupabaseConfigured()) {
      import('./supabase').then(({ supabase }) => {
        channel = supabase
          .channel(`public:${supabaseTable}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: supabaseTable, filter }, () => {
            console.log('Supabase Realtime event, refreshing...');
            supabasePollFn(onNext).catch(e => console.error('Realtime refresh failed', e));
          })
          .subscribe();
      });
    } else {
      // Fallback to polling if no table/realtime
      interval = setInterval(() => {
        supabasePollFn(onNext).catch(e => console.error('Fallback poll failed', e));
      }, pollInterval);
    }

    // Every minute, try to reconnect to Firebase
    const reconnectInterval = setInterval(() => {
      console.log('Attempting to reconnect to Firebase...');
      let tempUnsub: (() => void) | null = null;
      tempUnsub = onSnapshotFn(
        (data) => {
          console.log('Firebase reconnected successfully!');
          onNext(data);
          isFallbackActive = false;
          if (interval) clearInterval(interval);
          if (channel) channel.unsubscribe();
          if (unsub) unsub();
          clearInterval(reconnectInterval);
          unsub = tempUnsub;
        },
        (error) => {
          if (isQuotaError(error)) {
            if (tempUnsub) tempUnsub();
          } else {
            onError(error);
          }
        }
      );
    }, 60000);
  };

  const startFirebase = () => {
    unsub = onSnapshotFn(
      (data) => onNext(data),
      (error) => {
        if (isQuotaError(error) && isSupabaseConfigured()) {
          startFallback();
        } else {
          onError(error);
        }
      }
    );
  };

  startFirebase();

  return () => {
    if (unsub) unsub();
    if (interval) clearInterval(interval);
    if (channel) channel.unsubscribe();
  };
}
