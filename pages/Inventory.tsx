import React, { useState, useMemo, useEffect } from 'react';
import { useLogistics } from '../context/useLogistics';
import { MapPin, Plus, Box, Save, X, Truck, Trash2, History } from 'lucide-react';
import { ItemType, ItemCondition } from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';

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
    updateItem,
    allUsers,
    createFicha,
    itemCategories,
    getItemCategoryName,
    fichasIndividuais,
    accountingEntries
  } = useLogistics();

  const [filterLoc, setFilterLoc] = useState<string>(selectedDepartmentId || currentUser?.locationId || 'all');
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<any>(null); // State for editing an item
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
  const [itemToDeliver, setItemToDeliver] = useState<{ itemId: string, locationId: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<{ itemId?: string, locationId?: string } | null>(null);

  // Estados para geração automática de SKU
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [generatedSku, setGeneratedSku] = useState<string>('');

  // Mapeamento de categorias para siglas
  const categoryAbbreviations: Record<string, string> = {
    'Combustível': 'FUEL',
    'Óleo': 'OIL',
    'Peças': 'PART',
    'Ferramenta': 'TOOL',
    'EPI': 'EPI',
    'Escritório': 'OFF',
    'Limpeza': 'CLEAN',
    'Tecnologia': 'TECH',
    'TI': 'IT',
    'Insumo': 'SUP',
    'Outros': 'OTH'
  };

  // Função para gerar sigla do local
  const generateLocationAbbrev = (locationName: string): string => {
    // Mapeamento especial para locais conhecidos
    const specialMappings: Record<string, string> = {
      'Sofala': 'SF',
      'Maputo': 'MP',
      'Inhambane': 'IH',
      'Gaza': 'GZ',
      'Manica': 'MC',
      'Tete': 'TT',
      'Nampula': 'NP',
      'Zambézia': 'ZB',
      'Cabo Delgado': 'CD',
      'Niassa': 'NS'
    };

    if (specialMappings[locationName]) {
      return specialMappings[locationName];
    }

    // Fallback: primeiras letras maiúsculas
    const words = locationName.split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.map(word => word.charAt(0)).join('').toUpperCase();
  };

  // Função para gerar SKU automático (categoria = nome, alinhado com FK items.category → item_categories.name)
  const generateSku = (categoryName: string, locationId: string): string => {
    if (!categoryName || !locationId) return '';

    const location = locations.find(l => l.id === locationId);
    if (!location) return '';

    const locationAbbrev = generateLocationAbbrev(location.name);
    const categoryAbbrev = categoryAbbreviations[categoryName] || categoryName.substring(0, 4).toUpperCase();

    // Contar itens existentes nesta categoria
    const itemsInCategory = items.filter(item => item.category === categoryName);
    const nextNumber = (itemsInCategory.length + 1).toString().padStart(2, '0');

    return `${locationAbbrev}-${categoryAbbrev}-${nextNumber}`;
  };

  // Efeito para gerar SKU automaticamente
  useEffect(() => {
    if (itemToEdit) return; // Não gerar SKU automático se estiver editando
    const sku = generateSku(selectedCategory, selectedLocation);
    setGeneratedSku(sku);
  }, [selectedCategory, selectedLocation, items, locations, itemToEdit]);

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
            onClick={() => { setHistoryFilter(null); setIsHistoryModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-blue-100 text-blue-900 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-200 transition shadow-sm text-sm font-black w-full sm:w-auto"
            title="Ver histórico geral de armazém"
          >
            <History size={16} /> Histórico Geral
          </button>

          <button
            onClick={() => setIsAddStockModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-black px-4 py-2 rounded-lg hover:bg-emerald-500 transition shadow-sm text-sm font-black w-full sm:w-auto"
            title="Registrar entrada de estoque"
          >
            <Box size={16} /> Entrada
          </button>

          {isAdminOrGM && (
            <button
              onClick={() => {
                setItemToEdit(null);
                setSelectedCategory('');
                setSelectedLocation('');
                setGeneratedSku('');
                setIsNewItemModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-200 transition shadow-sm text-sm font-black w-full sm:w-auto"
              title="Cadastrar um novo tipo de item"
            >
              <Plus size={16} /> Novo Item
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map((record) => {
          const item = items.find(i => i.id === record.itemId);
          const location = locations.find(l => l.id === record.locationId);

          return (
            <div key={`${record.itemId}-${record.locationId}`} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${item?.type === ItemType.ASSET ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>{getItemCategoryName(item?.category)}</span>
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
                onClick={() => {
                  const qty = prompt(`Quantas unidades de ${item?.name} deseja solicitar?`);
                  if (qty && !isNaN(Number(qty))) {
                    createRequisition(record.itemId, Number(qty), ItemCondition.NEW, currentUser?.locationId || undefined);
                  }
                }}
                className="mt-4 w-full bg-slate-100 text-slate-700 py-2 rounded flex items-center justify-center gap-2 hover:bg-slate-200 transition text-sm font-medium"
              >
                <Truck size={14} /> Solicitar
              </button>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => { setItemToDeliver({ itemId: record.itemId, locationId: record.locationId }); setIsDeliverModalOpen(true); }}
                  className="w-full bg-emerald-50 text-emerald-700 py-2 rounded flex items-center justify-center gap-2 hover:bg-emerald-100 transition text-sm font-bold border border-emerald-100 shadow-sm"
                >
                  <Box size={14} /> Entregar
                </button>
                <button
                  onClick={() => { setHistoryFilter({ itemId: record.itemId, locationId: record.locationId }); setIsHistoryModalOpen(true); }}
                  className="w-full bg-blue-50 text-blue-700 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-100 transition text-sm font-bold border border-blue-100 shadow-sm"
                >
                  <History size={14} /> Histórico
                </button>
              </div>

              {isAdminOrGM && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button 
                    onClick={() => {
                      setItemToEdit(item);
                      setSelectedCategory(item?.category || '');
                      setSelectedLocation(record.locationId);
                      setGeneratedSku(item?.sku || '');
                      setIsNewItemModalOpen(true);
                    }}
                    className="bg-blue-50 text-blue-600 py-2 rounded flex items-center justify-center gap-2 hover:bg-blue-100 transition text-sm font-medium border border-blue-200"
                  >
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
              <h3 className="text-xl font-bold text-gray-800">{itemToEdit ? 'Editar Item' : 'Cadastrar Novo Item'}</h3>
              <button onClick={() => { setIsNewItemModalOpen(false); setItemToEdit(null); }} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = e.target as any;
              
              if (itemToEdit) {
                // UPDATE ITEM
                await updateItem(itemToEdit.id, {
                  name: f.name.value,
                  sku: f.sku.value,
                  category: f.category.value,
                  unit: f.unit.value,
                  type: f.behavior.value as ItemType,
                  price: parseFloat(f.price.value || '0')
                });
              } else {
                // CREATE ITEM
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
              }
              setIsNewItemModalOpen(false);
              setItemToEdit(null);
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Item</label>
                <input name="name" defaultValue={itemToEdit ? itemToEdit.name : ''} required className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Toner HP 85A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">SKU / Código (Gerado Automaticamente)</label>
                <input 
                  name="sku" 
                  value={generatedSku}
                  readOnly 
                  className="w-full border rounded-lg p-2.5 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none" 
                  placeholder="Selecione categoria e localização" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
                <select 
                  name="category" 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">Selecione uma categoria</option>
                  {itemCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                {itemCategories.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    Nenhuma categoria disponível. Se o problema persistir, em Configurações adicione categorias ou confira no Supabase se a política RLS permite inserir em <code className="text-[10px]">item_categories</code>.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Unidade de Medida</label>
                <select name="unit" defaultValue={itemToEdit ? itemToEdit.unit : 'Unid'} className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="Unid">Unidade</option>
                  <option value="Kg">Quilograma</option>
                  <option value="L">Litro</option>
                  <option value="M">Metro</option>
                  <option value="Cx">Caixa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Comportamento</label>
                <select name="behavior" defaultValue={itemToEdit ? itemToEdit.type : ItemType.CONSUMABLE} className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value={ItemType.CONSUMABLE}>Consumível (Produto)</option>
                  <option value={ItemType.ASSET}>Ativo Imobilizado</option>
                </select>
              </div>
              {!itemToEdit && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantidade Inicial</label>
                  <input name="qty" type="number" step="0.01" defaultValue={0} className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Localização{itemToEdit ? '' : ' Inicial'}</label>
                <select 
                  name="locationId" 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  disabled={!!itemToEdit}
                >
                  <option value="">Selecione uma localização</option>
                  {locations.filter(l => l.type !== 'CENTRAL').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Unitário de Compra (MT)</label>
                <input name="price" type="number" step="0.01" defaultValue={itemToEdit ? itemToEdit.price : 0} className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => { setIsNewItemModalOpen(false); setItemToEdit(null); }} className="px-6 py-2.5 rounded-lg border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-md">{itemToEdit ? 'Salvar Alterações' : 'Cadastrar Item'}</button>
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
                  {locations.filter(l => l.type !== 'CENTRAL').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
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

      {/* History Modal */}
      <InventoryHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        filter={historyFilter}
        fichasIndividuais={fichasIndividuais}
        accountingEntries={accountingEntries}
        allUsers={allUsers}
        locations={locations}
      />

    </div>
  );
};

interface HistoryRecord {
  id: string;
  date: string;
  type: 'ENTRADA' | 'SAIDA' | 'RETORNO';
  itemId: string;
  itemName: string;
  quantity: number;
  user: string;
  description: string;
}

const InventoryHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filter: { itemId?: string, locationId?: string } | null;
  fichasIndividuais: any[];
  accountingEntries: any[];
  allUsers: any[];
  locations: any[];
}> = ({ isOpen, onClose, filter, fichasIndividuais, accountingEntries, allUsers }) => {
  if (!isOpen) return null;

  const records = React.useMemo(() => {
    const list: HistoryRecord[] = [];

    fichasIndividuais.forEach(f => {
      // Check for 'produto_id' logic, handles legacy 'produto_name' if needed
      if (filter?.itemId && f.produto_id !== filter.itemId) return;
      
      const isRetorno = (f.stock_depois ?? 0) > (f.stock_antes ?? 0);
      list.push({
        id: f.id,
        date: f.created_at || f.data,
        type: isRetorno ? 'RETORNO' : 'SAIDA',
        itemId: f.produto_id,
        itemName: f.produto || f.produto_name || 'Produto Desconhecido',
        quantity: isRetorno ? Math.abs(f.quantidade || f.quantity_delivered || 0) : Math.abs(f.quantidade || f.quantity_delivered || 0),
        user: allUsers.find(u => u.id === f.entidade_id)?.name || f.entidade_id || 'Trabalhador',
        description: f.observacoes || (isRetorno ? 'Devolução de material' : 'Entrega a funcionário')
      });
    });

    accountingEntries.forEach(a => {
      if (filter?.itemId && a.itemId !== filter.itemId) return;
      if (filter?.locationId && a.locationId !== filter.locationId) return;

      list.push({
        id: a.id,
        date: a.date,
        type: 'ENTRADA',
        itemId: a.itemId,
        itemName: a.itemName,
        quantity: a.quantity,
        user: allUsers.find(u => u.id === a.userId)?.name || 'Admin',
        description: 'Adição de novo stock'
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filter, fichasIndividuais, accountingEntries, allUsers]);

  const totalAdded = records.filter(r => r.type === 'ENTRADA').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalDelivered = records.filter(r => r.type === 'SAIDA').reduce((acc, curr) => acc + curr.quantity, 0);
  const totalReturned = records.filter(r => r.type === 'RETORNO').reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <History className="text-blue-600" />
              {filter?.itemId ? 'Histórico do Item' : 'Histórico Geral de Armazém'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">Acompanhe todas as entradas, entregas e devoluções.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"><X size={20} /></button>
        </div>

        {filter?.itemId && (
          <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-100 bg-white">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs uppercase tracking-widest font-bold text-emerald-600 mb-1">Total Entradas</p>
              <p className="text-2xl font-black text-emerald-700">+{totalAdded}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="text-xs uppercase tracking-widest font-bold text-orange-600 mb-1">Total Entregue</p>
              <p className="text-2xl font-black text-orange-700">-{totalDelivered}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs uppercase tracking-widest font-bold text-blue-600 mb-1">Total Retornado</p>
              <p className="text-2xl font-black text-blue-700">+{totalReturned}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {records.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Nenhum registo histórico encontrado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map(record => (
                <div key={record.id} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-md transition bg-white shadow-sm">
                  <div className="flex-shrink-0 pt-1">
                    {record.type === 'ENTRADA' && <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200"><Box size={18} /></div>}
                    {record.type === 'SAIDA' && <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border border-orange-200"><Truck size={18} /></div>}
                    {record.type === 'RETORNO' && <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200"><History size={18} /></div>}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded
                          ${record.type === 'ENTRADA' ? 'bg-emerald-50 text-emerald-700 break-keep' :
                            record.type === 'SAIDA' ? 'bg-orange-50 text-orange-700 break-keep' :
                            'bg-blue-50 text-blue-700 break-keep'}`
                        }>
                          {record.type}
                        </span>
                        <h4 className="font-bold text-gray-900 truncate">{record.itemName}</h4>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap bg-gray-50 px-2 py-1 rounded-md border border-gray-200 shadow-sm ml-2">
                        {formatFlexibleDate(record.date)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">{record.description}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] uppercase font-bold text-gray-600 border border-gray-200">
                          {record.user.substring(0, 2)}
                        </div>
                        {record.user}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-center pl-4 border-l border-gray-100 min-w-[80px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">QTD</span>
                    <span className={`text-xl font-black ${
                      record.type === 'ENTRADA' ? 'text-emerald-600' :
                      record.type === 'SAIDA' ? 'text-orange-600' :
                      'text-blue-600'
                    }`}>
                      {record.type === 'SAIDA' ? '-' : '+'}{record.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
