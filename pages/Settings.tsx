
import React, { useState } from "react";
import { useLogistics } from '../context/useLogistics';
import { LocationType, ItemType, Role } from "../types";
import { Plus, Trash2, MapPin, Tag, Scale, Box, Lock, CreditCard, DollarSign, Building2, Coins, UserPlus, X } from "lucide-react";

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
    addUser
    , resetLocalData
  } = useLogistics();

  // Local state for inputs
  const [newLocName, setNewLocName] = useState("");
  const [newLocType, setNewLocType] = useState<LocationType>(LocationType.BRANCH);
  const [newCategory, setNewCategory] = useState("");
  const [newUnit, setNewUnit] = useState("");

  // New Item Type State
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeBehavior, setNewTypeBehavior] = useState<ItemType>(ItemType.ASSET);

  // New Settings State
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [editingCompanyInfo, setEditingCompanyInfo] = useState(companyInfo);
  const [showUserModal, setShowUserModal] = useState(false);

  // New User State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>(Role.WORKER);
  const [newUserLocation, setNewUserLocation] = useState("");

  const canManage = hasPermission('MANAGE_SETTINGS');

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLocName.trim() !== "") {
      // Get the central location ID if it exists, otherwise pass null
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
      alert('Por favor preencha todos os campos obrigatórios:\n- Nome completo\n- Email\n- Senha (mínimo 8 caracteres)');
      return;
    }

    if (newUserPassword.length < 8) {
      alert('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    try {
      await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        locationId: newUserLocation || undefined
      });
      setShowUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole(Role.WORKER);
      setNewUserLocation("");
    } catch (error) {
      console.error('Erro ao criar utilizador:', error);
      alert(`Erro ao criar utilizador: ${(error as Error).message}`);
    }
  };

  const handleResetLocal = () => {
    if (!canManage) return;
    if (!window.confirm('Isto irá apagar TODOS os dados locais (localStorage e estados). Continuar?')) return;
    const confirmText = window.prompt('Por favor, digite RESET para confirmar:');
    if (confirmText === 'RESET') {
      try {
        resetLocalData();
        alert('Dados locais reiniciados.');
      } catch (err) {
        console.error('Erro ao reiniciar dados locais:', err);
        alert('Erro ao reiniciar dados locais. Veja o console.');
      }
    } else {
      alert('Confirmação inválida. Operação cancelada.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Definições do Sistema</h2>
          <p className="text-sm text-gray-500">Configuração de parâmetros globais.</p>
        </div>
        {!canManage && (
          <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border border-yellow-200">
            <Lock size={12} /> Modo Visualização
          </div>
        )}
      </div>

      {/* Admin User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <UserPlus className="text-emerald-600" />
                Adicionar Usuário
              </h3>
              <button aria-label="Fechar modal" title="Fechar" onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="userFullName" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  id="userFullName"
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full border p-2 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="userEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full border p-2 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="userPassword" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  id="userPassword"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full border p-2 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  required
                />
              </div>

              <div>
                <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">Função (Role)</label>
                <select
                  id="userRole"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as Role)}
                  className="w-full border p-2 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                >
                  <option value={Role.WORKER}>Trabalhador (Campo)</option>
                  <option value={Role.MANAGER}>Gerente (Filial)</option>
                  <option value={Role.GENERAL_MANAGER}>Diretor Geral</option>
                  <option value={Role.ADMIN}>Administrador</option>
                </select>
              </div>

              <div>
                <label htmlFor="userLocation" className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                <select
                  id="userLocation"
                  value={newUserLocation}
                  onChange={(e) => setNewUserLocation(e.target.value)}
                  className="w-full border p-2 rounded bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  required={newUserRole !== Role.ADMIN && newUserRole !== Role.GENERAL_MANAGER}
                >
                  <option value="">Selecione...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-lg shadow-emerald-200"
                >
                  Criar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Bar */}
      {hasPermission('MANAGE_USERS') && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-end">
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
          >
            <UserPlus size={18} />
            Adicionar Usuário
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Tipos de Item */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit xl:col-span-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Box size={20} className="text-orange-600" />
            Tipos de Item & Comportamento
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Defina tipos (ex: EPI, Ferramenta) e se são bens duráveis (Ativo) ou gastos (Consumível).
          </p>
          {canManage && (
            <form onSubmit={handleAddItemType} className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="Ex: Ferramenta Elétrica"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-500"
                aria-label="Nome do tipo de item"
              />
              <select
                value={newTypeBehavior}
                onChange={(e) => setNewTypeBehavior(e.target.value as ItemType)}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-orange-500"
                aria-label="Comportamento do item"
              >
                <option value={ItemType.ASSET}>Ativo (Durável / Devolução Obrigatória)</option>
                <option value={ItemType.CONSUMABLE}>Consumível (Gasto / Sem Devolução)</option>
              </select>
              <button
                type="submit"
                className="bg-orange-600 text-white py-2 rounded hover:bg-orange-700 text-sm font-medium"
                title="Adicionar novo tipo de item"
              >
                Adicionar Tipo
              </button>
            </form>
          )}
          <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {itemTypes.map((type) => (
              <li key={type.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm text-gray-700">
                <span className="font-medium">{type.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${type.behavior === ItemType.ASSET ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>
                  {type.behavior === ItemType.ASSET ? 'Ativo' : 'Consumível'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Unidades de Medida */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Scale size={20} className="text-purple-600" />
            Unidades de Medida
          </h3>
          {canManage && (
            <form onSubmit={handleAddUnit} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ex: Kg, Litros..."
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="flex-1 border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-purple-500"
                aria-label="Unidade de medida"
              />
              <button
                type="submit"
                className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
                title="Adicionar unidade de medida"
                aria-label="Adicionar unidade"
              >
                <Plus size={20} />
              </button>
            </form>
          )}
          <ul className="space-y-2">
            {measureUnits.map((unit, idx) => (
              <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm text-gray-700">
                <span>{unit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Localizações */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit lg:col-span-1">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <MapPin size={20} className="text-emerald-600" />
            Localizações
          </h3>
          {canManage && (
            <form onSubmit={handleAddLocation} className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                placeholder="Nome da Filial/Local"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
                aria-label="Nome da localização"
              />
              <select
                value={newLocType}
                onChange={(e) => setNewLocType(e.target.value as LocationType)}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-emerald-500"
                aria-label="Tipo de localização"
              >
                <option value={LocationType.BRANCH}>Filial (Branch)</option>
                <option value={LocationType.FIELD}>Equipe de Campo (Field)</option>
              </select>
              <button
                type="submit"
                className="bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700 text-sm font-medium"
                title="Adicionar nova localização"
              >
                Adicionar Local
              </button>
            </form>
          )}
          <ul className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
            {locations.filter(l => l.type !== 'CENTRAL').map((loc) => (
              <li key={loc.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm text-gray-700">
                <div className="flex flex-col">
                  <span className="font-medium">{loc.name}</span>
                  <span className="text-[10px] text-gray-500">{loc.type}</span>
                </div>
                {canManage && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Tem certeza que deseja remover a localização "${loc.name}"?`)) {
                        removeLocation(loc.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remover Localização"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Métodos de Pagamento */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <CreditCard size={20} className="text-blue-600" />
            Métodos de Pagamento
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Configure os métodos de pagamento disponíveis no POS e Faturas.
          </p>
          {canManage && (
            <form onSubmit={handleAddPaymentMethod} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ex: PayPal, Crypto..."
                value={newPaymentMethod}
                onChange={(e) => setNewPaymentMethod(e.target.value)}
                className="flex-1 border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-blue-500"
                aria-label="Método de pagamento"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                title="Adicionar método de pagamento"
                aria-label="Adicionar método"
              >
                <Plus size={20} />
              </button>
            </form>
          )}
          <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {paymentMethods.map((method, idx) => (
              <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm text-gray-700">
                <span>{method}</span>
                {canManage && (
                  <button
                    onClick={() => removePaymentMethod(method)}
                    className="text-red-500 hover:text-red-700"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Categorias de Despesas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Tag size={20} className="text-pink-600" />
            Categorias de Despesas
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Categorias para classificar despesas no POS.
          </p>
          {canManage && (
            <form onSubmit={handleAddExpenseCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ex: Marketing, Transporte..."
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                className="flex-1 border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-pink-500"
                aria-label="Categoria de despesa"
              />
              <button
                type="submit"
                className="bg-pink-600 text-white p-2 rounded hover:bg-pink-700"
                title="Adicionar categoria de despesa"
                aria-label="Adicionar categoria"
              >
                <Plus size={20} />
              </button>
            </form>
          )}
          <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {expenseCategories.map((cat, idx) => (
              <li key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm text-gray-700">
                <span>{cat}</span>
                {canManage && (
                  <button
                    onClick={() => removeExpenseCategory(cat)}
                    className="text-red-500 hover:text-red-700"
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Informações da Empresa */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Building2 size={20} className="text-indigo-600" />
            Informações da Empresa
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Dados usados automaticamente em faturas e documentos.
          </p>
          {canManage ? (
            <form onSubmit={handleUpdateCompanyInfo} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome da Empresa"
                value={editingCompanyInfo.nome}
                onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, nome: e.target.value })}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="NUIT"
                value={editingCompanyInfo.nuit}
                onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, nuit: e.target.value })}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Endereço"
                value={editingCompanyInfo.endereco}
                onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, endereco: e.target.value })}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
              <input
                type="text"
                placeholder="Contacto"
                value={editingCompanyInfo.contacto || ''}
                onChange={(e) => setEditingCompanyInfo({ ...editingCompanyInfo, contacto: e.target.value })}
                className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 text-sm font-medium"
              >
                Salvar Informações
              </button>
            </form>
          ) : (
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Nome:</strong> {companyInfo.nome}</p>
              <p><strong>NUIT:</strong> {companyInfo.nuit}</p>
              <p><strong>Endereço:</strong> {companyInfo.endereco}</p>
              {companyInfo.contacto && <p><strong>Contacto:</strong> {companyInfo.contacto}</p>}
            </div>
          )}
        </div>

        {/* Configurações de Moeda */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
            <Coins size={20} className="text-yellow-600" />
            Moeda Padrão
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Moeda padrão para novos documentos e transações.
          </p>
          {canManage ? (
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-full border p-2 rounded bg-white text-gray-900 text-sm focus:outline-none focus:border-yellow-500"
              aria-label="Moeda Padrão"
            >
              {availableCurrencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          ) : (
            <div className="bg-gray-50 p-3 rounded text-center">
              <span className="text-2xl font-bold text-gray-800">{defaultCurrency}</span>
            </div>
          )}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-gray-600">Moedas Disponíveis:</p>
            <div className="flex gap-2">
              {availableCurrencies.map(curr => (
                <span key={curr} className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium border border-yellow-200">
                  {curr}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-700 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">Ações nesta secção podem apagar dados locais do navegador. Use com cuidado.</p>
          <div className="flex gap-3">
            <button
              onClick={handleResetLocal}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-medium"
              title="Resetar dados locais"
            >
              Resetar Dados Locais
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
