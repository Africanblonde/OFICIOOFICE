import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/useLogistics';
import { FichaTipo, RegistoEstado, User, Item, FichaIndividual } from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';
import {
  User as UserIcon,
  CheckCircle,
  Clock,
  Plus,
  ChevronRight,
  ChevronLeft,
  History,
  Lock,
  Calendar,
  X,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Package,
  ExternalLink,
  Printer
} from 'lucide-react';

export const mapItemToFichaTipo = (item: Item, resolvedCategoryName?: string): FichaTipo => {
  const category = (resolvedCategoryName ?? item.category ?? '').toLowerCase();
  const name = (item.name || '').toLowerCase();

  if (category.includes('combust') || name.includes('combust') || name.includes('gasolina') || name.includes('diesel')) {
    return 'combustivel';
  }
  if (category.includes('oleo') || name.includes('oleo')) {
    return 'oleo';
  }
  if (category.includes('ferramenta') || name.includes('ferramenta')) {
    return 'ferramentas';
  }
  if (category.includes('peca') || name.includes('peca')) {
    return 'pecas';
  }
  if (category.includes('epi') || name.includes('material') || name.includes('insumo')) {
    return 'materiais';
  }

  return 'materiais';
};

export const FichasIndividuais = () => {
  const {
    fichasIndividuais, currentUser, allUsers, isAdminOrGM, items, inventory,
    createFicha, returnFromFicha, confirmFicha, lockFicha, deleteFicha, locations,
    getItemCategoryName
  } = useLogistics();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState<FichaTipo | 'todos'>('todos');

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedReturnFicha, setSelectedReturnFicha] = useState<FichaIndividual | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(0);
  const [returnObservacoes, setReturnObservacoes] = useState<string>('');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Carrega dados quando seleciona uma pessoa
  React.useEffect(() => {
    if (selectedPersonId && fichasIndividuais.length === 0) {
      setIsLoadingData(true);
      const timeout = setTimeout(() => setIsLoadingData(false), 1500);
      return () => clearTimeout(timeout);
    }
  }, [selectedPersonId, fichasIndividuais.length]);

  // Filtered users for the list
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  // Selected person details
  const selectedPerson = useMemo(() =>
    allUsers.find(u => u.id === selectedPersonId),
    [allUsers, selectedPersonId]
  );

  // Deliveries for the selected person
  const personDeliveries = useMemo(() => {
    let filtered = fichasIndividuais.filter(f => f.entidade_id === selectedPersonId);
    if (filterTipo !== 'todos') {
      filtered = filtered.filter(f => f.tipo === filterTipo);
    }
    return filtered;
  }, [fichasIndividuais, selectedPersonId, filterTipo]);

  const getStatusIcon = (estado: RegistoEstado) => {
    switch (estado) {
      case 'pendente': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmado': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'trancado': return <Lock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTipoBadgeColor = (tipo: FichaTipo) => {
    switch (tipo) {
      case 'combustivel': return 'bg-amber-100 text-amber-800';
      case 'oleo': return 'bg-orange-100 text-orange-800';
      case 'pecas': return 'bg-blue-100 text-blue-800';
      case 'materiais': return 'bg-green-100 text-green-800';
      case 'ferramentas': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-8 h-8 text-emerald-600" />
            Fichas Individuais
          </h1>
          {!selectedPersonId && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Nova Entrega
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* List of Persons */}
          <div className={`${selectedPersonId ? 'hidden md:block md:col-span-4' : 'col-span-12'} bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all shrink-0`}>
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Procurar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum funcionário encontrado.</div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedPersonId(user.id)}
                    className={`w-full p-4 flex items-center justify-between hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0 ${selectedPersonId === user.id ? 'bg-emerald-50 border-r-4 border-r-emerald-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPersonId === user.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 line-clamp-1">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.jobTitle || 'Sem cargo'}</div>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 ${selectedPersonId === user.id ? 'text-emerald-500 translate-x-1' : ''} transition-transform`} />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Person Detail / History */}
          <div className={`${selectedPersonId ? 'col-span-12 md:col-span-8' : 'hidden md:flex md:col-span-8 items-center justify-center'} bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] overflow-hidden`}>
            {selectedPerson ? (
              <div className="h-full flex flex-col">
                {/* Detail Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedPersonId(null)}
                      title="Voltar"
                      aria-label="Voltar"
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg -ml-2"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedPerson.name}</h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium">{selectedPerson.jobTitle || 'Cargo não definido'}</span>
                        <span>•</span>
                        <span>{selectedPerson.locationId ? 'Local vinculado' : 'Sem local fixo'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Nova Entrega
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-2 border border-blue-200 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm transition-all"
                      title="Imprimir Ficha (PDF)"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Filters & Summary */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {(['todos', 'combustivel', 'oleo', 'pecas', 'materiais', 'ferramentas'] as const).map(tipo => (
                      <button
                        key={tipo}
                        onClick={() => setFilterTipo(tipo)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${filterTipo === tipo ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300'}`}
                      >
                        {tipo === 'todos' ? 'Todos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {personDeliveries.length} registros encontrados
                  </div>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto">
                  {isLoadingData ? (
                    <div className="p-20 text-center">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-500">Carregando registos...</p>
                    </div>
                  ) : personDeliveries.length === 0 ? (
                    <div className="p-20 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <History className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Sem histórico de entrega</h3>
                      <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">Este funcionário ainda não recebeu nenhuma entrega registada. Use o botão "Nova Entrega" para registar.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {personDeliveries.map(delivery => (
                        <div key={delivery.id} className="p-6 hover:bg-gray-50 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getTipoBadgeColor(delivery.tipo)}`}>
                                {delivery.tipo}
                              </span>
                              <span className="text-xs text-gray-400 font-mono tracking-tighter">{delivery.codigo}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                              {getStatusIcon(delivery.estado)}
                              <span className="text-gray-600 capitalize">{delivery.estado}</span>
                            </div>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{delivery.produto}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                <div className="text-2xl font-black text-emerald-600">
                                  {delivery.quantidade} <span className="text-sm font-medium text-gray-500">{delivery.unidade}</span>
                                </div>
                                <div className="h-4 w-px bg-gray-200"></div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Entrega</span>
                                  <span className="text-sm text-gray-600 font-medium">{formatFlexibleDate(delivery.created_at || delivery.data)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end justify-between h-full">
                              {delivery.stock_antes !== undefined && (
                                <div className="text-[10px] text-gray-400 flex flex-col items-end mb-2">
                                  <span className="uppercase font-bold tracking-widest">Saldo Stock</span>
                                  <div className="flex items-center gap-1 mt-0.5 font-medium">
                                    <span>{delivery.stock_antes}</span>
                                    <ArrowRight className="w-3 h-3" />
                                    <span className="text-emerald-600">{delivery.stock_depois}</span>
                                  </div>
                                </div>
                              )}
                              
                              {(delivery.stock_depois ?? 0) > (delivery.stock_antes ?? 0) ? (
                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100 inline-block mt-auto">Retorno</span>
                              ) : (
                                <button
                                  className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 px-3 py-1.5 rounded-lg transition-all shadow-sm mt-auto"
                                  onClick={() => {
                                    setSelectedReturnFicha(delivery);
                                    setReturnQuantity(Math.max(0.01, delivery.quantidade * 0.1));
                                    setReturnObservacoes('');
                                    setIsReturnModalOpen(true);
                                  }}
                                >
                                  Retornar ao Stock
                                </button>
                              )}
                            </div>
                          </div>
                          {delivery.observacoes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 italic">
                              "{delivery.observacoes}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-20 text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-inner">
                  <UserIcon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Selecione um Funcionário</h3>
                <p className="text-gray-500 mt-2">Escolha uma pessoa ao lado para visualizar seu histórico individual de entregas e consumos.</p>
                <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{allUsers.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Pessoas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{fichasIndividuais.length}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Entregas</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Printable Area (Hidden by default, visible only in print) */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 overflow-y-auto">
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; }
            @page { margin: 1.5cm; }
          }
        `}} />
        <div className="print-area font-sans text-gray-900">
          {/* Institution Header */}
          <div className="flex justify-between items-center border-b-2 border-emerald-600 pb-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl">🌲</div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">ULINKA UNI</h1>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.2em]">SISTEMA DE GESTÃO FLORESTAL & LOGÍSTICA</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">FICHA INDIVIDUAL DE MOVIMENTAÇÃO</p>
              <p className="text-[10px] text-gray-500">Documento gerado em {new Date().toLocaleDateString('pt-PT')} às {new Date().toLocaleTimeString('pt-PT')}</p>
            </div>
          </div>

          {/* User Info Card */}
          {selectedPerson && (
            <div className="grid grid-cols-3 gap-6 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200">
              <div className="col-span-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Pessoa / Beneficiário</p>
                <p className="text-lg font-bold text-gray-900">{selectedPerson.name}</p>
                <p className="text-xs text-gray-600">{selectedPerson.jobTitle || 'Sem cargo'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Localização Principal</p>
                <p className="text-sm font-bold text-gray-800">
                  {selectedPerson.locationId ? locations.find(l => l.id === selectedPerson.locationId)?.name : 'Não vinculada'}
                </p>
              </div>
              <div className="col-span-1 text-right">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total de Registos</p>
                <p className="text-xl font-black text-emerald-600">{personDeliveries.length}</p>
              </div>
            </div>
          )}

          {/* Table */}
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-gray-100 uppercase text-[10px] font-bold tracking-widest text-gray-600">
                <th className="p-3 border-b border-gray-200">Data</th>
                <th className="p-3 border-b border-gray-200">Código</th>
                <th className="p-3 border-b border-gray-200">Tipo</th>
                <th className="p-3 border-b border-gray-200">Produto / Material</th>
                <th className="p-3 border-b border-gray-200 text-right">Qtd</th>
                <th className="p-3 border-b border-gray-200">Unid</th>
                <th className="p-3 border-b border-gray-200">Saldo Stock</th>
                <th className="p-3 border-b border-gray-200">Retorno</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {personDeliveries.map(delivery => (
                <tr key={delivery.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="p-3 whitespace-nowrap">{formatFlexibleDate(delivery.data)}</td>
                  <td className="p-3 font-mono text-xs text-gray-500">{delivery.codigo}</td>
                  <td className="p-3"><span className="text-[9px] font-bold uppercase">{delivery.tipo}</span></td>
                  <td className="p-3 font-bold">{delivery.produto}</td>
                  <td className="p-3 text-right font-black text-emerald-600">{delivery.quantidade}</td>
                  <td className="p-3 text-xs text-gray-500">{delivery.unidade}</td>
                  <td className="p-3 text-xs text-gray-400">
                    {delivery.stock_antes} → {delivery.stock_depois}
                  </td>
                  <td className="p-3">
                    {delivery.delivery_type === 'RETORNO' ? (
                      <span className="text-xs font-semibold text-orange-600">Retorno</span>
                    ) : (
                      <button
                        className="text-xs text-emerald-600 hover:text-emerald-900"
                        onClick={() => {
                          setSelectedReturnFicha(delivery);
                          setReturnQuantity(Math.max(0.01, delivery.quantidade * 0.1));
                          setReturnObservacoes('');
                          setIsReturnModalOpen(true);
                        }}
                      >
                        Retornar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer / Signatures */}
          <div className="mt-20 grid grid-cols-2 gap-20">
            <div className="text-center pt-4 border-t border-gray-300">
              <p className="text-xs font-bold text-gray-900 uppercase">O Funcionário</p>
              <p className="text-[10px] text-gray-400 mt-1">Assinatura / Data</p>
            </div>
            <div className="text-center pt-4 border-t border-gray-300">
              <p className="text-xs font-bold text-gray-900 uppercase">A Administração / Logística</p>
              <p className="text-[10px] text-gray-400 mt-1">Assinatura / Carimbo</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-widest">Ulinka Uni - Eficiência e Sustentabilidade Florestal</p>
          </div>
        </div>
      </div>

      {/* Modal for new registration */}
        {isModalOpen && (
          <FichaDeliveryModal
            initialPersonId={selectedPersonId || undefined}
            allPeople={allUsers}
            allItems={items}
            inventory={inventory}
            locations={locations}
            currentUser={currentUser}
            getItemCategoryName={getItemCategoryName}
            onClose={() => setIsModalOpen(false)}
            onSave={async (data) => {
              await createFicha(data);
              setIsModalOpen(false);
            }}
          />
        )}

        {isReturnModalOpen && selectedReturnFicha && (
          <ReturnToStockModal
            ficha={selectedReturnFicha}
            maxQuantity={selectedReturnFicha.quantidade}
            quantity={returnQuantity}
            onQuantityChange={setReturnQuantity}
            observacoes={returnObservacoes}
            onObservacoesChange={setReturnObservacoes}
            locations={locations}
            currentUserLocationId={currentUser?.locationId}
            onClose={() => setIsReturnModalOpen(false)}
            onConfirm={async (selectedLocationId) => {
              await returnFromFicha(selectedReturnFicha.id, returnQuantity, returnObservacoes, selectedLocationId);
              setIsReturnModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

interface FichaDeliveryModalProps {
  initialPersonId?: string;
  allPeople: User[];
  allItems: Item[];
  inventory: any[];
  locations: any[];
  currentUser: User | null;
  getItemCategoryName: (id: string | null | undefined) => string;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const FichaDeliveryModal: React.FC<FichaDeliveryModalProps> = ({ initialPersonId, allPeople, allItems, inventory, locations, currentUser, getItemCategoryName, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tipo: 'combustivel' as FichaTipo,
    entidade_id: initialPersonId || '',
    entidade_tipo: 'trabalhador',
    data: new Date().toISOString().split('T')[0],
    produto_id: '',
    produto: '',
    quantidade: 1,
    unidade: 'Unidade',
    observacoes: ''
  });

  const [searchProduct, setSearchProduct] = useState('');
  const [showProductList, setShowProductList] = useState(false);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchProduct) return allItems.slice(0, 5);
    return allItems.filter(i =>
      i.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      i.sku?.toLowerCase().includes(searchProduct.toLowerCase())
    );
  }, [allItems, searchProduct]);

  // Selected person for stock location
  const selectedPerson = useMemo(() =>
    allPeople.find(u => u.id === formData.entidade_id),
    [allPeople, formData.entidade_id]
  );

  // Determine the location from which stock will be reduced
  const stockLocationId = useMemo(() =>
    selectedPerson?.locationId || currentUser?.locationId,
    [selectedPerson, currentUser]
  );

  // Get stock for the selected item AT THE CORRECT LOCATION
  const selectedItemStock = useMemo(() => {
    if (!formData.produto_id || !stockLocationId) return 0;
    const itemInventory = inventory.find(inv => inv.itemId === formData.produto_id && inv.locationId === stockLocationId);
    return itemInventory?.quantity || 0;
  }, [formData.produto_id, stockLocationId, inventory]);

  const selectedProduct = useMemo(() => {
    return allItems.find(item => item.id === formData.produto_id);
  }, [allItems, formData.produto_id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entidade_id || !formData.produto) {
      alert("Por favor, selecione o funcionário e o produto.");
      return;
    }
    if (formData.quantidade <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }
    if (formData.quantidade > selectedItemStock) {
      alert('Quantidade maior que o stock disponível');
      return;
    }
    onSave(formData);
  };

  const handleSelectProduct = (item: Item) => {
    setFormData({
      ...formData,
      produto_id: item.id,
      produto: item.name,
      unidade: item.unit || 'Unidade',
      tipo: mapItemToFichaTipo(item, getItemCategoryName(item.category))
    });
    setSearchProduct(item.name);
    setShowProductList(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Registrar Entrega de Material</h2>
            {stockLocationId && (
              <p className="text-emerald-100 text-[10px] mt-1 uppercase tracking-widest font-bold">
                Saída de: {locations.find(l => l.id === stockLocationId)?.name || 'Localização Desconhecida'}
              </p>
            )}
          </div>
          <button title="Fechar" aria-label="Fechar" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Person Selection */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Funcionário / Beneficiário</label>
              <select
                id="ficha-entidade"
                title="Funcionário"
                aria-label="Funcionário"
                value={formData.entidade_id}
                onChange={(e) => setFormData({ ...formData, entidade_id: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              >
                <option value="">Selecione um funcionário...</option>
                {allPeople.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.jobTitle || 'Sem cargo'})</option>
                ))}
              </select>
            </div>

            {/* Product Selection */}
            <div className="col-span-1 md:col-span-2 relative">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Produto / Material</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="ficha-search-product"
                  title="Pesquisar produto no inventário"
                  aria-label="Pesquisar produto no inventário"
                  type="text"
                  placeholder="Buscar no inventário..."
                  value={searchProduct}
                  onChange={(e) => {
                    setSearchProduct(e.target.value);
                    setShowProductList(true);
                  }}
                  onFocus={() => setShowProductList(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                {showProductList && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {filteredItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectProduct(item)}
                        className="w-full p-3 text-left hover:bg-emerald-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wide">{getItemCategoryName(item.category)} • SKU: {item.sku}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Produto meta */}
            <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Categoria do Produto</label>
                <input
                  type="text"
                  value={selectedProduct ? getItemCategoryName(selectedProduct.category) : 'Não selecionado'}
                  readOnly
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Unidade do Produto</label>
                <input
                  type="text"
                  value={formData.unidade}
                  readOnly
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Tipo and Date */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Categoria da Ficha</label>
              <select
                id="ficha-tipo"
                title="Categoria da ficha"
                aria-label="Categoria da ficha"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as FichaTipo })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="combustivel">Combustível</option>
                <option value="oleo">Óleo</option>
                <option value="pecas">Peças</option>
                <option value="materiais">Materiais</option>
                <option value="ferramentas">Ferramentas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Data de Entrega</label>
              <input
                id="ficha-data"
                title="Data da entrega"
                aria-label="Data da entrega"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>

            {/* Quantity and Unit */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-1 md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Quantidade a Entregar</label>
                {formData.produto_id && (
                  <div className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">
                    STOCK DISPONÍVEL: <span className="text-emerald-600">{selectedItemStock} {formData.unidade}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  id="ficha-quantidade"
                  title="Quantidade a entregar"
                  aria-label="Quantidade a entregar"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: parseFloat(e.target.value) })}
                  min="0.01"
                  className="w-full border border-gray-200 rounded-xl p-3 text-lg font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
                <div className="flex items-center px-4 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600">
                  {formData.unidade}
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Notas / Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
                placeholder="Ex: Entrega para manutenção de campo, requisição extra, etc."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all uppercase tracking-widest text-xs"
            >
              Confirmar Entrega
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ReturnToStockModalProps {
  ficha: FichaIndividual;
  maxQuantity: number;
  quantity: number;
  onQuantityChange: (q: number) => void;
  observacoes: string;
  onObservacoesChange: (obs: string) => void;
  onClose: () => void;
  onConfirm: (locationId: string) => Promise<void>;
  locations: any[];
  currentUserLocationId?: string | null;
}

const ReturnToStockModal: React.FC<ReturnToStockModalProps> = ({ ficha, maxQuantity, quantity, onQuantityChange, observacoes, onObservacoesChange, onClose, onConfirm, locations, currentUserLocationId }) => {
  const [selectedLocation, setSelectedLocation] = React.useState<string>(currentUserLocationId || '');
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Retorno ao Stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <p className="text-sm text-gray-600 mb-3">Ficha: <strong>{ficha.codigo}</strong> — Produto: <strong>{ficha.produto}</strong></p>
        <p className="text-sm text-gray-500 mb-4">Quantidade entregue: {ficha.quantidade} {ficha.unidade}</p>

        <div className="grid gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Quantidade a retornar</label>
            <input
              type="number"
              min="0.01"
              max={maxQuantity}
              step="0.01"
              value={quantity}
              onChange={(e) => onQuantityChange(parseFloat(e.target.value))}
              className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-gray-500 mt-1">Máximo: {maxQuantity} {ficha.unidade}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Armazém de Destino</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Selecione o armazém...</option>
              {locations.filter((loc: any) => loc.type !== 'CENTRAL').map((loc: any) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => onObservacoesChange(e.target.value)}
              className="w-full border rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]"
              placeholder="Motivo do retorno, condições, etc."
            />
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
            <button onClick={onClose} className="px-4 py-2 border rounded text-gray-600">Cancelar</button>
            <button
              onClick={() => onConfirm(selectedLocation)}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={quantity <= 0 || quantity > maxQuantity || !selectedLocation}
            >
              Confirmar Retorno
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};