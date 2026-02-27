import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Settings, Search, Send, Paperclip, X } from 'lucide-react';
import { useLogistics } from '../context/useLogistics';
import { chatService } from '../services/chatService';
import { subscribeToGroupMessages, subscribeToTypingIndicators, sendTypingIndicator } from '../services/realtimeService';
import { supabase } from '../services/supabaseClient';

interface ChatGroup {
  id: string;
  name: string;
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  description?: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  chat_file_attachments?: {
    id: string;
    file_name: string;
    file_url: string;
    mime_type: string;
    file_size: number;
  }[];
}

export const Chat = () => {
  const { currentUser, allUsers } = useLogistics();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load user groups on mount
  useEffect(() => {
    loadUserGroups();
  }, []);

  // Subscribe to group messages
  useEffect(() => {
    if (!selectedGroup) return;

    let unsubscribeFunc: (() => Promise<void>) | undefined;

    const subscribe = async () => {
      unsubscribeFunc = await subscribeToGroupMessages(supabase, selectedGroup.id, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      });
    };

    subscribe();
    loadGroupMessages(selectedGroup.id);

    return () => {
      if (unsubscribeFunc) {
        unsubscribeFunc();
      }
    };
  }, [selectedGroup]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!selectedGroup) return;

    let unsubscribeFunc: (() => Promise<void>) | undefined;

    const subscribe = async () => {
      unsubscribeFunc = await subscribeToTypingIndicators(supabase, selectedGroup.id, (data) => {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          if (data.isTyping) {
            updated.add(data.userId);
          } else {
            updated.delete(data.userId);
          }
          return updated;
        });
      });
    };

    subscribe();

    return () => {
      if (unsubscribeFunc) {
        unsubscribeFunc();
      }
    };
  }, [selectedGroup]);

  const loadUserGroups = async () => {
    try {
      const groupList = await chatService.getUserGroups();
      setGroups(groupList);
      if (groupList.length > 0) {
        setSelectedGroup(groupList[0]);
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Erro ao carregar conversas: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const loadGroupMessages = async (groupId: string) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await chatService.getGroupMessages(groupId);
      setMessages(msgs);
    } catch (error) {
      setStatus({ type: 'error', message: `Erro ao carregar mensagens: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedGroup) return;

    try {
      setIsUploading(true);

      // 1. Create the message first to get an ID for the attachment
      // Actually, my chatService.uploadFile needs a messageId.
      // Let's modify the flow: create message first, then upload, or send content + file.
      // Current chatService.sendMessage only takes content.

      const msg = await chatService.sendMessage(selectedGroup.id, messageInput || (selectedFile ? `File: ${selectedFile.name}` : ''));

      if (selectedFile) {
        await chatService.uploadFile(selectedFile, selectedGroup.id, msg.id);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      setMessageInput('');

      // Hide typing indicator
      await sendTypingIndicator(supabase, selectedGroup.id, currentUser?.id || '', false);
    } catch (error) {
      setStatus({ type: 'error', message: `Erro ao enviar: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTyping = async () => {
    if (!selectedGroup) return;
    await sendTypingIndicator(supabase, selectedGroup.id, currentUser?.id || '', true);

    // Clear typing after a delay
    setTimeout(() => {
      if (!messageInput.trim()) {
        sendTypingIndicator(supabase, selectedGroup.id, currentUser?.id || '', false);
      }
    }, 3000);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypingText = () => {
    if (typingUsers.size === 0) return '';
    const typingUserNames = Array.from(typingUsers)
      .map((uid) => allUsers.find((u) => u.id === uid)?.name)
      .filter(Boolean)
      .join(', ');
    return `${typingUserNames} is typing...`;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Group List */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle size={24} className="text-blue-600" />
              Chats
            </h2>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Nova conversa"
              aria-label="Criar nova conversa"
            >
              <Plus size={20} className="text-blue-600" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Procurar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition ${selectedGroup?.id === group.id ? 'bg-blue-50' : ''
                }`}
            >
              <p className="font-medium text-gray-800 truncate">{group.name}</p>
              <p className="text-xs text-gray-500">
                {group.type === 'DIRECT' ? 'Direct message' : group.type}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedGroup ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{selectedGroup.name}</h3>
                <p className="text-sm text-gray-500">{selectedGroup.description}</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition" aria-label="Configurações da conversa">
                <Settings size={20} className="text-gray-600" />
              </button>
            </div>

            {status && (
              <div className={`p-3 text-sm ${status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' : status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-blue-50 text-blue-800 border border-blue-100'} `}>
                {status.message}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="text-center text-gray-500">Carregando mensagens...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  Nenhuma mensagem ainda. Comece a conversa!
                </div>
              ) : (
                messages.map((msg) => {
                  const sender = allUsers.find((u) => u.id === msg.sender_id);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender_id === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                          }`}
                      >
                        {msg.sender_id !== currentUser?.id && (
                          <p className="text-xs font-semibold mb-1">{sender?.name}</p>
                        )}
                        <p className="text-sm break-words">{msg.content}</p>

                        {/* Attachments */}
                        {msg.chat_file_attachments && msg.chat_file_attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.chat_file_attachments.map((file) => (
                              <div key={file.id} className="bg-white/10 rounded p-2 flex items-center gap-2">
                                {file.mime_type.startsWith('image/') ? (
                                  <img
                                    src={file.file_url}
                                    alt={file.file_name}
                                    className="max-w-full rounded cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(file.file_url, '_blank')}
                                  />
                                ) : (
                                  <a
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs underline"
                                  >
                                    <Paperclip size={14} />
                                    {file.file_name} ({Math.round(file.file_size / 1024)} KB)
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicator */}
              {getTypingText() && (
                <div className="text-sm text-gray-500 italic">{getTypingText()}</div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 hover:bg-gray-200 rounded-lg transition ${selectedFile ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                  aria-label="Anexar ficheiro"
                  title="Anexar ficheiro"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex-1 flex flex-col">
                  {selectedFile && (
                    <div className="flex items-center gap-2 bg-blue-50 p-1 px-2 mb-1 rounded text-xs text-blue-800">
                      <Paperclip size={12} />
                      <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                      <button onClick={() => setSelectedFile(null)} className="ml-auto p-1 hover:bg-blue-100 rounded">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder={selectedFile ? "Legenda opcional..." : "Escreva uma mensagem..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyUp={handleTyping}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={(!messageInput.trim() && !selectedFile) || isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2"
                >
                  {isUploading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  {isUploading ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <p>Selecione uma conversa para começar</p>
            </div>
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <NewGroupModal
          onClose={() => setShowNewGroupModal(false)}
          onGroupCreated={() => {
            loadUserGroups();
            setShowNewGroupModal(false);
          }}
        />
      )}
    </div>
  );
};

interface NewGroupModalProps {
  onClose: () => void;
  onGroupCreated: () => void;
}

const NewGroupModal: React.FC<NewGroupModalProps> = ({ onClose, onGroupCreated }) => {
  const { allUsers, currentUser } = useLogistics();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<'GROUP' | 'CHANNEL'>('GROUP');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [searchUser, setSearchUser] = useState('');
  const [keyboardIndex, setKeyboardIndex] = useState(0);

  // Filter available users (excluding current user)
  const availableUsers = allUsers
    .filter(u => u.id !== currentUser?.id)
    .filter(u => u.name.toLowerCase().includes(searchUser.toLowerCase()) || (u.email || '').toLowerCase().includes(searchUser.toLowerCase()));

  useEffect(() => {
    // reset keyboard index when list changes
    setKeyboardIndex(0);
  }, [searchUser]);

  // Keyboard navigation (up/down + enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (tab !== 'direct') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setKeyboardIndex(i => Math.min(i + 1, availableUsers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setKeyboardIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const u = availableUsers[keyboardIndex];
      if (u) setSelectedUser(u.id);
    }
  };

  const handleCreateDirect = async () => {
    if (!selectedUser) {
      setModalError('Selecione um usuário para iniciar a conversa.');
      return;
    }

    setIsCreating(true);
    try {
      // Create or get direct message group with user
      const otherUser = allUsers.find(u => u.id === selectedUser);
      if (!otherUser) throw new Error('Usuário não encontrado');

      const current = currentUser;
      if (!current) throw new Error('Usuário atual não identificado');

      await chatService.getOrCreateDirectGroup(current.id, otherUser.id);
      onGroupCreated();
    } catch (error) {
      setModalError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    setIsCreating(true);
    try {
      await chatService.createGroup(groupName, groupType);
      onGroupCreated();
    } catch (error) {
      setModalError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreating(false);
    }
  };

  const initials = (name = '') => {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const relativeTime = (iso?: string) => {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - then) / 1000));
    if (diff < 60) return `agora`;
    if (diff < 3600) return `há ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    return `há ${Math.floor(diff / 86400)}d`;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto transform transition-all duration-200 ease-out scale-100 motion-safe:animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Nova Conversa</h3>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Fechar" title="Fechar">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            onClick={() => setTab('direct')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition ${tab === 'direct' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            aria-label="Conversa Direta"
            title="Conversa Direta"
          >
            Direto
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 py-2 text-sm font-medium border-b-2 transition ${tab === 'group' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            aria-label="Novo Grupo"
            title="Novo Grupo"
          >
            Grupo/Canal
          </button>
        </div>

        {/* Direct Message Tab */}
        {tab === 'direct' && (
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Procurar usuário por nome ou email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Buscar usuário"
              />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableUsers.length > 0 ? (
                availableUsers.map((user, idx) => (
                  <button
                    key={user.id}
                    onClick={() => { setSelectedUser(user.id); setKeyboardIndex(idx); }}
                    className={`w-full p-3 text-left rounded-lg transition flex items-center gap-3 border-2 ${selectedUser === user.id ? 'border-blue-600 bg-blue-50 shadow-sm' : (keyboardIndex === idx ? 'border-gray-300 bg-gray-50' : 'border-transparent hover:bg-gray-50')
                      }`}
                    aria-label={`Selecionar ${user.name}`}
                    title={user.name}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                      {initials(user.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-400' : 'bg-gray-300'}`} aria-hidden="true" />
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </div>
                      <div className="text-xs text-gray-500">{user.email || '—'}</div>
                      <div className="text-xs text-gray-400">{user.isOnline ? 'Online' : (user.lastSeen ? `Visto ${relativeTime(user.lastSeen)}` : 'Offline')}</div>
                    </div>
                    <div className="text-xs text-gray-400">{user.role}</div>
                  </button>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">Nenhum usuário encontrado</div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                aria-label="Cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateDirect}
                disabled={!selectedUser || isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                aria-label="Abrir conversa"
              >
                {isCreating ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"></path></svg>
                    Abrindo...
                  </>
                ) : 'Abrir'}
              </button>
            </div>
          </div>
        )}

        {/* Group Tab */}
        {tab === 'group' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Conversa
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ex: Marketing Team"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Nome do grupo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                value={groupType}
                onChange={(e) => setGroupType(e.target.value as 'GROUP' | 'CHANNEL')}
                aria-label="Tipo de conversa"
                title="Selecione o tipo de conversa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GROUP">Grupo</option>
                <option value="CHANNEL">Canal</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                aria-label="Cancelar"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                aria-label="Criar grupo"
              >
                {isCreating ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        )}

        {modalError && (
          <div className="mt-4 p-3 text-sm bg-red-100 text-red-800 border border-red-300 rounded">
            {modalError}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
