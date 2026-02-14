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
      console.error('Error loading groups:', error);
    }
  };

  const loadGroupMessages = async (groupId: string) => {
    setIsLoadingMessages(true);
    try {
      const msgs = await chatService.getGroupMessages(groupId);
      setMessages(msgs);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroup) return;

    try {
      await chatService.sendMessage(selectedGroup.id, messageInput);
      setMessageInput('');
      
      // Hide typing indicator
      await sendTypingIndicator(supabase, selectedGroup.id, currentUser?.id || '', false);
    } catch (error) {
      console.error('Error sending message:', error);
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
              className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition ${
                selectedGroup?.id === group.id ? 'bg-blue-50' : ''
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
              <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Settings size={20} className="text-gray-600" />
              </button>
            </div>

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
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender_id === currentUser?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {msg.sender_id !== currentUser?.id && (
                          <p className="text-xs font-semibold mb-1">{sender?.name}</p>
                        )}
                        <p className="text-sm break-words">{msg.content}</p>
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
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  title="Anexar ficheiro"
                >
                  <Paperclip size={20} className="text-gray-600" />
                </button>

                <input
                  type="text"
                  placeholder="Escreva uma mensagem..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyUp={handleTyping}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center gap-2"
                >
                  <Send size={18} />
                  Enviar
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
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState<'GROUP' | 'CHANNEL'>('GROUP');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) return;

    setIsCreating(true);
    try {
      await chatService.createGroup(groupName, groupType);
      onGroupCreated();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Erro ao criar conversa');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Nova Conversa</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as 'GROUP' | 'CHANNEL')}
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
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!groupName.trim() || isCreating}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {isCreating ? 'Criando...' : 'Criar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
