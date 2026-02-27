import { supabase } from './supabaseClient';

// Type definitions for chat tables
export interface ChatGroup {
  id: string;
  name: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  description?: string;
  created_by: string;
  location_id?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  message_type: 'TEXT' | 'FILE' | 'SYSTEM' | 'REACTION';
  is_edited: boolean;
  edited_at?: string;
  is_deleted: boolean;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joined_at: string;
  last_read_at?: string;
}

export interface ChatFileAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: string;
  expires_at: string;
  download_count: number;
}

/**
 * Chat Service - Handles all chat-related operations
 */
export const chatService = {
  // ============ GROUP MANAGEMENT ============

  /**
   * Create a new chat group
   */
  async createGroup(
    name: string,
    type: 'DIRECT' | 'GROUP' | 'CHANNEL',
    description?: string,
    locationId?: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_groups')
      .insert({
        name,
        type,
        description,
        location_id: locationId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all groups for current user
   */
  async getUserGroups() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      // Get group members first to find groups for the current user
      const { data: memberData, error: memberError } = await supabase
        .from('chat_group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        return [];
      }

      const groupIds = memberData.map(m => m.group_id);

      // Now fetch the full group data with members and latest message timestamps
      const { data, error } = await supabase
        .from('chat_groups')
        .select(`
          *,
          chat_group_members(*),
          chat_messages(created_at)
        `)
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      // Return empty list on server errors to let UI show a friendly message
      // while logging the error for diagnostics.
      console.error('Error fetching user chat groups:', err);
      return [];
    }
  },

  /**
   * Get group details with members
   */
  async getGroupDetails(groupId: string) {
    const { data, error } = await supabase
      .from('chat_groups')
      .select(`
        *,
        chat_group_members(*)
      `)
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Add member to group
   */
  async addGroupMember(groupId: string, userId: string, role: 'ADMIN' | 'MODERATOR' | 'MEMBER' = 'MEMBER') {
    const { data, error } = await supabase
      .from('chat_group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove member from group
   */
  async removeGroupMember(groupId: string, userId: string) {
    const { error } = await supabase
      .from('chat_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  /**
   * Get or create direct message group
   */
  async getOrCreateDirectGroup(userId1: string, userId2: string) {
    // Sort IDs to ensure consistent naming
    const [id1, id2] = [userId1, userId2].sort();
    const groupName = `DIRECT-${id1.slice(0, 8)}-${id2.slice(0, 8)}`;

    // Try to find existing group
    const { data: existing, error: searchError } = await supabase
      .from('chat_groups')
      .select('*')
      .eq('name', groupName)
      .eq('type', 'DIRECT')
      .single();

    if (searchError && searchError.code !== 'PGRST116') throw searchError;

    if (existing) return existing;

    // Create new direct group
    const { data: newGroup, error: createError } = await supabase
      .from('chat_groups')
      .insert({
        name: groupName,
        type: 'DIRECT',
        created_by: userId1,
      })
      .select()
      .single();

    if (createError) throw createError;

    // Add both users to group
    await chatService.addGroupMember(newGroup.id, userId1);
    await chatService.addGroupMember(newGroup.id, userId2);

    return newGroup;
  },

  // ============ MESSAGE MANAGEMENT ============

  /**
   * Send a message
   */
  async sendMessage(groupId: string, content: string, messageType: 'TEXT' | 'FILE' | 'SYSTEM' = 'TEXT') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: groupId,
        sender_id: user.id,
        content,
        message_type: messageType,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get messages for a group
   */
  async getGroupMessages(groupId: string, limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        chat_file_attachments(*)
      `)
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data?.reverse() || [];
  },

  /**
   * Edit message
   */
  async editMessage(messageId: string, newContent: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete message (soft delete)
   */
  async deleteMessage(messageId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        deleted_by: user.id,
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_message_reads')
      .insert({
        message_id: messageId,
        user_id: user.id,
      })
      .select()
      .single();

    // Ignore duplicate key errors (already read)
    if (error && error.code !== '23505') throw error;
    return data;
  },

  /**
   * Get unread count for group
   */
  async getUnreadCount(groupId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('group_id', groupId)
      .not('chat_message_reads', 'is', null);

    if (error) throw error;
    return data?.length || 0;
  },

  // ============ FILE MANAGEMENT ============

  /**
   * Validate file before upload
   */

  async validateFileUpload(file: File, groupId: string) {
    const { data, error } = await supabase.functions.invoke('validate-chat-file', {
      body: {
        fileSize: file.size,
        mimeType: file.type,
        groupId,
      },
    });

    if (error) {
      throw new Error(error.message || 'Falha na validação do ficheiro');
    }

    return data;
  },

  /**
   * Upload file to chat
   */
  async uploadFile(file: File, groupId: string, messageId: string) {
    // Validate first
    const validation = await chatService.validateFileUpload(file, groupId);

    // Upload to storage
    const path = `${groupId}/${messageId}/${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file);

    if (uploadError) throw uploadError;

    // Get supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

    // Create attachment record
    const { data: attachment, error: attachError } = await supabase
      .from('chat_file_attachments')
      .insert({
        message_id: messageId,
        file_name: file.name,
        file_url: `${supabaseUrl}/storage/v1/object/public/chat-attachments/${path}`,
        file_size: file.size,
        mime_type: file.type,
        storage_path: path,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || '',
        expires_at: validation.expiresAt,
      })
      .select()
      .single();

    if (attachError) throw attachError;
    return attachment;
  },

  /**
   * Get signed URL for file download
   */
  async getFileDownloadUrl(storagePath: string, expiresIn: number = 900) {
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  /**
   * Get file attachments for message
   */
  async getMessageAttachments(messageId: string) {
    const { data, error } = await supabase
      .from('chat_file_attachments')
      .select('*')
      .eq('message_id', messageId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // ============ REACTIONS ============

  /**
   * Add emoji reaction to message
   */
  async addReaction(messageId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      })
      .select()
      .single();

    // Ignore duplicate reactions
    if (error && error.code !== '23505') throw error;
    return data;
  },

  /**
   * Remove emoji reaction
   */
  async removeReaction(messageId: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) throw error;
  },

  /**
   * Get reactions for message
   */
  async getMessageReactions(messageId: string) {
    const { data, error } = await supabase
      .from('chat_reactions')
      .select('*')
      .eq('message_id', messageId);

    if (error) throw error;

    // Group reactions by emoji
    const grouped = (data || []).reduce(
      (acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = [];
        }
        acc[reaction.emoji].push(reaction.user_id);
        return acc;
      },
      {} as Record<string, string[]>
    );

    return grouped;
  },
};
