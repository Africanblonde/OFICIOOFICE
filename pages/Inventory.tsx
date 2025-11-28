
import React, { useState, useEffect } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MapPin, Plus, Box, Save, X, Truck } from 'lucide-react';
import { ItemCondition, ItemType } from '../types';

export const Inventory = () => {
  const { locations, items, inventory, currentUser, selectedDepartmentId, registerNewItem, addToInventory, createRequisition, itemTypes, measureUnits, getItemName, isAdminOrGM } = useLogistics();
  const [filterLoc, setFilterLoc] = useState(selectedDepartmentId || currentUser.locationId);

  // Modals state
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Form states with Price
  const [newItemData, setNewItemData] = useState({ name: '', sku: '', itemTypeId: '', unit: '', qty: 1, locationId: '', unitPrice: 0 });
  const [addStockData, setAddStockData] = useState({ itemId: '', qty: 1, locationId: '', unitPrice: 0 });
  
  // Request from Stock Form State
  const [requestData, setRequestData] = useState({ 
    itemId: '', 
    targetLocationId: currentUser.locationId, 
    qty: 1,
    condition: ItemCondition.NEW
  });

  useEffect(() => {
    if (selectedDepartmentId) {
      setFilterLoc(selectedDepartmentId);
      // Update form defaults too
      setNewItemData(prev => ({ ...prev, locationId: selectedDepartmentId }));
      setAddStockData(prev => ({ ...prev, locationId: selectedDepartmentId }));
    } else if (currentUser.role !== 'ADMIN') {
        setFilterLoc(currentUser.locationId);
        setNewItemData(prev => ({ ...prev, locationId: currentUser.locationId }));
        setAddStockData(prev => ({ ...prev, locationId: currentUser.locationId }));
    } else {
        setFilterLoc('all');
    }
  }, [selectedDepartmentId, currentUser]);

  const filteredInventory = inventory.filter(inv => {
    if (filterLoc === 'all') return true;
    return inv.locationId === filterLoc;
  });

  const handleRegisterItem = (e: React.FormEvent) => {
    e.preventDefault();
    const locId = newItemData.locationId || locations[0].id;
    const unit = newItemData.unit || measureUnits[0];
    
    // Find selected Item Type Definition to get name and behavior
    const typeDef = itemTypes.find(t => t.id === newItemData.itemTypeId);
    const category = typeDef ? typeDef.name : 'Geral';
    const behavior = typeDef ? typeDef.behavior : ItemType.ASSET;
    
    registerNewItem(newItemData.name, newItemData.sku, category, unit, behavior, newItemData.qty, locId, newItemData.unitPrice);
    setIsNewItemModalOpen(false);
    setNewItemData({ name: '', sku: '', itemTypeId: '', unit: '', qty: 1, locationId: '', unitPrice: 0 });
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const locId = addStockData.locationId || locations[0].id;
    const itId = addStockData.itemId || items[0].id;
    
    addToInventory(itId, locId, addStockData.qty, addStockData.unitPrice);
    setIsAddStockModalOpen(false);
    setAddStockData({ itemId: '', qty: 1, locationId: '', unitPrice: 0 });
  };

  const handleOpenRequest = (itemId: string) => {
      setRequestData({
          itemId,
          targetLocationId: currentUser.locationId,
          qty: 1,
          condition: ItemCondition.NEW
      });
      setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
      e.preventDefault();
      createRequisition(requestData.itemId, requestData.qty, requestData.condition, requestData.targetLocationId);
      setIsRequestModalOpen(false);
  };

  const handleAddStockItemChange = (itemId: string) => {
     // Pre-fill price from item definition
     const item = items.find(i => i.id === itemId);
     setAddStockData({ ...addStockData, itemId, unitPrice: item?.price || 0 });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Controle de Estoque</h2>
           <p className="text-sm text-gray-500">Visualização e gestão de ativos por localidade.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
            {/* Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
                <MapPin size={18} className="text-gray-400 ml-2" />
                <select 
                    value={filterLoc} 
                    onChange={(e) => setFilterLoc(e.target.value)}
                    className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none pr-4 w-full sm:w-auto bg-white text-gray-900"
                >
                    <option value="all">Todas as Localizações</option>
                    {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                </select>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
                <button 
                    onClick={() => setIsAddStockModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition shadow-sm text-sm font-medium w-full sm:w-auto"
                >
                    <Box size={16} /> Entrada
                </button>
                {/* Only Admin/GM can create brand new item definitions, or Managers if permitted (currently restricting to keep data clean) */}
                {isAdminOrGM && (
                    <button 
                        onClick={() => setIsNewItemModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium w-full sm:w-auto"
                    >
                        <Plus size={16} /> Novo Item
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map((record, idx) => {
            const item = items.find(i => i.id === record.itemId);
            const location = locations.find(l => l.id === record.locationId);
            
            return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                             <div className="flex gap-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${item?.type === ItemType.ASSET ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{item?.category}</span>
                                <span className="text-xs font-bold px-2 py-1 bg-gray-50 text-gray-600 rounded uppercase tracking-wider border border-gray-100">{item?.unit}</span>
                             </div>
                             <span className="text-xs text-gray-400">{item?.sku}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{item?.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> {location?.name}
                        </p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-end justify-between">
                         <div className="text-xs text-gray-400">Quantidade Disponível</div>
                         <div className={`text-2xl font-bold ${record.quantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>
                             {record.quantity}
                         </div>
                    </div>
                    
                    {/* Botão de Solicitar dentro do Card */}
                    <button 
                        onClick={() => handleOpenRequest(record.itemId)}
                        className="mt-4 w-full bg-slate-100 text-slate-700 py-2 rounded flex items-center justify-center gap-2 hover:bg-slate-200 transition text-sm font-medium"
                    >
                        <Truck size={14} /> Solicitar
                    </button>
                </div>
            );
        })}
        
        {filteredInventory.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                Nenhum item encontrado nesta localização.
            </div>
        )}
      </div>

      {/* New Item Modal */}
      {isNewItemModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Cadastrar Novo Item (Definição)</h3>
                    <button onClick={() => setIsNewItemModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleRegisterItem} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                          <input required type="text" className="w-full border rounded p-2 bg-white text-gray-900" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} placeholder="Ex: Pá Florestal" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                            <input required type="text" className="w-full border rounded p-2 bg-white text-gray-900" value={newItemData.sku} onChange={e => setNewItemData({...newItemData, sku: e.target.value})} placeholder="FER-001" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Item</label>
                            <select 
                                required 
                                className="w-full border rounded p-2 bg-white text-gray-900" 
                                value={newItemData.itemTypeId} 
                                onChange={e => setNewItemData({...newItemData, itemTypeId: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {itemTypes.map(t => (
                                   <option key={t.id} value={t.id}>{t.name} ({t.behavior === ItemType.ASSET ? 'Ativo' : 'Consumível'})</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-gray-500 mt-1">Define comportamento Contábil.</p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                             <select 
                                required 
                                className="w-full border rounded p-2 bg-white text-gray-900" 
                                value={newItemData.unit} 
                                onChange={e => setNewItemData({...newItemData, unit: e.target.value})}
                             >
                                 <option value="">Selecione...</option>
                                 {measureUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Preço Un. (MZN)</label>
                             <input 
                                required type="number" min="0" 
                                className="w-full border rounded p-2 bg-white text-gray-900" 
                                value={newItemData.unitPrice} 
                                onChange={e => setNewItemData({...newItemData, unitPrice: parseFloat(e.target.value)})} 
                             />
                          </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded border border-gray-100">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Estoque Inicial</p>
                          <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                                <select 
                                    className="w-full border rounded p-2 bg-white text-gray-900" 
                                    value={newItemData.locationId} 
                                    onChange={e => setNewItemData({...newItemData, locationId: e.target.value})}
                                    disabled={!isAdminOrGM} // Lock location for Managers
                                >
                                    <option value="">Selecione...</option>
                                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                                <input type="number" min="0" className="w-full border rounded p-2 bg-white text-gray-900" value={newItemData.qty} onChange={e => setNewItemData({...newItemData, qty: parseInt(e.target.value)})} />
                            </div>
                          </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium w-full">Cadastrar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Add Stock Modal */}
      {isAddStockModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Entrada de Estoque</h3>
                    <button onClick={() => setIsAddStockModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddStock} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                        <select className="w-full border rounded p-2 bg-white text-gray-900" value={addStockData.itemId} onChange={e => handleAddStockItemChange(e.target.value)}>
                            <option value="">Selecione o item...</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Localização (Destino)</label>
                        <select 
                            className={`w-full border rounded p-2 bg-white text-gray-900 ${!isAdminOrGM ? 'bg-gray-100 text-gray-500' : ''}`}
                            value={addStockData.locationId} 
                            onChange={e => setAddStockData({...addStockData, locationId: e.target.value})}
                            disabled={!isAdminOrGM} // Managers can only add to their location (which is pre-selected)
                        >
                            <option value="">Selecione a localização...</option>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <input required type="number" min="1" className="w-full border rounded p-2 bg-white text-gray-900" value={addStockData.qty} onChange={e => setAddStockData({...addStockData, qty: parseInt(e.target.value)})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Un. (MZN)</label>
                            <input required type="number" min="0" className="w-full border rounded p-2 bg-white text-gray-900" value={addStockData.unitPrice} onChange={e => setAddStockData({...addStockData, unitPrice: parseFloat(e.target.value)})} />
                          </div>
                      </div>
                      <p className="text-xs text-gray-500">Isso registrará uma entrada contábil e atualizará o patrimônio.</p>
                      <div className="flex justify-end gap-2 mt-4">
                          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 font-medium w-full">Confirmar Entrada</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Request Modal (Triggered from Card) */}
      {isRequestModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Solicitar Item</h3>
                    <button onClick={() => setIsRequestModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                  </div>
                  <div className="mb-4 text-sm text-gray-500">
                      Solicitando: <span className="font-bold text-gray-800">{getItemName(requestData.itemId)}</span>
                  </div>
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Destino (Onde será entregue?)</label>
                          <select 
                            className="w-full border rounded p-2 bg-white text-gray-900" 
                            value={requestData.targetLocationId} 
                            onChange={e => setRequestData({...requestData, targetLocationId: e.target.value})}
                          >
                              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                          </select>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Requerente</label>
                          <input 
                            type="text" 
                            disabled 
                            className="w-full border rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed" 
                            value={currentUser.name} 
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                            <input required type="number" min="1" className="w-full border rounded p-2 bg-white text-gray-900" value={requestData.qty} onChange={e => setRequestData({...requestData, qty: parseInt(e.target.value)})} />
                          </div>
                          <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Condição</label>
                             <select 
                                className="w-full border rounded p-2 bg-white text-gray-900"
                                value={requestData.condition}
                                onChange={(e) => setRequestData({...requestData, condition: e.target.value as ItemCondition})}
                             >
                                 <option value={ItemCondition.NEW}>Novo</option>
                                 <option value={ItemCondition.GOOD}>Bom</option>
                                 <option value={ItemCondition.FAIR}>Regular</option>
                             </select>
                          </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-6">
                          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium w-full flex items-center justify-center gap-2">
                              <Truck size={16} /> Enviar Requisição
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};
