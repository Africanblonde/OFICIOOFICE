import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/useLogistics';
import { MapPin, Plus, Box, Save, X, Truck, Trash2 } from 'lucide-react';
import { ItemType } from '../types';

export const Inventory: React.FC = () => {
  const {
    locations,
    items,
    inventory,
    currentUser,
    selectedDepartmentId,
    registerNewItem,
    addToInventory,
    createRequisition,
    itemTypes,
    isAdminOrGM,
    deleteItem,
    allUsers,
    createFicha,
    categories
  } = useLogistics();

  const [filterLoc, setFilterLoc] = useState<string>(selectedDepartmentId || currentUser?.locationId || 'all');
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [itemToDeliver, setItemToDeliver] = useState<{ itemId: string, locationId: string } | null>(null);

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    if (!filterLoc || filterLoc === 'all') return inventory;
    return inventory.filter(r => r.locationId === filterLoc);
  }, [inventory, filterLoc]);

  const handleDeliverToPerson = async (personId: string, itemId: string, qty: number, explicitLocationId?: string) => {
    if (!personId) return alert('Selecione uma pessoa');
    const user = allUsers.find(u => u.id === personId);

    // Use the explicit location from the inventory card, or fallback to user's location
    const sourceLocationId = explicitLocationId || user?.locationId;

    if (!sourceLocationId) return alert('Localização não definida. Não há stock aqui.');
    const item = items.find(i => i.id === itemId);
    if (!item) return alert('Item inválido');

    try {
      await createFicha({
        tipo: 'materiais', // O Contexto irá especializar este tipo se detetar combustível/óleo etc.
        entidade_id: personId,
        entidade_tipo: 'trabalhador',
        data: new Date().toISOString().split('T')[0],
        produto_id: itemId,
        produto: item.name || '',
        quantidade: qty,
        unidade: item.unit || 'Unidade',
        usuario_registou: currentUser?.id || '',
        estado: 'confirmado'
      }, sourceLocationId);
      alert('Entrega registrada');
      setIsDeliverModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao registrar entrega');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Controle de Estoque</h2>
          <p className="text-sm text-gray-500">Visualização e gestão de ativos por localidade.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-full sm:w-auto">
            <MapPin size={18} className="text-gray-400 ml-2" />
            <select
              aria-label="Filtrar por localização"
              value={filterLoc || ''}
              onChange={(e) => setFilterLoc(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none pr-4 w-full sm:w-auto bg-white text-gray-900"
            >
              <option value="all">Todas as Localizações</option>
              {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
            </select>
          </div>

          <button
            onClick={() => setIsAddStockModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-black px-4 py-2 rounded-lg hover:bg-emerald-500 transition shadow-sm text-sm font-black w-full sm:w-auto"
            title="Registrar entrada de estoque"
          >
            <Box size={16} /> Entrada
          </button>

          {isAdminOrGM && (
            <button
              onClick={() => setIsNewItemModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-200 transition shadow-sm text-sm font-black w-full sm:w-auto"
              title="Cadastrar um novo tipo de item"
            >
              <Plus size={16} /> Novo Item
            </button>
          )}
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
                <div className={`text-2xl font-bold ${record.quantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>{record.quantity}</div>
              </div>

              <button
                onClick={() => {/* open request modal - simplified for now */ }}
                className="mt-4 w-full bg-slate-100 text-slate-700 py-2 rounded flex items-center justify-center gap-2 hover:bg-slate-200 transition text-sm font-medium"
              >
                <Truck size={14} /> Solicitar
              </button>

              <button
                onClick={() => { setItemToDeliver({ itemId: record.itemId, locationId: record.locationId }); setIsDeliverModalOpen(true); }}
                className="mt-2 w-full bg-emerald-50 text-emerald-700 py-2 rounded flex items-center justify-center gap-2 hover:bg-emerald-100 transition text-sm font-bold border border-emerald-100 shadow-sm"
              >
                <Box size={14} /> Entregar a Pessoa
              </button>

              {isAdminOrGM && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button className="bg-blue-50 text-blue-600 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-100 transition text-sm font-medium border border-blue-200">
                    <Save size={14} /> Editar
                  </button>
                  <button onClick={() => deleteItem(record.itemId)} className="bg-red-50 text-red-600 py-2 rounded flex items-center justify-center gap-2 hover:bg-red-100 transition text-sm font-medium border border-red-200">
                    <Trash2 size={14} /> Apagar
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filteredInventory.length === 0 && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">Nenhum item encontrado nesta localização.</div>
        )}
      </div>

      {/* Minimal Deliver Modal (simplified) */}
      {isDeliverModalOpen && itemToDeliver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Entregar Material</h3>
              <button onClick={() => setIsDeliverModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const form = e.target as any; if (itemToDeliver) handleDeliverToPerson(form.person.value, itemToDeliver.itemId, parseFloat(form.qty.value || '1'), itemToDeliver.locationId); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa</label>
                <select name="person" className="w-full border rounded p-2 bg-white text-gray-900">
                  <option value="">Selecione</option>
                  {allUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input name="qty" type="number" step="0.01" defaultValue={1} className="w-full border rounded p-2 bg-white text-gray-900" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsDeliverModalOpen(false)} className="px-4 py-2 rounded border">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Item */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Cadastrar Novo Item</h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = e.target as any;
              await registerNewItem(
                f.name.value,
                f.sku.value,
                f.category.value,
                f.unit.value,
                f.behavior.value as ItemType,
                parseFloat(f.qty.value || '0'),
                f.locationId.value,
                parseFloat(f.price.value || '0')
              );
              setIsNewItemModalOpen(false);
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Item</label>
                <input name="name" required className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Toner HP 85A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">SKU / Código</label>
                <input name="sku" required className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: THP-85A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
                <select name="category" className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unidade de Medida</label>
                <select name="unit" className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="Unid">Unidade</option>
                  <option value="Kg">Quilograma</option>
                  <option value="L">Litro</option>
                  <option value="M">Metro</option>
                  <option value="Cx">Caixa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Comportamento</label>
                <select name="behavior" className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value={ItemType.CONSUMABLE}>Consumível (Produto)</option>
                  <option value={ItemType.ASSET}>Ativo Imobilizado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade Inicial</label>
                <input name="qty" type="number" step="0.01" defaultValue={0} className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Localização Inicial</label>
                <select name="locationId" className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Unitário de Compra (MT)</label>
                <input name="price" type="number" step="0.01" defaultValue={0} className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsNewItemModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md">Cadastrar Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Entrada */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Dar Entrada em Estoque</h3>
              <button onClick={() => setIsAddStockModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = e.target as any;
              const item = items.find(i => i.id === f.itemId.value);
              await addToInventory(
                f.itemId.value,
                f.locationId.value,
                parseFloat(f.qty.value),
                parseFloat(f.price.value || '0'),
                item?.name
              );
              setIsAddStockModalOpen(false);
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Item / Produto</label>
                <select name="itemId" required className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Selecione o item...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Localização de Destino</label>
                <select name="locationId" required className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade</label>
                  <input name="qty" type="number" step="0.01" required className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Un. (MT)</label>
                  <input name="price" type="number" step="0.01" className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsAddStockModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md">Registrar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
