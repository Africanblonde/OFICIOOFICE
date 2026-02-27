
import React, { useState } from "react";
import { useLogistics } from '../context/useLogistics';
import { LocationType, ItemType, Role } from "../types";
import { Plus, Trash2, MapPin, Tag, Scale, Box, Lock, CreditCard, DollarSign, Building2, Coins, UserPlus, X, Settings as SettingsIcon, Users, BarChart3 } from "lucide-react";

type SettingsTab = 'organization' | 'catalog' | 'finance' | 'admin';

// ===== COMPONENTS =====
const TabButton = ({
  id,
  label,
  icon: Icon,
  activeTab,
  setActiveTab
}: {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
  activeTab: SettingsTab;
  setActiveTab: (tab: SettingsTab) => void;
}) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`flex items-center gap-2 px-4 py-3 font-medium transition-all rounded-lg ${activeTab === id
      ? 'bg-emerald-600 text-white shadow-md'
      : 'text-gray-600 hover:bg-gray-100'
      }`}
  >
    {Icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const SettingsCard = ({ icon: Icon, title, description, children, className = '' }: any) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2.5 bg-gray-100 rounded-lg">
        <Icon size={20} className="text-gray-700" />
      </div>
      <div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
    <div className="border-t border-gray-100 pt-4">
      {children}
    </div>
  </div>
);

interface UserModalProps {
  showUserModal: boolean;
  setShowUserModal: (show: boolean) => void;
  handleAddUser: (e: React.FormEvent) => void;
  newUserName: string;
  setNewUserName: (val: string) => void;
  newUserJobTitle: string;
  setNewUserJobTitle: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  newUserRole: Role;
  setNewUserRole: (val: Role) => void;
  newUserLocation: string;
  setNewUserLocation: (val: string) => void;
  locations: any[];
}

const UserModal = ({
  showUserModal,
  setShowUserModal,
  handleAddUser,
  newUserName,
  setNewUserName,
  newUserJobTitle,
  setNewUserJobTitle,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserRole,
  setNewUserRole,
  newUserLocation,
  setNewUserLocation,
  locations
}: UserModalProps) => (
  showUserModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="text-emerald-600" size={24} />
            Novo Usuário
          </h3>
          <button
            aria-label="Fechar modal"
            title="Fechar"
            onClick={() => setShowUserModal(false)}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label htmlFor="userFullName" className="block text-sm font-semibold text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              id="userFullName"
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="João Silva"
              required
            />
          </div>
          <div>
            <label htmlFor="userJobTitle" className="block text-sm font-semibold text-gray-700 mb-2">
              Cargo (opcional)
            </label>
            <input
              id="userJobTitle"
              type="text"
              value={newUserJobTitle}
              onChange={(e) => setNewUserJobTitle(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="Ex: Operador de Máquina, Gerente, etc."
            />
          </div>

          <div>
            <label htmlFor="userEmail" className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="userEmail"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="joao@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="userPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Senha (min. 8 caracteres) *
            </label>
            <input
              id="userPassword"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="userRole" className="block text-sm font-semibold text-gray-700 mb-2">
              Função *
            </label>
            <select
              id="userRole"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as Role)}
              className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            >
              <option value={Role.WORKER}>Trabalhador (Campo)</option>
              <option value={Role.MANAGER}>Gerente (Filial)</option>
              <option value={Role.GENERAL_MANAGER}>Diretor Geral</option>
              <option value={Role.ADMIN}>Administrador</option>
            </select>
          </div>
          <div>
            <label htmlFor="userLocation" className="block text-sm font-semibold text-gray-700 mb-2">
              Localização *
            </label>
            <select
              id="userLocation"
              value={newUserLocation}
              onChange={(e) => setNewUserLocation(e.target.value)}
              className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              required
            >
              <option value="">Selecione a localização</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setShowUserModal(false)}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition shadow-sm"
            >
              Criar Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  )
);

