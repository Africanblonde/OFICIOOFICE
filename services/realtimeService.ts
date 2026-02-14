import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

type RealtimePayload = any;

/**
 * Subscribes to Postgres changes on common public tables and calls `onChange` for each payload.
 * Returns an unsubscribe function.
 */
export function subscribeToPublicTables(supabase: SupabaseClient, onChange: (payload: RealtimePayload) => void) {
  // Create a channel name that's descriptive
  const channel = supabase.channel('public-all-changes');

  // Subscribe to changes for a set of tables. Using event='*' will get INSERT/UPDATE/DELETE
  const tables = ['inventory', 'requisitions', 'transactions', 'invoices', 'items', 'users', 'requisition_sheets', 'requisition_sheet_items', 'fichas_individuais', 'chat_messages', 'chat_groups', 'chat_file_attachments', 'chat_group_members'];

  for (const table of tables) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      try {
        onChange(payload);
      } catch (err) {
        // swallow handler errors to avoid breaking the realtime channel
        // caller should handle logging
        // eslint-disable-next-line no-console
        console.error('Realtime handler error:', err);
      }
    });
  }

  // Subscribe (returns a Promise-like object). We don't await here to avoid blocking.
  channel.subscribe();

  // Unsubscribe helper (try multiple APIs for compatibility)
  const unsubscribe = async () => {
    try {
      // v2 API: unsubscribe on channel
      // @ts-ignore
      if (channel.unsubscribe) await channel.unsubscribe();
    } catch (err) {
      // ignore
    }
    try {
      // fallback: remove channel from client
      // @ts-ignore
      if (supabase.removeChannel) await supabase.removeChannel(channel);
    } catch (err) {
      // ignore
    }
  };

  return unsubscribe;
}

/**
 * Subscribe to real-time chat messages for a specific group
 */
export function subscribeToGroupMessages(
  supabase: SupabaseClient,
  groupId: string,
  onMessage: (payload: RealtimePayload) => void
) {
  const channel = supabase.channel(`chat-group-${groupId}`);

  channel
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onMessage(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => onMessage(payload)
    )
    .subscribe();

  return async () => {
    try {
      await channel.unsubscribe();
    } catch (err) {
      console.error('Error unsubscribing from chat messages:', err);
    }
  };
}

/**
 * Subscribe to typing indicators for a group
 */
export function subscribeToTypingIndicators(
  supabase: SupabaseClient,
  groupId: string,
  onTyping: (data: { userId: string; isTyping: boolean }) => void
) {
  const channel = supabase.channel(`typing-${groupId}`);

  channel.on('broadcast', { event: 'typing' }, (payload) => {
    onTyping(payload.payload);
  }).subscribe();

  return async () => {
    try {
      await channel.unsubscribe();
    } catch (err) {
      console.error('Error unsubscribing from typing indicators:', err);
    }
  };
}

/**
 * Send typing indicator broadcast
 */
export async function sendTypingIndicator(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
  isTyping: boolean
) {
  const channel = supabase.channel(`typing-${groupId}`);
  await channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId, isTyping },
  });
}

export default subscribeToPublicTables;
