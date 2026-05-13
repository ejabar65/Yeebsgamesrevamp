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
 * A simplified real-time fallback that switches to Supabase polling if Firebase hits quota.
 */
export function onSnapshotWithFallback<T>(
  onSnapshotFn: (onNext: (data: T) => void, onError: (error: any) => void) => () => void,
  supabasePollFn: (onNext: (data: T) => void) => Promise<void>,
  onNext: (data: T) => void,
  onError: (error: any) => void,
  pollInterval = 10000
): () => void {
  let unsub: (() => void) | null = null;
  let interval: any = null;
  let isFallbackActive = false;

  const startFallback = () => {
    if (isFallbackActive) return;
    isFallbackActive = true;
    console.warn('Starting Supabase polling fallback...');
    
    // Initial fetch
    supabasePollFn(onNext).catch(e => console.error('Fallback poll initial failed', e));
    
    let reconnectCounter = 0;
    // Set up interval
    interval = setInterval(() => {
      // Every 6 polls (approx 1 min at 10s interval), try to reconnect to Firebase
      reconnectCounter++;
      if (reconnectCounter >= 6) {
        reconnectCounter = 0;
        console.log('Attempting to reconnect to Firebase...');
        
        let tempUnsub: (() => void) | null = null;
        tempUnsub = onSnapshotFn(
          (data) => {
            console.log('Firebase reconnected successfully!');
            onNext(data);
            isFallbackActive = false;
            if (interval) clearInterval(interval);
            if (unsub) unsub();
            unsub = tempUnsub;
          },
          (error) => {
            if (isQuotaError(error)) {
              console.log('Firebase still on quota, staying on fallback...');
              if (tempUnsub) tempUnsub();
            } else {
              onError(error);
            }
          }
        );
      }

      supabasePollFn(onNext).catch(e => console.error('Fallback poll failed', e));
    }, pollInterval);
  };

  const startFirebase = () => {
    unsub = onSnapshotFn(
      (data) => onNext(data),
      (error) => {
        if (isQuotaError(error) && isSupabaseConfigured()) {
          onError(error); // Still inform the UI of the error
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
  };
}