export const Settings = () => {
  const {
    locations,
    addLocation,
    removeLocation,
    categories,
    addCategory,
    measureUnits,
    addMeasureUnit,
    itemTypes,
    addItemType,
    paymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    expenseCategories,
    addExpenseCategory,
    removeExpenseCategory,
    companyInfo,
    updateCompanyInfo,
    availableCurrencies,
    defaultCurrency,
    setDefaultCurrency,
    hasPermission,
    addUser,
    resetLocalData
  } = useLogistics();

  // State Management
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');
  const [showUserModal, setShowUserModal] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [editingCompanyInfo, setEditingCompanyInfo] = useState(companyInfo);

  // Form Inputs
  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState<LocationType>(LocationType.BRANCH);
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeBehavior, setNewTypeBehavior] = useState<ItemType>(ItemType.ASSET);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");

  // New User State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>(Role.WORKER);
  const [newUserLocation, setNewUserLocation] = useState("");
  const [newUserJobTitle, setNewUserJobTitle] = useState("");

  const canManage = hasPermission('MANAGE_SETTINGS');

  // ===== HANDLERS =====
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocName.trim() !== "") {
      const centralLocation = locations.find(l => l.type === LocationType.CENTRAL);
      const parentId = centralLocation ? centralLocation.id : null;
      addLocation(newLocName, newLocType, parentId);
      setNewLocName("");
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim() !== "") {
      addCategory(newCategory);
      setNewCategory("");
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUnit.trim() !== "") {
      addMeasureUnit(newUnit);
      setNewUnit("");
    }
  };

  const handleAddItemType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTypeName.trim() !== "") {
      addItemType(newTypeName, newTypeBehavior);
      setNewTypeName("");
    }
  };

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPaymentMethod.trim() !== "") {
      addPaymentMethod(newPaymentMethod);
      setNewPaymentMethod("");
    }
  };

  const handleAddExpenseCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpenseCategory.trim() !== "") {
      addExpenseCategory(newExpenseCategory);
      setNewExpenseCategory("");
    }
  };

  const handleUpdateCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyInfo(editingCompanyInfo);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName || !newUserEmail || !newUserPassword) {
      setStatus({ type: 'info', message: 'Por favor preencha todos os campos obrigatórios.' });
      return;
    }

    if (newUserPassword.length < 8) {
      setStatus({ type: 'info', message: 'A senha deve ter no mínimo 8 caracteres' });
      return;
    }

    try {
      await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        locationId: newUserLocation || undefined,
        jobTitle: newUserJobTitle || undefined
      });
      setStatus({ type: 'success', message: 'Usuário criado com sucesso!' });
      setTimeout(() => setStatus(null), 3000);
      setShowUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole(Role.WORKER);
      setNewUserLocation("");
      setNewUserJobTitle("");
    } catch (error) {
      setStatus({ type: 'error', message: `Erro ao criar utilizador: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const handleResetLocal = () => {
    if (!canManage) return;
    if (!window.confirm('Isto irá apagar TODOS os dados locais. Continuar?')) return;
    const confirmText = window.prompt('Digite RESET para confirmar:');
    if (confirmText === 'RESET') {
      try {
        setStatus({ type: 'success', message: 'Dados locais reiniciados.' });
        setTimeout(() => setStatus(null), 3000);
      } catch (err) {
        setStatus({ type: 'error', message: `Erro ao reiniciar dados locais: ${err instanceof Error ? err.message : String(err)}` });
      }
    } else {
      setStatus({ type: 'info', message: 'Confirmação cancelada.' });
    }
  };

  // ===== TAB NAVIGATION =====

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Definições</h1>
          <p className="text-gray-500 mt-1">Configure o sistema para sua operação</p>
        </div>
        {!canManage && (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-yellow-200">
            <Lock size={16} /> Modo Visualização
          </div>
        )}
      </div>

      {status && (
        <div className={`p-3 rounded text-sm ${status.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
          status.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
            'bg-blue-50 border border-blue-100 text-blue-800'
          }`}>
          {status.message}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 flex flex-wrap gap-1 md:gap-2">
        <TabButton id="organization" label="Organização" icon={<MapPin size={18} />} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="catalog" label="Catálogo" icon={<BarChart3 size={18} />} activeTab={activeTab} setActiveTab={setActiveTab} />
        <TabButton id="finance" label="Financeiro" icon={<DollarSign size={18} />} activeTab={activeTab} setActiveTab={setActiveTab} />
        {hasPermission('MANAGE_USERS') && <TabButton id="admin" label="Administração" icon={<Users size={18} />} activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>

      <UserModal
        showUserModal={showUserModal}
        setShowUserModal={setShowUserModal}
        handleAddUser={handleAddUser}
        newUserName={newUserName}
        setNewUserName={setNewUserName}
        newUserJobTitle={newUserJobTitle}
        setNewUserJobTitle={setNewUserJobTitle}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        newUserRole={newUserRole}
        setNewUserRole={setNewUserRole}
        newUserLocation={newUserLocation}
        setNewUserLocation={setNewUserLocation}
        locations={locations}
      />

      {/* ===== TAB: ORGANIZATION ===== */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {/* Company Info */}
          <SettingsCard
            icon={Building2}
            title="Informações da Empresa"
            description="Dados exibidos em faturas e documentos"
          >
            {canManage ? (
              <form onSubmit={handleUpdateCompanyInfo} className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome da Empresa"
                  value={editingCompanyInfo.nome}
                  onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, nome: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="NUIT"
                  value={editingCompanyInfo.nuit}
                  onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, nuit: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Endereço"
                  value={editingCompanyInfo.endereco}
                  onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, endereco: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Contacto (Opcional)"
                  value={editingCompanyInfo.contacto || ''}
                  onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, contacto: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition"
                >
                  Guardar Informações
                </button>
              </form>
            ) : (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Nome:</span>
                  <p className="text-gray-600">{companyInfo.nome}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">NUIT:</span>
                  <p className="text-gray-600">{companyInfo.nuit}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Endereço:</span>
                  <p className="text-gray-600">{companyInfo.endereco}</p>
                </div>
                {companyInfo.contacto && (
                  <div>
                    <span className="font-semibold text-gray-700">Contacto:</span>
                    <p className="text-gray-600">{companyInfo.contacto}</p>
                  </div>
                )}
              </div>
            )}
          </SettingsCard>

          {/* Locations */}
          <SettingsCard
            icon={MapPin}
            title="Localizações"
            description="Filiais, sucursais e equipes de campo"
          >
            {canManage && (
              <form onSubmit={handleAddLocation} className="mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Nome da Filial/Local"
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  title="Tipo de localização"
                  aria-label="Tipo de localização"
                  value={newLocType}
                  onChange={(e) => setNewLocType(e.target.value as LocationType)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={LocationType.BRANCH}>Filial (Branch)</option>
                  <option value={LocationType.FIELD}>Equipe de Campo (Field)</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Adicionar Local
                </button>
              </form>
            )}
            <div className="space-y-2">
              {locations.filter(l => l.type !== 'CENTRAL').map((loc) => (
                <div key={loc.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-medium text-gray-800">{loc.name}</p>
                    <p className="text-xs text-gray-500">{loc.type}</p>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Remover "${loc.name}"?`)) {
                          removeLocation(loc.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SettingsCard>
        </div>
      )}

      {/* ===== TAB: CATALOG ===== */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Item Types */}
          <SettingsCard
            icon={Box}
            title="Tipos de Item"
            description="Ativo (durável) ou Consumível"
          >
            {canManage && (
              <form onSubmit={handleAddItemType} className="mb-4 space-y-3">
                <input
                  type="text"
                  placeholder="Ex: Ferramenta Elétrica"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  title="Comportamento do item"
                  aria-label="Comportamento do item"
                  value={newTypeBehavior}
                  onChange={(e) => setNewTypeBehavior(e.target.value as ItemType)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={ItemType.ASSET}>Ativo (Durável)</option>
                  <option value={ItemType.CONSUMABLE}>Consumível</option>
                </select>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> Adicionar Tipo
                </button>
              </form>
            )}
            <div className="space-y-2">
              {itemTypes.map((type) => (
                <div key={type.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-800">{type.name}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${type.behavior === ItemType.ASSET
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                    }`}>
                    {type.behavior === ItemType.ASSET ? 'Ativo' : 'Consumível'}
                  </span>
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* Units of Measure */}
          <SettingsCard
            icon={Scale}
            title="Unidades de Medida"
            description="Ex: Kg, Litros, Unidade"
          >
            {canManage && (
              <form onSubmit={handleAddUnit} className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Kg, Litros"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-700 transition"
                  title="Adicionar"
                >
                  <Plus size={18} />
                </button>
              </form>
            )}
            <div className="space-y-2">
              {measureUnits.map((unit, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg font-medium text-gray-800 border border-gray-200">
                  {unit}
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* Categories */}
          <SettingsCard
            icon={Tag}
            title="Categorias de Itens"
            description="Classificação de produtos"
          >
            {canManage && (
              <form onSubmit={handleAddCategory} className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: EPI, Ferramentas"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-700 transition"
                  title="Adicionar"
                >
                  <Plus size={18} />
                </button>
              </form>
            )}
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg font-medium text-gray-800 border border-gray-200">
                  {cat}
                </div>
              ))}
            </div>
          </SettingsCard>
        </div>
      )}

      {/* ===== TAB: FINANCE ===== */}
      {activeTab === 'finance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Methods */}
          <SettingsCard
            icon={CreditCard}
            title="Métodos de Pagamento"
            description="Cash, Cartão, Mobile Money, etc"
          >
            {canManage && (
              <form onSubmit={handleAddPaymentMethod} className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: PayPal, Crypto"
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-700 transition"
                  title="Adicionar método de pagamento"
                  aria-label="Adicionar método de pagamento"
                >
                  <Plus size={18} />
                </button>
              </form>
            )}
            <div className="space-y-2">
              {paymentMethods.map((method, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-800">{method}</p>
                  {canManage && (
                    <button
                      onClick={() => removePaymentMethod(method)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* Expense Categories */}
          <SettingsCard
            icon={DollarSign}
            title="Categorias de Despesas"
            description="Classificação de gastos"
          >
            {canManage && (
              <form onSubmit={handleAddExpenseCategory} className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Marketing, Transporte"
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-700 transition"
                  title="Adicionar categoria de despesa"
                  aria-label="Adicionar categoria de despesa"
                >
                  <Plus size={18} />
                </button>
              </form>
            )}
            <div className="space-y-2">
              {expenseCategories.map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-800">{cat}</p>
                  {canManage && (
                    <button
                      onClick={() => removeExpenseCategory(cat)}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </SettingsCard>

          {/* Currency */}
          <SettingsCard
            icon={Coins}
            title="Moeda Padrão"
            description="Moeda para novos documentos"
            className="md:col-span-2"
          >title="Moeda padrão do sistema"
            aria-label="Moeda padrão do sistema"

            {canManage ? (
              <div className="space-y-4">
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableCurrencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Moedas Disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {availableCurrencies.map(curr => (
                      <span key={curr} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200">
                        {curr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl font-bold text-emerald-600 mb-2">{defaultCurrency}</p>
                <p className="text-sm text-gray-500">Moeda padrão do sistema</p>
              </div>
            )}
          </SettingsCard>
        </div>
      )}

      {/* ===== TAB: ADMIN ===== */}
      {activeTab === 'admin' && hasPermission('MANAGE_USERS') && (
        <div className="space-y-6">
          {/* Add User Button */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Gestão de Usuários</h3>
                <p className="text-sm text-gray-500">Criar novos usuários no sistema</p>
              </div>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 font-medium transition shadow-sm"
              >
                <UserPlus size={18} />
                Novo Usuário
              </button>
            </div>
          </div>

          {/* Reset Section */}
          <div className="bg-red-50 rounded-xl border border-red-200 p-6 shadow-sm">
            <h3 className="font-bold text-red-700 text-lg mb-2 flex items-center gap-2">
              <SettingsIcon size={20} /> Danger Zone
            </h3>
            <p className="text-sm text-red-600 mb-4">
              Ações nesta secção são irreversíveis. Apagam dados locais do navegador.
            </p>
            <button
              onClick={handleResetLocal}
              className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-medium transition"
            >
              Resetar Dados Locais
            </button>
          </div>

        </div>
      )}

      {/* If not admin, show placeholder for admin tab */}
      {activeTab === 'admin' && !hasPermission('MANAGE_USERS') && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-8 text-center">
          <Lock size={32} className="mx-auto text-yellow-600 mb-2" />
          <p className="text-gray-600 font-medium">Acesso Restrito</p>
          <p className="text-sm text-gray-500">Você não tem permissão para acessar esta secção.</p>
        </div>
      )}
    </div>
  );
};
