import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Send,
} from 'lucide-react';
import {
  getCollectionAttemptsForInvoice,
  createCollectionAttempt,
  updateCollectionAttempt,
} from '../services/collectionsService';
import {
  CollectionAttempt,
  CollectionAttemptType,
  CollectionAttemptStatus,
} from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';

interface Props {
  invoiceId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  open: boolean;
  onClose: () => void;
}

export default function CollectionAttemptsModal({
  invoiceId,
  clientName,
  clientPhone,
  clientEmail,
  open,
  onClose,
}: Props) {
  const [attempts, setAttempts] = useState<CollectionAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [newAttempt, setNewAttempt] = useState({
    attemptType: 'EMAIL' as CollectionAttemptType,
    notes: '',
    nextAttemptDate: '',
  });

  useEffect(() => {
    if (open) {
      loadAttempts();
    }
  }, [open, invoiceId]);

  const loadAttempts = async () => {
    try {
      setLoading(true);
      const data = await getCollectionAttemptsForInvoice(invoiceId);
      setAttempts(data);
    } catch (err) {
      console.error('Error loading collection attempts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttempt = async () => {
    if (!newAttempt.notes.trim()) {
      alert('Por favor, adicione uma nota');
      return;
    }

    try {
      const attempt = await createCollectionAttempt({
        invoiceId,
        attemptType: newAttempt.attemptType,
        attemptStatus: CollectionAttemptStatus.SENT,
        attemptDate: new Date().toISOString(),
        notes: newAttempt.notes,
        nextAttemptScheduled: newAttempt.nextAttemptDate
          ? new Date(newAttempt.nextAttemptDate).toISOString()
          : undefined,
        responseReceived: false,
      });

      setAttempts([attempt, ...attempts]);
      setNewAttempt({
        attemptType: CollectionAttemptType.EMAIL,
        notes: '',
        nextAttemptDate: '',
      });
      setShowForm(false);
    } catch (err) {
      console.error('Error creating collection attempt:', err);
      alert('Erro ao registar tentativa');
    }
  };

  const handleMarkAsResponse = async (attemptId: string, hasResponse: boolean) => {
    try {
      const updated = await updateCollectionAttempt(attemptId, {
        responseReceived: hasResponse,
        responseDate: hasResponse ? new Date().toISOString() : undefined,
      });

      setAttempts(attempts.map((a) => (a.id === attemptId ? updated : a)));
    } catch (err) {
      console.error('Error updating attempt:', err);
    }
  };

  const getAttemptIcon = (type: CollectionAttemptType) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="w-4 h-4" />;
      case 'PHONE':
        return <Phone className="w-4 h-4" />;
      case 'SMS':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getAttemptTypeLabel = (type: CollectionAttemptType) => {
    const labels: Record<CollectionAttemptType, string> = {
      EMAIL: 'Email',
      PHONE: 'Telefone',
      SMS: 'SMS',
      LETTER: 'Carta',
      PERSONAL_VISIT: 'Visita Pessoal',
    };
    return labels[type];
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tentativas de Cobrança</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cliente: <span className="font-semibold">{clientName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && attempts.length === 0 && !showForm && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>Nenhuma tentativa de cobrança registada</p>
            </div>
          )}

          {/* NEW ATTEMPT FORM */}
          {showForm && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-3">
              <h3 className="font-semibold text-gray-900">Registar Nova Tentativa</h3>

              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Tentativa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['EMAIL', 'PHONE', 'SMS', 'LETTER', 'PERSONAL_VISIT'] as CollectionAttemptType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setNewAttempt({ ...newAttempt, attemptType: type })}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 justify-center ${
                          newAttempt.attemptType === type
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {getAttemptIcon(type)}
                        {getAttemptTypeLabel(type)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição da Tentativa
                </label>
                <textarea
                  value={newAttempt.notes}
                  onChange={(e) => setNewAttempt({ ...newAttempt, notes: e.target.value })}
                  placeholder="Ex: Cliente contactado por email, pedindo para contactar em 48h..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                  rows={3}
                />
              </div>

              {/* Next Attempt Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agendar Próxima Tentativa (Opcional)
                </label>
                <input
                  type="date"
                  value={newAttempt.nextAttemptDate}
                  onChange={(e) => setNewAttempt({ ...newAttempt, nextAttemptDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddAttempt}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Registar Tentativa
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* ATTEMPTS LIST */}
          {attempts.length > 0 && (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {/* Icon */}
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-1">
                    {getAttemptIcon(attempt.attemptType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        {getAttemptTypeLabel(attempt.attemptType)}
                      </p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {attempt.attemptStatus}
                      </span>
                      {attempt.responseReceived && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{attempt.notes}</p>
                    <p className="text-xs text-gray-500">
                      {formatFlexibleDate(attempt.createdAt)}
                      {attempt.nextAttemptScheduled && (
                        <> • Próxima: {formatFlexibleDate(attempt.nextAttemptScheduled)}</>
                      )}
                    </p>
                  </div>

                  {/* Response Status */}
                  <button
                    onClick={() => handleMarkAsResponse(attempt.id, !attempt.responseReceived)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors whitespace-nowrap ${
                      attempt.responseReceived
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {attempt.responseReceived ? 'Respondido ✓' : 'Marcar Resposta'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            <p className="text-sm text-gray-600">
              Total de tentativas: <span className="font-semibold text-gray-900">{attempts.length}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Registar Tentativa
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
