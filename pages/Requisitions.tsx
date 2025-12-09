
import React, { useState } from 'react';
import { useLogistics } from '../context/useLogistics';
import { RequestStatus, Role, ItemType, ItemCondition } from '../types';
import {
  CheckCircle,
  XCircle,
  Truck,
  PackageCheck,
  Clock,
  Plus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  History,
  Zap,
  Box,
  AlertOctagon,
  Lock,
  MapPin,
  Calendar,
  X
} from 'lucide-react';

export const Requisitions = () => {
  const { requisitions, currentUser, items, locations, getItemName, getLocationName, createRequisition, updateRequisitionStatus, isAdminOrGM } = useLogistics();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State for expand/collapse rows
  const [expandedReqId, setExpandedReqId] = useState<string | null>(null);

  // Form State
  const [selectedItem, setSelectedItem] = useState(items.length > 0 ? items[0].id : '');
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<ItemCondition>(ItemCondition.NEW);

  // Update selectedItem when items load
  React.useEffect(() => {
    if (items.length > 0 && !selectedItem) {
      setSelectedItem(items[0].id);
    }
  }, [items, selectedItem]);

  // Filter logic: Admins see all. Managers see their own + sub-locations. Workers see theirs.
  const myRequisitions = requisitions.filter(req => {
    if (isAdminOrGM) return true;
    if (currentUser?.role === Role.MANAGER) {
      const isParentOfSource = locations.find(l => l.id === req.sourceLocationId)?.parentId === currentUser.locationId;
      const isParentOfTarget = locations.find(l => l.id === req.targetLocationId)?.parentId === currentUser.locationId;

      return req.sourceLocationId === currentUser.locationId ||
        req.targetLocationId === currentUser.locationId ||
        isParentOfSource || isParentOfTarget;
    }
    // Workers
    return req.targetLocationId === currentUser?.locationId || req.requesterId === currentUser?.id;
  });

  const toggleExpand = (reqId: string) => {
    setExpandedReqId(expandedReqId === reqId ? null : reqId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRequisition(selectedItem, quantity, condition);
    setIsModalOpen(false);
    setQuantity(1);
    setCondition(ItemCondition.NEW);
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING: return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800 flex items-center gap-1 w-max"><Clock size={12} /> Pendente</span>;
      case RequestStatus.APPROVED: return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1 w-max"><CheckCircle size={12} /> Aprovado</span>;
      case RequestStatus.IN_TRANSIT: return <span className="px-2 py-1 rounded text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1 w-max"><Truck size={12} /> Em Trânsito</span>;
      case RequestStatus.DELIVERED: return <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-800 flex items-center gap-1 w-max"><PackageCheck size={12} /> Entregue</span>;
      case RequestStatus.REJECTED: return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1 w-max"><XCircle size={12} /> Rejeitado</span>;
      case RequestStatus.CONFIRMED: return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1 w-max"><CheckCircle size={12} /> Confirmado</span>;
      default: return null;
    }
  };

  const getConditionBadge = (cond: ItemCondition) => {
    switch (cond) {
      case ItemCondition.NEW: return <span className="text-[10px] font-semibold text-green-600 border border-green-200 bg-green-50 px-1.5 py-0.5 rounded">Novo</span>;
      case ItemCondition.GOOD: return <span className="text-[10px] font-semibold text-blue-600 border border-blue-200 bg-blue-50 px-1.5 py-0.5 rounded">Bom</span>;
      case ItemCondition.FAIR: return <span className="text-[10px] font-semibold text-orange-600 border border-orange-200 bg-orange-50 px-1.5 py-0.5 rounded">Usado</span>;
      case ItemCondition.POOR: return <span className="text-[10px] font-semibold text-red-600 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded">Ruim</span>;
      default: return <span className="text-[10px] font-semibold text-gray-600 border border-gray-200 bg-gray-50 px-1.5 py-0.5 rounded">{cond}</span>;
    }
  };

  const getItemTypeBadge = (item: any) => {
    if (item?.type === ItemType.CONSUMABLE) {
      return <span className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100"><Zap size={10} /> Consumível</span>;
    }
    return <span className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"><Box size={10} /> Ativo</span>;
  };

  // Logic for Action Buttons based on Role & Location
  const renderActions = (req: any, mobile: boolean = false) => {
    // 1. Identify Authority over this Requisition
    const isSourceManager = currentUser?.role === Role.MANAGER && (req.sourceLocationId === currentUser.locationId || locations.find(l => l.id === req.sourceLocationId)?.parentId === currentUser.locationId);
    const isTargetManager = currentUser?.role === Role.MANAGER && (req.targetLocationId === currentUser.locationId || locations.find(l => l.id === req.targetLocationId)?.parentId === currentUser.locationId);
    const hasAuthority = isAdminOrGM || isSourceManager || isTargetManager;

    const btnClass = mobile
      ? "flex-1 py-3 justify-center text-sm font-bold shadow-md"
      : "px-3 py-1 text-xs shadow-sm whitespace-nowrap";

    if (!hasAuthority && currentUser?.role !== Role.WORKER) {
      return <span className="text-gray-300 text-xs flex items-center gap-1"><Lock size={10} /> Visualização</span>;
    }

    // 2. Action Buttons Flow
    if (req.status === RequestStatus.PENDING) {
      if (isAdminOrGM || isSourceManager || isTargetManager) {
        return (
          <div className={`flex gap-2 ${mobile ? 'w-full mt-2' : ''}`}>
            <button
              onClick={(e) => { e.stopPropagation(); updateRequisitionStatus(req.id, RequestStatus.APPROVED); }}
              className={`${btnClass} bg-blue-600 text-white rounded hover:bg-blue-700`}>
              Aprovar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); updateRequisitionStatus(req.id, RequestStatus.REJECTED); }}
              className={`${btnClass} bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200`}>
              Rejeitar
            </button>
          </div>
        );
      }
    }

    if (req.status === RequestStatus.APPROVED) {
      if (isAdminOrGM || isSourceManager) {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); updateRequisitionStatus(req.id, RequestStatus.IN_TRANSIT); }}
            className={`${btnClass} bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 ${mobile ? 'w-full' : ''}`}>
            <Truck size={12} /> Despachar
          </button>
        );
      }
      return <span className="text-blue-500 text-xs italic">Aguardando Envio...</span>;
    }

    if (req.status === RequestStatus.IN_TRANSIT) {
      if (isAdminOrGM || isTargetManager) {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); updateRequisitionStatus(req.id, RequestStatus.DELIVERED); }}
            className={`${btnClass} bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1 ${mobile ? 'w-full' : ''}`}>
            <Truck size={12} /> Registrar Chegada
          </button>
        );
      }
      return <span className="text-indigo-500 text-xs italic">Em Trânsito...</span>;
    }

    if (req.status === RequestStatus.DELIVERED) {
      if (isAdminOrGM || isTargetManager) {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); updateRequisitionStatus(req.id, RequestStatus.CONFIRMED); }}
            className={`${btnClass} bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 animate-pulse ${mobile ? 'w-full' : ''}`}>
            <PackageCheck size={12} /> Conferir e Aceitar
          </button>
        );
      }
      // Worker Self-Check
      if (currentUser?.role === Role.WORKER && req.targetLocationId === currentUser.locationId) {
        return (
          <button
            onClick={(e) => { e.stopPropagation(); updateRequisitionStatus(req.id, RequestStatus.CONFIRMED); }}
            className={`${btnClass} bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 ${mobile ? 'w-full' : ''}`}>
            <CheckCircle size={12} /> Confirmar
          </button>
        );
      }
    }

    if (req.status === RequestStatus.CONFIRMED) {
      return <span className="text-green-600 text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Concluído</span>;
    }

    if (req.status === RequestStatus.PENDING && !hasAuthority) {
      return <span className="text-orange-400 text-xs font-medium flex items-center gap-1 whitespace-nowrap"><Clock size={12} /> Aguardando</span>;
    }

    if (req.status === RequestStatus.REJECTED) {
      return <span className="text-red-400 text-xs font-medium flex items-center gap-1 whitespace-nowrap"><XCircle size={12} /> Cancelado</span>;
    }

    return <span className="text-gray-400 text-xs italic whitespace-nowrap">Status: {req.status}</span>;
  };

  const selectedItemObj = items.find(i => i.id === selectedItem);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Fluxo de Requisições</h2>
          <p className="text-sm text-gray-500">Gerencie a entrada e saída de materiais.</p>
        </div>
        {currentUser?.role !== Role.ADMIN && currentUser?.role !== Role.GENERAL_MANAGER && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 md:py-2 rounded-lg hover:bg-blue-700 transition shadow-md w-full md:w-auto justify-center font-medium"
          >
            <Plus size={18} /> Nova Requisição
          </button>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap w-8"></th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Item / Condição</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Origem <ArrowRight size={10} className="inline mx-1" /> Destino</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Qtd</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Data</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right whitespace-nowrap">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myRequisitions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Nenhuma requisição encontrada.</td></tr>
              ) : (
                myRequisitions.map((req) => {
                  const item = items.find(i => i.id === req.itemId);
                  const isExpanded = expandedReqId === req.id;

                  return (
                    <React.Fragment key={req.id}>
                      <tr
                        onClick={() => toggleExpand(req.id)}
                        className={`hover:bg-slate-50 transition cursor-pointer ${isExpanded ? 'bg-slate-50' : ''}`}
                      >
                        <td className="px-6 py-4 text-center">
                          {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {item?.name}
                            {getItemTypeBadge(item)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <span>ID: {req.id}</span>
                            {item?.type === ItemType.ASSET && getConditionBadge(req.condition)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">De: {getLocationName(req.sourceLocationId)}</span>
                            <span className="font-medium text-gray-800">Para: {getLocationName(req.targetLocationId)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {req.quantity} un
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {renderActions(req)}
                        </td>
                      </tr>
                      {/* Expandable History Log */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-gray-100">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                              <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                                <History size={14} /> Histórico de Rastreabilidade
                              </h4>
                              <div className="space-y-4 relative pl-2">
                                <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>
                                {req.logs.map((log, idx) => (
                                  <div key={idx} className="relative flex gap-4 text-sm">
                                    <div className="w-3 h-3 rounded-full bg-blue-50 border-2 border-white shadow-sm z-10 mt-1 shrink-0"></div>
                                    <div>
                                      <p className="font-medium text-gray-800">{log.message}</p>
                                      <p className="text-xs text-gray-400">
                                        {new Date(log.timestamp).toLocaleString()} • {log.actorId} ({log.action})
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-4">
        {myRequisitions.length === 0 && (
          <div className="text-center p-8 bg-white rounded-xl border border-gray-200 text-gray-400">
            <Box size={40} className="mx-auto mb-2 opacity-20" />
            <p>Nenhuma requisição.</p>
          </div>
        )}
        {myRequisitions.map((req) => {
          const item = items.find(i => i.id === req.itemId);
          return (
            <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] text-gray-400 font-mono block mb-1">#{req.id.slice(-6)}</span>
                  <h4 className="font-bold text-gray-900 text-lg leading-tight">{item?.name}</h4>
                </div>
                {getStatusBadge(req.status)}
              </div>

              <div className="flex gap-2 mb-3">
                {getItemTypeBadge(item)}
                {item?.type === ItemType.ASSET && getConditionBadge(req.condition)}
                <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{req.quantity} un</span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-gray-500 text-xs">De:</span>
                  <span className="font-medium text-gray-800">{getLocationName(req.sourceLocationId)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="text-gray-500 text-xs">Para:</span>
                  <span className="font-bold text-gray-900">{getLocationName(req.targetLocationId)}</span>
                </div>
                <div className="flex items-center gap-2 border-t border-gray-100 pt-2 mt-1">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons Full Width */}
              <div className="border-t border-gray-100 pt-3">
                {renderActions(req, true)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Nova Requisição</h3>
              <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 p-1 rounded-full" title="Fechar" aria-label="Fechar"><X size={20} className="text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Necessário</label>
                <select
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 text-base"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                {selectedItemObj && (
                  <div className="mt-2">
                    {getItemTypeBadge(selectedItemObj)}
                  </div>
                )}
              </div>

              {selectedItemObj?.type === ItemType.ASSET && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condição Desejada</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 text-base"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ItemCondition)}
                  >
                    <option value={ItemCondition.NEW}>Novo</option>
                    <option value={ItemCondition.GOOD}>Bom Estado (Usado)</option>
                    <option value={ItemCondition.FAIR}>Qualquer um (Funcional)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 text-lg font-bold"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 border border-blue-100">
                <p>A requisição será enviada para aprovação do <strong>Gerente Regional</strong> ou <strong>Administração</strong>.</p>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-bold shadow-md"
                >
                  Confirmar Envio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};