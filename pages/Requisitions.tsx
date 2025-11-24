import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { RequestStatus, Role } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  Truck, 
  PackageCheck, 
  Clock, 
  Plus,
  ArrowRight
} from 'lucide-react';

export const Requisitions = () => {
  const { requisitions, currentUser, items, getItemName, getLocationName, createRequisition, updateRequisitionStatus } = useLogistics();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(items[0].id);
  const [quantity, setQuantity] = useState(1);

  // Filter logic:
  // Admin sees all.
  // Manager sees requests originating from their location OR directed to them.
  // Worker sees requests for their location.
  const myRequisitions = requisitions.filter(req => {
    if (currentUser.role === Role.ADMIN) return true;
    if (currentUser.role === Role.MANAGER) {
      return req.sourceLocationId === currentUser.locationId || req.targetLocationId === currentUser.locationId;
    }
    return req.targetLocationId === currentUser.locationId;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequisition(selectedItem, quantity);
    setIsModalOpen(false);
    setQuantity(1);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING: return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800 flex items-center gap-1"><Clock size={12}/> Pendente</span>;
      case RequestStatus.APPROVED: return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1"><CheckCircle size={12}/> Aprovado</span>;
      case RequestStatus.IN_TRANSIT: return <span className="px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1"><Truck size={12}/> Em Trânsito</span>;
      case RequestStatus.DELIVERED: return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1"><PackageCheck size={12}/> Entregue</span>;
      case RequestStatus.REJECTED: return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1"><XCircle size={12}/> Rejeitado</span>;
      default: return null;
    }
  };

  // Logic for Action Buttons based on Role & Status
  const renderActions = (req: any) => {
    // Admin Actions
    if (currentUser.role === Role.ADMIN) {
      if (req.status === RequestStatus.PENDING) {
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => updateRequisitionStatus(req.id, RequestStatus.APPROVED)}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
              Aprovar
            </button>
            <button 
              onClick={() => updateRequisitionStatus(req.id, RequestStatus.REJECTED)}
              className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200">
              Rejeitar
            </button>
          </div>
        );
      }
      if (req.status === RequestStatus.APPROVED) {
        return (
          <button 
            onClick={() => updateRequisitionStatus(req.id, RequestStatus.IN_TRANSIT)}
            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 flex items-center gap-1">
            <Truck size={12} /> Despachar
          </button>
        );
      }
    }

    // Manager Actions (Receiving)
    if (currentUser.role === Role.MANAGER && req.targetLocationId === currentUser.locationId) {
       if (req.status === RequestStatus.IN_TRANSIT) {
         return (
          <button 
            onClick={() => updateRequisitionStatus(req.id, RequestStatus.DELIVERED)}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1">
            <PackageCheck size={12} /> Receber
          </button>
         );
       }
    }
    
    // Worker Actions (Confirming)
    if (currentUser.role === Role.WORKER && req.targetLocationId === currentUser.locationId) {
        if (req.status === RequestStatus.DELIVERED) { // Assuming Delivered to their small field stock
            return (
                <button 
                  onClick={() => updateRequisitionStatus(req.id, RequestStatus.CONFIRMED)}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center gap-1">
                  <CheckCircle size={12} /> Confirmar Uso
                </button>
            );
        }
    }

    return <span className="text-gray-400 text-xs italic">Aguardando ação...</span>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fluxo de Requisições</h2>
          <p className="text-sm text-gray-500">Gerencie a entrada e saída de materiais entre filiais e campo.</p>
        </div>
        {currentUser.role !== Role.ADMIN && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={18} /> Nova Requisição
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Item</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Origem <ArrowRight size={10} className="inline mx-1"/> Destino</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Quantidade</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {myRequisitions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhuma requisição encontrada.</td></tr>
            ) : (
                myRequisitions.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{getItemName(req.itemId)}</div>
                        <div className="text-xs text-gray-400">ID: {req.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-400">De: {getLocationName(req.sourceLocationId)}</span>
                            <span className="font-medium text-gray-800">Para: {getLocationName(req.targetLocationId)}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {req.quantity} un
                    </td>
                    <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                        {renderActions(req)}
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nova Requisição de Material</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Necessário</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                <p>A requisição será enviada para: <strong>{getLocationName(useLogistics().locations.find(l => l.id === currentUser.locationId)?.parentId || 'loc-central')}</strong></p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm"
                >
                  Enviar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};