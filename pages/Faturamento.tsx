import React, { useState } from 'react';
import { useLogistics } from '../context/useLogistics';
import { Plus, Edit, Trash2, DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { CostCenterType, PendingItemStatus, CostCenter, PendingInvoiceItem } from '../types';

const Faturamento: React.FC = () => {
  const {
    costCenters,
    pendingInvoiceItems,
    clients,
    items,
    locations,
    isAdminOrGM,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    createPendingInvoiceItem,
    updatePendingInvoiceItem,
    deletePendingInvoiceItem,
    getClientName,
    getItemName,
    getLocationName
  } = useLogistics();

  const [activeTab, setActiveTab] = useState<'centros-custo' | 'itens-pendentes'>('centros-custo');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

  const [costCenterForm, setCostCenterForm] = useState<Partial<CostCenter>>({
    name: '',
    description: '',
    type: CostCenterType.PRODUCTION,
    locationId: '',
    isActive: true
  });
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [isCostCenterOpen, setIsCostCenterOpen] = useState(false);

  const [pendingForm, setPendingForm] = useState<Partial<PendingInvoiceItem>>({
    clientId: '',
    itemId: '',
    costCenterId: '',
    quantity: 0,
    unitPrice: 0,
    referenceDocument: ''
  });
  const [editingPending, setEditingPending] = useState<PendingInvoiceItem | null>(null);
  const [isPendingOpen, setIsPendingOpen] = useState(false);

  if (!isAdminOrGM) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Acesso Restrito</h2>
          <p className="text-gray-600">Você não tem permissão para acessar este módulo.</p>
        </div>
      </div>
    );
  }

  const resetCostCenter = () => {
    setCostCenterForm({ name: '', description: '', type: CostCenterType.PRODUCTION, locationId: '', isActive: true });
    setEditingCostCenter(null);
  };

  const submitCostCenter = async () => {
    if (!costCenterForm.name || costCenterForm.name.trim() === '') return;
    try {
      if (editingCostCenter) {
        await updateCostCenter({ ...editingCostCenter, ...(costCenterForm as CostCenter) });
      } else {
        await addCostCenter(costCenterForm as any);
      }
      setStatus({ type: 'success', message: 'Centro de custo salvo com sucesso!' });
      setTimeout(() => setStatus(null), 3000);
      resetCostCenter();
      setIsCostCenterOpen(false);
    } catch (err) {
      setStatus({ type: 'error', message: `Erro ao salvar centro de custo: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const resetPending = () => {
    setPendingForm({ clientId: '', itemId: '', costCenterId: '', quantity: 0, unitPrice: 0, referenceDocument: '' });
    setEditingPending(null);
  };

  const submitPending = async () => {
    if (!pendingForm.clientId || !pendingForm.itemId || (pendingForm.quantity || 0) <= 0) return;
    try {
      if (editingPending) {
        await updatePendingInvoiceItem({ ...editingPending, ...(pendingForm as any) });
      } else {
        await createPendingInvoiceItem(pendingForm as any);
      }
      setStatus({ type: 'success', message: 'Item pendente salvo com sucesso!' });
      setTimeout(() => setStatus(null), 3000);
      resetPending();
      setIsPendingOpen(false);
    } catch (err) {
      setStatus({ type: 'error', message: `Erro ao salvar item pendente: ${err instanceof Error ? err.message : String(err)}` });
    }
  };

  const openEditCostCenter = (cc: CostCenter) => {
    setEditingCostCenter(cc);
    setCostCenterForm(cc);
    setIsCostCenterOpen(true);
  };

  const openEditPending = (pi: PendingInvoiceItem) => {
    setEditingPending(pi);
    setPendingForm({
      clientId: pi.clientId,
      itemId: pi.itemId,
      costCenterId: pi.costCenterId,
      quantity: pi.remainingQuantity,
      unitPrice: pi.unitPrice,
      referenceDocument: pi.referenceDocument
    });
    setIsPendingOpen(true);
  };

  const statusBadge = (status: PendingItemStatus) => {
    switch (status) {
      case PendingItemStatus.PENDING:
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pendente</span>;
      case PendingItemStatus.PARTIALLY_INVOICED:
        return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">Parcial</span>;
      case PendingItemStatus.FULLY_INVOICED:
        return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Faturado</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Faturamento & Despesas</h1>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded shadow-sm">
            <TrendingUp className="h-4 w-4" /> Relatórios
          </button>
        </div>
      </div>

      {status && (
        <div className={`p-3 rounded text-sm ${
          status.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
          status.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
          'bg-blue-50 border border-blue-100 text-blue-800'
        }`}>
          {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Centros de Custo</p>
              <p className="text-2xl font-bold">{costCenters.length}</p>
            </div>
            <Users className="h-7 w-7 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Itens Pendentes</p>
              <p className="text-2xl font-bold">{pendingInvoiceItems.length}</p>
            </div>
            <Package className="h-7 w-7 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clientes</p>
              <p className="text-2xl font-bold">{clients.length}</p>
            </div>
            <DollarSign className="h-7 w-7 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valor Pendente</p>
              <p className="text-2xl font-bold">
                {pendingInvoiceItems
                  .filter((i) => i.status !== PendingItemStatus.FULLY_INVOICED)
                  .reduce((s, it) => s + it.remainingQuantity * it.unitPrice, 0)
                  .toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
              </p>
            </div>
            <TrendingUp className="h-7 w-7 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm border">
        <div className="border-b px-4 py-3">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('centros-custo')}
              className={`px-4 py-2 ${activeTab === 'centros-custo' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
              Centros de Custo
            </button>
            <button
              onClick={() => setActiveTab('itens-pendentes')}
              className={`px-4 py-2 ${activeTab === 'itens-pendentes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
              Itens por Faturar
            </button>
          </nav>
        </div>

        <div className="p-4">
          {activeTab === 'centros-custo' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Centros de Custo</h2>
                <button onClick={() => { resetCostCenter(); setIsCostCenterOpen(true); }} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded">
                  <Plus className="h-4 w-4" /> Novo Centro
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Localização</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {costCenters.map((cc) => (
                      <tr key={cc.id} className="border-t">
                        <td className="px-3 py-2">{cc.name}</td>
                        <td className="px-3 py-2">{cc.type}</td>
                        <td className="px-3 py-2">{cc.locationId ? getLocationName(cc.locationId) : '-'}</td>
                        <td className="px-3 py-2">{cc.isActive ? 'Ativo' : 'Inativo'}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => openEditCostCenter(cc)} title="Editar" className="text-blue-600"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => { if (confirm('Excluir centro de custo?')) deleteCostCenter(cc.id); }} title="Excluir" className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'itens-pendentes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Itens por Faturar</h2>
                <button onClick={() => { resetPending(); setIsPendingOpen(true); }} className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded">
                  <Plus className="h-4 w-4" /> Novo Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2">Quantidade</th>
                      <th className="px-3 py-2">Valor</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pendingInvoiceItems.map((pi) => (
                      <tr key={pi.id} className="border-t">
                        <td className="px-3 py-2">{getClientName(pi.clientId)}</td>
                        <td className="px-3 py-2">{getItemName(pi.itemId)}</td>
                        <td className="px-3 py-2">{pi.remainingQuantity} / {pi.quantity}</td>
                        <td className="px-3 py-2">{(pi.remainingQuantity * pi.unitPrice).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</td>
                        <td className="px-3 py-2">{statusBadge(pi.status)}</td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => openEditPending(pi)} title="Editar" className="text-blue-600"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => { if (confirm('Excluir item pendente?')) deletePendingInvoiceItem(pi.id); }} title="Excluir" className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simple modals implemented inline to keep dependencies minimal */}
      {isCostCenterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded shadow p-6">
            <h3 className="text-lg font-medium mb-4">{editingCostCenter ? 'Editar Centro' : 'Novo Centro'}</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="cc-name" className="block text-sm">Nome</label>
                <input id="cc-name" title="Nome do centro de custo" aria-label="Nome do centro de custo" placeholder="Ex: Talhão Norte" value={costCenterForm.name || ''} onChange={(e) => setCostCenterForm(prev => ({ ...prev, name: e.target.value }))} className="mt-1 w-full border rounded p-2" />
              </div>
              <div>
                <label htmlFor="cc-type" className="block text-sm">Tipo</label>
                <select id="cc-type" title="Tipo de centro de custo" aria-label="Tipo de centro de custo" value={costCenterForm.type} onChange={(e) => setCostCenterForm(prev => ({ ...prev, type: e.target.value as CostCenterType }))} className="mt-1 w-full border rounded p-2">
                  <option value={CostCenterType.PRODUCTION}>Produção</option>
                  <option value={CostCenterType.ADMIN}>Administração</option>
                  <option value={CostCenterType.TRANSPORT}>Transporte</option>
                  <option value={CostCenterType.SALES}>Vendas</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setIsCostCenterOpen(false); }} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={submitCostCenter} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPendingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl bg-white rounded shadow p-6">
            <h3 className="text-lg font-medium mb-4">{editingPending ? 'Editar Item' : 'Novo Item por Faturar'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="pending-client" className="block text-sm">Cliente</label>
                <select id="pending-client" title="Cliente" aria-label="Cliente" value={pendingForm.clientId || ''} onChange={(e) => setPendingForm(prev => ({ ...prev, clientId: e.target.value }))} className="mt-1 w-full border rounded p-2">
                  <option value="">-- selecione --</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name || c.nome}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pending-item" className="block text-sm">Produto</label>
                <select id="pending-item" title="Produto" aria-label="Produto" value={pendingForm.itemId || ''} onChange={(e) => setPendingForm(prev => ({ ...prev, itemId: e.target.value }))} className="mt-1 w-full border rounded p-2">
                  <option value="">-- selecione --</option>
                  {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pending-qty" className="block text-sm">Quantidade</label>
                <input id="pending-qty" title="Quantidade" aria-label="Quantidade" placeholder="0" type="number" value={pendingForm.quantity || 0} onChange={(e) => setPendingForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full border rounded p-2" />
              </div>
              <div>
                <label htmlFor="pending-unitprice" className="block text-sm">Preço Unit.</label>
                <input id="pending-unitprice" title="Preço unitário" aria-label="Preço unitário" placeholder="0.00" type="number" step="0.01" value={pendingForm.unitPrice || 0} onChange={(e) => setPendingForm(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))} className="mt-1 w-full border rounded p-2" />
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-3">
                <button onClick={() => setIsPendingOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={submitPending} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faturamento;
