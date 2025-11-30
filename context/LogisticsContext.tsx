
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User, Item, Location, InventoryRecord, Requisition, Role, RequestStatus, LocationType, LogEntry,
  DailyPerformance, AttendanceStatus, ItemCondition, ItemType, ItemTypeDefinition, AccountingEntry,
  Transaction, CartItem, TransactionType, PaymentMethod, RolePermissions, AppPermission, PayrollRecord,
  Invoice, InvoiceItem, InvoicePayment, DocumentType, InvoiceStatus, Client, CompanyInfo
} from '../types';
// Removed demo constants imports (USERS, ITEMS, LOCATIONS, etc.)
import { supabase } from '../services/supabaseClient';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants';

interface LogisticsContextType {
  currentUser: User | null;
  allUsers: User[];
  items: Item[];
  locations: Location[];
  inventory: InventoryRecord[];
  requisitions: Requisition[];
  performanceRecords: DailyPerformance[];
  accountingEntries: AccountingEntry[];
  logEntries: LogEntry[];
  transactions: Transaction[];
  invoices: Invoice[];
  clients: Client[]; // New
  selectedDepartmentId: string | null;
  lastUpdated: Date;
  notification: string | null;
  isAdminOrGM: boolean;
  categories: string[];
  measureUnits: string[];
  itemTypes: ItemTypeDefinition[];
  rolePermissions: RolePermissions;

  // New Settings
  paymentMethods: string[];
  expenseCategories: string[];
  companyInfo: CompanyInfo;
  availableCurrencies: string[];
  defaultCurrency: string;

  // Payroll State
  payrollParams: Record<string, { advances: number }>;

  setSelectedDepartmentId: (id: string | null) => void;
  createRequisition: (itemId: string, qty: number, condition: ItemCondition, customTargetLocationId?: string) => void;
  updateRequisitionStatus: (reqId: string, newStatus: RequestStatus) => void;
  getInventoryByLocation: (locationId: string) => InventoryRecord[];
  getItemName: (itemId: string) => string;
  getLocationName: (locationId: string) => string;
  savePerformanceRecord: (record: DailyPerformance) => void;
  getWorkersByManager: (managerId: string) => User[];
  getWorkersByLocation: (locationId: string) => User[];
  refreshData: () => void;
  registerNewItem: (name: string, sku: string, category: string, unit: string, behavior: ItemType, initialQty: number, locationId: string, unitPrice: number) => void;
  addToInventory: (itemId: string, locationId: string, qty: number, unitPrice: number) => void;
  addNewUser: (user: User) => void;
  updateUser: (updatedUser: User) => void;
  addLocation: (name: string, type: LocationType, parentId: string | null) => void;
  addCategory: (category: string) => void;
  addMeasureUnit: (unit: string) => void;
  addItemType: (name: string, behavior: ItemType) => void;

  // New Settings Functions
  addPaymentMethod: (method: string) => void;
  removePaymentMethod: (method: string) => void;
  addExpenseCategory: (category: string) => void;
  removeExpenseCategory: (category: string) => void;
  updateCompanyInfo: (info: CompanyInfo) => void;
  setDefaultCurrency: (currency: string) => void;
  processSale: (cart: CartItem[], clientName: string, clientNuit: string, paymentMethod: PaymentMethod, totalAmount: number) => void;
  registerExpense: (description: string, category: string, amount: number, paymentMethod: PaymentMethod) => void;
  hasPermission: (permission: AppPermission) => boolean;
  togglePermission: (role: Role, permission: AppPermission) => void;

  // Invoice Functions
  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (invoice: Invoice) => Promise<void>;
  deleteInvoice?: (invoiceId: string) => Promise<void>;
  getNextInvoiceNumber: () => string;
  registerPayment: (invoiceId: string, payment: InvoicePayment) => Promise<void>; // New dedicated payment function

  // Client Functions (CRM)
  addClient: (client: Client) => void;
  updateClient: (client: Client) => void;
  getClientBalance: (clientId: string) => number;

  // Payroll Functions
  updatePayrollParams: (userId: string, advances: number) => void;
  calculatePayrollForUser: (user: User) => PayrollRecord;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with first user from Supabase or a default admin
  // setCurrentUser is intentionally kept internal to prevent client-side impersonation.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [notification, setNotification] = useState<string | null>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<DailyPerformance[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // Helper to map transactions returned from DB (snake_case) to app model (camelCase)
  const mapDbTransactionToApp = (txn: any): Transaction => ({
    id: txn.id,
    type: txn.type,
    date: txn.date,
    userId: txn.user_id,
    locationId: txn.location_id,
    clientName: txn.client_name,
    clientNuit: txn.client_nuit,
    description: txn.description,
    category: txn.category,
    amount: txn.amount,
    paymentMethod: txn.payment_method,
    items: txn.items?.map((it: any) => ({ itemId: it.item_id, name: it.name, quantity: it.quantity, unitPrice: it.unit_price })) || [],
    invoiceId: txn.invoice_id || null
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Permissions State
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);

  // Payroll State (Ephemeral for current month calculation)
  const [payrollParams, setPayrollParams] = useState<Record<string, { advances: number }>>({});

  // Settings State - Keep some defaults for initial setup
  const [categories, setCategories] = useState<string[]>(['Equipamento', 'EPI', 'Tecnologia', 'Ferramenta']);
  const [measureUnits, setMeasureUnits] = useState<string[]>(['Unidade', 'Par', 'Litros', 'Kg', 'Metros']);

  // New: Item Types Management (Name -> Behavior)
  const [itemTypes, setItemTypes] = useState<ItemTypeDefinition[]>([
    { id: 'type-1', name: 'Equipamento Pesado', behavior: ItemType.ASSET },
    { id: 'type-2', name: 'Ferramenta Manual', behavior: ItemType.ASSET },
    { id: 'type-3', name: 'EPI', behavior: ItemType.CONSUMABLE },
    { id: 'type-4', name: 'Consumível Operacional', behavior: ItemType.CONSUMABLE },
    { id: 'type-5', name: 'Tecnologia/GPS', behavior: ItemType.ASSET },
  ]);

  // New Settings State
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Dinheiro', 'Cartão', 'M-Pesa', 'e-Mola', 'Transferência Bancária', 'Cheque']);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(['Combustível', 'Manutenção', 'Salários', 'Aluguel', 'Utilidades', 'Outros']);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    nome: 'Sua Empresa Lda',
    nuit: '000000000',
    endereco: 'Maputo, Moçambique',
    contacto: '+258 84 000 0000'
  });
  const [availableCurrencies] = useState<string[]>(['MZN', 'USD']);
  const [defaultCurrency, setDefaultCurrency] = useState<string>('MZN');
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Helper
  const isAdminOrGM = currentUser ? (currentUser.role === Role.ADMIN || currentUser.role === Role.GENERAL_MANAGER) : false;

  // Load current user from Supabase on mount
  // Load current user and all users from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      let actor: User | null = null;
      if (session?.user) {
        // Try to load user from database
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          // Map snake_case from DB to camelCase
          console.log('✅ Dados do usuário carregados do Supabase:', userData);
          const mappedUser: User = {
            id: userData.id,
            name: userData.name,
            role: userData.role,
            locationId: userData.location_id || '',
            jobTitle: userData.job_title,
            defaultDailyGoal: userData.default_daily_goal,
            dailyRate: userData.daily_rate,
            halfDayRate: userData.half_day_rate,
            absencePenalty: userData.absence_penalty,
            bonusPerUnit: userData.bonus_per_unit
          };
          console.log('👤 Usuário mapeado para aplicação:', mappedUser);
          console.log('🔐 Role do usuário:', mappedUser.role);
          actor = mappedUser;
          setCurrentUser(mappedUser);
        } else {
          // Fallback for new users who haven't been saved to DB yet
          const tempUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email || 'User',
            role: Role.WORKER,
            locationId: '',
          };
          actor = tempUser;
          setCurrentUser(tempUser);
        }
      }

      // Fetch all users only when the signed-in actor is an Admin or General Manager.
      // For normal users, expose only their own profile in allUsers so they can't access others' data.
      // Use a local actor variable because setCurrentUser() is async and won't update `currentUser` immediately.
      // actor is set above when we loaded or created the current user

      if (actor && (actor.role === Role.ADMIN || actor.role === Role.GENERAL_MANAGER)) {
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData) {
          // Map snake_case from DB to camelCase for the app
          const mappedUsers = usersData.map(user => ({
            id: user.id,
            name: user.name,
            role: user.role,
            locationId: user.location_id || '',
            jobTitle: user.job_title,
            defaultDailyGoal: user.default_daily_goal,
            dailyRate: user.daily_rate,
            halfDayRate: user.half_day_rate,
            absencePenalty: user.absence_penalty,
            bonusPerUnit: user.bonus_per_unit
          }));
          setAllUsers(mappedUsers);
        }
      } else if (actor) {
        // Only expose the actor's own profile for non-admin users
        setAllUsers([actor]);
      }

      // Fetch locations
      const { data: locationsData } = await supabase.from('locations').select('*');
      if (locationsData) {
        // Map snake_case from DB to camelCase for the app
        const mappedLocations = locationsData.map(loc => ({
          id: loc.id,
          name: loc.name,
          type: loc.type,
          parentId: loc.parent_id
        }));
        setLocations(mappedLocations);
      }

      // Fetch items
      const { data: itemsData } = await supabase.from('items').select('*');
      if (itemsData) {
        setItems(itemsData);
      }

      // Fetch inventory
      const { data: inventoryData } = await supabase.from('inventory').select('*');
      if (inventoryData) {
        // Map snake_case from DB to camelCase for the app
        const mappedInventory = inventoryData.map(inv => ({
          itemId: inv.item_id,
          locationId: inv.location_id,
          quantity: inv.quantity
        }));
        setInventory(mappedInventory);
      }

      // Fetch requisitions with logs
      const { data: requisitionsData } = await supabase
        .from('requisitions')
        .select(`
          *,
          logs:requisition_logs(*)
        `)
        .order('created_at', { ascending: false });

      if (requisitionsData) {
        const mappedRequisitions = requisitionsData.map(req => ({
          id: req.id,
          requesterId: req.requester_id,
          sourceLocationId: req.source_location_id,
          targetLocationId: req.target_location_id,
          itemId: req.item_id,
          quantity: req.quantity,
          status: req.status,
          condition: req.condition,
          createdAt: req.created_at,
          updatedAt: req.updated_at,
          logs: req.logs || []
        }));
        setRequisitions(mappedRequisitions);
      }

      // Fetch daily performance
      const { data: performanceData } = await supabase
        .from('daily_performance')
        .select('*')
        .order('date', { ascending: false });
      if (performanceData) {
        // Map snake_case from DB to camelCase
        const mappedPerformance = performanceData.map(perf => ({
          id: perf.id,
          workerId: perf.worker_id,
          date: perf.date,
          status: perf.status,
          production: perf.production,
          notes: perf.notes
        }));
        setPerformanceRecords(mappedPerformance);
      }

      // Fetch transactions with items
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          items:transaction_items(*)
        `)
        .order('date', { ascending: false });

      if (transactionsData) {
        const mappedTransactions = transactionsData.map(txn => ({
          id: txn.id,
          type: txn.type,
          date: txn.date,
          userId: txn.user_id,
          locationId: txn.location_id,
          clientName: txn.client_name,
          clientNuit: txn.client_nuit,
          description: txn.description,
          category: txn.category,
          amount: txn.amount,
          paymentMethod: txn.payment_method,
          items: txn.items?.map(item => ({
            itemId: item.item_id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unit_price
          })) || []
        }));
        setTransactions(mappedTransactions);
      }

      // Fetch clients
      const { data: clientsData } = await supabase.from('clients').select('*');
      if (clientsData) {
        setClients(clientsData);
      }

      // Fetch invoices with items and payments
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
          *,
          itens:invoice_items(*),
          pagamentos:invoice_payments(*)
        `)
        .order('created_at', { ascending: false });

      if (invoicesData) {
        setInvoices(invoicesData.map(inv => ({
          id: inv.id,
          numero: inv.numero,
          tipo: inv.tipo,
          status: inv.status,
          locationId: inv.location_id,
          empresa: {
            nome: inv.company_name,
            nuit: inv.company_nuit,
            endereco: inv.company_address,
            contacto: inv.company_contact
          },
          cliente: {
            id: inv.client_id,
            nome: inv.client_name,
            nuit: inv.client_nuit,
            endereco: inv.client_address,
            contacto: inv.client_contact
          },
          itens: (inv.itens || []).map((it: any) => ({
            itemId: it.item_id,
            descricao: it.description,
            quantidade: it.quantity,
            precoUnitario: it.unit_price,
            impostoPercent: it.tax_percent
          })),
          pagamentos: (inv.pagamentos || []).map((p: any) => ({ data: p.date, valor: p.amount, modalidade: p.method, referencia: p.reference })),
          moeda: inv.currency,
          dataEmissao: inv.issue_date,
          vencimento: inv.due_date,
          observacoes: inv.notes,
          createdBy: inv.created_by
        })));
      }

      setIsLoadingUser(false);
    };

    loadData();
  }, []);

  // 20 Minutes Interval
  const REFRESH_INTERVAL = 20 * 60 * 1000;

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const hasPermission = (permission: AppPermission): boolean => {
    if (!currentUser) return false;
    const perms = rolePermissions[currentUser.role];
    return perms ? perms.includes(permission) : false;
  };

  const togglePermission = (role: Role, permission: AppPermission) => {
    setRolePermissions(prev => {
      const currentRolePerms = prev[role] || [];
      const hasIt = currentRolePerms.includes(permission);

      let newRolePerms;
      if (hasIt) {
        newRolePerms = currentRolePerms.filter(p => p !== permission);
      } else {
        newRolePerms = [...currentRolePerms, permission];
      }

      return {
        ...prev,
        [role]: newRolePerms
      };
    });
    showNotification("Permissões atualizadas.");
  };

  const refreshData = async () => {
    console.log("Sincronizando dados com o servidor...");

    // Refresh lastUpdated timestamp
    setLastUpdated(new Date());

    try {
      // Re-fetch session and re-load current user's profile from public.users
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Try reading current user's profile from public.users (fresh from DB)
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && userData) {
        console.log('🔄 Refresh: Dados atualizados do Supabase:', userData);
        const mappedUser: User = {
          id: userData.id,
          name: userData.name,
          role: userData.role,
          locationId: userData.location_id || '',
          jobTitle: userData.job_title,
          defaultDailyGoal: userData.default_daily_goal,
          dailyRate: userData.daily_rate,
          halfDayRate: userData.half_day_rate,
          absencePenalty: userData.absence_penalty,
          bonusPerUnit: userData.bonus_per_unit
        };
        console.log('🔄 Role atualizada:', userData.role, '→', mappedUser.role);

        // Update currentUser with fresh data
        setCurrentUser(mappedUser);

        // If user is admin/GM, re-fetch all users; otherwise ensure allUsers contains only self
        if (mappedUser.role === Role.ADMIN || mappedUser.role === Role.GENERAL_MANAGER) {
          const { data: usersData } = await supabase.from('users').select('*');
          if (usersData) {
            const mappedUsers = usersData.map((user: any) => ({
              id: user.id,
              name: user.name,
              role: user.role,
              locationId: user.location_id || '',
              jobTitle: user.job_title,
              defaultDailyGoal: user.default_daily_goal,
              dailyRate: user.daily_rate,
              halfDayRate: user.half_day_rate,
              absencePenalty: user.absence_penalty,
              bonusPerUnit: user.bonus_per_unit
            }));
            setAllUsers(mappedUsers);
          }
        } else {
          // Ensure non-admins do not keep a large allUsers list
          setAllUsers([mappedUser]);
        }
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [items]);

  const getSourceLocation = (targetLocId: string): string => {
    const target = locations.find(l => l.id === targetLocId);
    if (!target?.parentId) {
      // Find the CENTRAL location if no parent
      const centralLoc = locations.find(l => l.type === LocationType.CENTRAL);
      return centralLoc?.id || targetLocId; // Fallback to target if no central found
    }
    return target.parentId;
  };

  const createRequisition = async (itemId: string, quantity: number, condition: ItemCondition, customTargetLocationId?: string) => {
    const targetId = customTargetLocationId || currentUser.locationId;
    const sourceId = getSourceLocation(targetId);

    const { data: reqData, error: reqError } = await supabase.from('requisitions').insert({
      requester_id: currentUser.id,
      source_location_id: sourceId,
      target_location_id: targetId,
      item_id: itemId,
      quantity,
      status: RequestStatus.PENDING,
      condition
    }).select().single();

    if (reqError) {
      showNotification(`Erro ao criar requisição: ${reqError.message}`);
      return;
    }

    // Insert log
    await supabase.from('requisition_logs').insert({
      requisition_id: reqData.id,
      actor_id: currentUser.id,
      action: 'CREATE',
      message: `Solicitação criada. Enviada para aprovação da Administração/Direção.`
    });

    // Reload requisitions
    const { data: requisitionsData } = await supabase
      .from('requisitions')
      .select(`*, logs:requisition_logs(*)`)
      .order('created_at', { ascending: false });

    if (requisitionsData) {
      setRequisitions(requisitionsData.map(req => ({ ...req, logs: req.logs || [] })));
    }

    showNotification("Requisição criada com sucesso!");
  };

  const updateRequisitionStatus = async (reqId: string, newStatus: RequestStatus) => {
    if (!currentUser) return;
    const req = requisitions.find(r => r.id === reqId);
    if (!req) return;

    // --- SECURITY CHECK START ---
    const isSystemAdmin = currentUser.role === Role.ADMIN || currentUser.role === Role.GENERAL_MANAGER;

    const isLocationInScope = (locId: string) => {
      if (!currentUser) return false;
      if (locId === currentUser.locationId) return true;
      const loc = locations.find(l => l.id === locId);
      return loc?.parentId === currentUser.locationId;
    };

    const isLocalManager = currentUser.role === Role.MANAGER &&
      (isLocationInScope(req.sourceLocationId) || isLocationInScope(req.targetLocationId));

    if (!isSystemAdmin && !isLocalManager && currentUser.role !== Role.WORKER) {
      showNotification("ACESSO NEGADO: Você não tem permissão para alterar este setor.");
      return;
    }
    // --- SECURITY CHECK END ---

    // Update requisition status in Supabase
    const { error: reqError } = await supabase.from('requisitions').update({
      status: newStatus
    }).eq('id', reqId);

    if (reqError) {
      showNotification(`Erro ao atualizar requisição: ${reqError.message}`);
      return;
    }

    // Insert log
    await supabase.from('requisition_logs').insert({
      requisition_id: reqId,
      actor_id: currentUser.id,
      action: newStatus,
      message: `Status alterado para ${newStatus} por ${currentUser.name}`
    });

    // Update inventory if needed
    if (newStatus === RequestStatus.APPROVED) {
      await updateInventory(req.itemId, req.sourceLocationId, -req.quantity);
    }

    if (newStatus === RequestStatus.CONFIRMED) {
      await updateInventory(req.itemId, req.targetLocationId, req.quantity);
    }

    // Reload requisitions
    const { data: requisitionsData } = await supabase
      .from('requisitions')
      .select(`*, logs:requisition_logs(*)`)
      .order('created_at', { ascending: false });

    if (requisitionsData) {
      setRequisitions(requisitionsData.map(req => ({ ...req, logs: req.logs || [] })));
    }

    showNotification(`Status da requisição atualizado: ${newStatus}`);
  };

  const updateInventory = async (itemId: string, locationId: string, change: number) => {
    const existingRecord = inventory.find(r => r.itemId === itemId && r.locationId === locationId);

    if (existingRecord) {
      const newQuantity = Math.max(0, existingRecord.quantity + change);

      await supabase.from('inventory').update({
        quantity: newQuantity
      }).match({ item_id: itemId, location_id: locationId });

      setInventory(prev => prev.map(r =>
        (r.itemId === itemId && r.locationId === locationId)
          ? { ...r, quantity: newQuantity }
          : r
      ));
    } else if (change > 0) {
      const { data } = await supabase.from('inventory').insert({
        item_id: itemId,
        location_id: locationId,
        quantity: change
      }).select().single();

      if (data) {
        setInventory(prev => [...prev, data]);
      }
    }
  };

  const addToInventory = (itemId: string, locationId: string, qty: number, unitPrice: number) => {
    if (!currentUser) return;
    if (currentUser.role === Role.MANAGER && locationId !== currentUser.locationId) {
      alert("Você só pode adicionar estoque à sua própria localização.");
      return;
    }

    updateInventory(itemId, locationId, qty);

    const item = items.find(i => i.id === itemId);
    const newEntry: AccountingEntry = {
      id: `acc-${Date.now()}`,
      date: new Date().toISOString(),
      itemId,
      itemName: item?.name || 'Item Desconhecido',
      locationId,
      quantity: qty,
      unitPrice: unitPrice,
      totalValue: qty * unitPrice,
      type: item?.type === ItemType.ASSET ? 'ATIVO' : 'PASSIVO',
      userId: currentUser.id
    };

    setAccountingEntries(prev => [newEntry, ...prev]);
    showNotification(`Estoque adicionado: ${qty}x ${item?.name}`);
  };

  const registerNewItem = async (name: string, sku: string, category: string, unit: string, behavior: ItemType, initialQty: number, locationId: string, unitPrice: number) => {
    const { data, error } = await supabase.from('items').insert({
      name,
      sku,
      category,
      unit,
      type: behavior,
      price: unitPrice
    }).select().single();

    if (error) {
      showNotification(`Erro ao cadastrar item: ${error.message}`);
      return;
    }

    setItems([...items, data]);

    if (initialQty > 0) {
      addToInventory(data.id, locationId, initialQty, unitPrice);
    } else {
      showNotification("Item cadastrado com sucesso.");
    }
  };

  const getInventoryByLocation = (locationId: string) => {
    return inventory.filter(r => r.locationId === locationId);
  };

  const getItemName = (itemId: string) => items.find(i => i.id === itemId)?.name || 'Item desconhecido';
  const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'Local desconhecido';

  const savePerformanceRecord = async (record: DailyPerformance) => {
    const isSystemAdmin = currentUser.role === Role.ADMIN || currentUser.role === Role.GENERAL_MANAGER;

    const existingIndex = performanceRecords.findIndex(r => r.id === record.id || (r.workerId === record.workerId && r.date === record.date));

    if (existingIndex >= 0 && !isSystemAdmin) {
      showNotification("ACESSO NEGADO: Registros submetidos não podem ser alterados por Gerentes. Contate o Administrador.");
      return;
    }

    if (!isSystemAdmin && currentUser.role === Role.MANAGER) {
      const managedWorkers = getWorkersByManager(currentUser.id);
      if (!managedWorkers.find(w => w.id === record.workerId)) {
        showNotification("Erro: Você não gerencia este funcionário.");
        return;
      }
    }

    // Upsert to Supabase
    const { error } = await supabase.from('daily_performance').upsert({
      id: record.id,
      worker_id: record.workerId,
      date: record.date,
      status: record.status,
      production: record.production,
      notes: record.notes
    });

    if (error) {
      showNotification(`Erro ao salvar registro: ${error.message}`);
      return;
    }

    // Reload
    const { data: performanceData } = await supabase.from('daily_performance').select('*').order('date', { ascending: false });
    if (performanceData) {
      setPerformanceRecords(performanceData);
    }

    showNotification("Registro de desempenho salvo.");
  };

  const getWorkersByManager = (managerId: string) => {
    const manager = allUsers.find(u => u.id === managerId);
    if (!manager) return [];
    const managedLocationId = manager.locationId;
    const subLocations = locations.filter(l => l.parentId === managedLocationId).map(l => l.id);
    const relevantLocationIds = [managedLocationId, ...subLocations];
    return allUsers.filter(u => u.role === Role.WORKER && relevantLocationIds.includes(u.locationId));
  };

  const getWorkersByLocation = (locationId: string) => {
    const subLocations = locations.filter(l => l.parentId === locationId).map(l => l.id);
    const relevantLocationIds = [locationId, ...subLocations];
    return allUsers.filter(u => u.role === Role.WORKER && relevantLocationIds.includes(u.locationId));
  };

  const addNewUser = async (user: User, email: string, password: string) => {
    try {
      // Chamar Edge Function para criar usuário
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            email,
            password,
            userData: {
              name: user.name,
              role: user.role,
              locationId: user.locationId,
              jobTitle: user.jobTitle,
              defaultDailyGoal: user.defaultDailyGoal,
              dailyRate: user.dailyRate,
              halfDayRate: user.halfDayRate,
              absencePenalty: user.absencePenalty,
              bonusPerUnit: user.bonusPerUnit
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      // Atualizar estado local com o usuário criado
      const completeUser: User = {
        ...user,
        id: result.userId
      };

      setAllUsers(prev => [...prev, completeUser]);
      showNotification(`✅ Funcionário ${user.name} cadastrado com sucesso!`);
      showNotification(`📧 Login: ${email} | Senha: ${password}`);

    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      showNotification(`❌ Erro ao criar usuário: ${err.message}`);
    }
  };

  const updateUser = (updatedUser: User) => {
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    showNotification("Dados do funcionário atualizados com sucesso.");
  };

  const addLocation = async (name: string, type: LocationType, parentId: string | null) => {
    const { data, error } = await supabase.from('locations').insert({
      name,
      type,
      parent_id: parentId
    }).select().single();

    if (error) {
      showNotification(`Erro ao adicionar localização: ${error.message}`);
      return;
    }

    // Map the returned data from snake_case to camelCase
    const mappedLocation = {
      id: data.id,
      name: data.name,
      type: data.type,
      parentId: data.parent_id
    };

    setLocations([...locations, mappedLocation]);
    showNotification("Nova localização adicionada.");
  };

  const addCategory = (cat: string) => setCategories([...categories, cat]);
  const addMeasureUnit = (unit: string) => setMeasureUnits([...measureUnits, unit]);
  const addItemType = (name: string, behavior: ItemType) => {
    const newType: ItemTypeDefinition = {
      id: `type-${Date.now()}`,
      name,
      behavior
    };
    setItemTypes([...itemTypes, newType]);
    showNotification("Novo tipo de item configurado.");
  }

  // --- NEW SETTINGS FUNCTIONS ---
  const addPaymentMethod = (method: string) => {
    if (!paymentMethods.includes(method)) {
      setPaymentMethods([...paymentMethods, method]);
      showNotification("Método de pagamento adicionado.");
    }
  };

  const removePaymentMethod = (method: string) => {
    // Check if in use
    const inUse = transactions.some(t => t.paymentMethod === method) ||
      invoices.some(i => i.pagamentos.some(p => p.modalidade === method));
    if (inUse) {
      showNotification("Não é possível remover. Método em uso.");
      return;
    }
    setPaymentMethods(paymentMethods.filter(m => m !== method));
    showNotification("Método de pagamento removido.");
  };

  const addExpenseCategory = (category: string) => {
    if (!expenseCategories.includes(category)) {
      setExpenseCategories([...expenseCategories, category]);
      showNotification("Categoria de despesa adicionada.");
    }
  };

  const removeExpenseCategory = (category: string) => {
    const inUse = transactions.some(t => t.category === category);
    if (inUse) {
      showNotification("Não é possível remover. Categoria em uso.");
      return;
    }
    setExpenseCategories(expenseCategories.filter(c => c !== category));
    showNotification("Categoria removida.");
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    showNotification("Informações da empresa atualizadas.");
  };

  // --- CLIENTS (CRM) ---
  const addClient = async (client: Client) => {
    const { data, error } = await supabase.from('clients').insert({
      name: client.name,
      nuit: client.nuit,
      email: client.email,
      contact: client.contact,
      address: client.address,
      notes: client.notes
    }).select().single();

    if (error) {
      showNotification(`Erro ao registrar cliente: ${error.message}`);
      return;
    }

    setClients(prev => [...prev, data]);
    showNotification(`Cliente ${client.name} registrado.`);
  };

  const updateClient = (client: Client) => {
    setClients(prev => prev.map(c => c.id === client.id ? client : c));
    showNotification("Dados do cliente atualizados.");
  };

  const getClientBalance = (clientId: string) => {
    const clientInvoices = invoices.filter(i => i.cliente.id === clientId && i.status !== 'CANCELADA');
    let totalDebt = 0;
    clientInvoices.forEach(inv => {
      const subtotal = inv.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
      const tax = inv.itens.reduce((acc, i) => acc + (i.quantidade * i.precoUnitario * ((i.impostoPercent || 0) / 100)), 0);
      const total = subtotal + tax;
      const paid = inv.pagamentos.reduce((acc, p) => acc + p.valor, 0);
      totalDebt += (total - paid);
    });
    return Math.max(0, totalDebt); // Avoid negative floating point errors
  };

  // --- POS FUNCTIONS ---

  const processSale = async (cart: CartItem[], clientName: string, clientNuit: string, paymentMethod: PaymentMethod, totalAmount: number) => {
    if (!currentUser) {
      showNotification("Usuário não autenticado");
      return;
    }

    // Create transaction
    const transactionData: any = {
      type: TransactionType.SALE,
      user_id: currentUser.id,
      client_name: clientName,
      client_nuit: clientNuit,
      amount: totalAmount,
      payment_method: paymentMethod
    };

    // Only include location_id if it's not null
    if (currentUser.locationId) {
      transactionData.location_id = currentUser.locationId;
    }

    const { data: txnData, error: txnError } = await supabase.from('transactions').insert(transactionData).select().single();

    if (txnError) {
      showNotification(`Erro ao processar venda: ${txnError.message}`);
      return;
    }

    // Insert transaction items
    for (const item of cart) {
      await supabase.from('transaction_items').insert({
        transaction_id: txnData.id,
        item_id: item.itemId,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice
      });

      // Update inventory (only if location exists)
      if (currentUser.locationId) {
        await updateInventory(item.itemId, currentUser.locationId, -item.quantity);
      }
    }

    // Reload transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select(`*, items:transaction_items(*)`)
      .order('date', { ascending: false });

    if (transactionsData) {
      setTransactions(transactionsData.map(mapDbTransactionToApp));
    }

    showNotification("Venda realizada com sucesso!");
  };

  const registerExpense = async (description: string, category: string, amount: number, paymentMethod: PaymentMethod) => {
    if (!currentUser) {
      showNotification("Usuário não autenticado");
      return;
    }

    const expenseData: any = {
      type: TransactionType.EXPENSE,
      user_id: currentUser.id,
      description,
      category,
      amount,
      payment_method: paymentMethod
    };

    // Only include location_id if it's not null
    if (currentUser.locationId) {
      expenseData.location_id = currentUser.locationId;
    }

    const { data, error } = await supabase.from('transactions').insert(expenseData).select().single();

    if (error) {
      showNotification(`Erro ao registrar despesa: ${error.message}`);
      return;
    }

    // Reload transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select(`*, items:transaction_items(*)`)
      .order('date', { ascending: false });

    if (transactionsData) {
      setTransactions(transactionsData.map(mapDbTransactionToApp));
    }

    showNotification("Despesa registrada.");
  };

  // --- INVOICING FUNCTIONS ---

  const getNextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    // Count invoices for this year
    const count = invoices.filter(i => i.numero.startsWith(`${year}/`)).length;
    return `${year}/${String(count + 1).padStart(6, "0")}`;
  };

  const addInvoice = async (invoice: Invoice) => {
    // Persist invoice to DB, then items and payments
    try {
      const invoicePayload: any = {
        id: invoice.id,
        numero: invoice.numero,
        tipo: invoice.tipo,
        status: invoice.status,
        location_id: invoice.locationId,
        company_name: invoice.empresa?.nome || null,
        company_nuit: invoice.empresa?.nuit || null,
        company_address: invoice.empresa?.endereco || null,
        company_contact: invoice.empresa?.contacto || null,
        client_id: invoice.cliente?.id || null,
        client_name: invoice.cliente?.nome || null,
        client_nuit: invoice.cliente?.nuit || null,
        client_address: invoice.cliente?.endereco || null,
        client_contact: invoice.cliente?.contacto || null,
        currency: invoice.moeda,
        issue_date: invoice.dataEmissao,
        due_date: invoice.vencimento || null,
        notes: invoice.observacoes || null,
        created_by: invoice.createdBy
      };

      const { data: invData, error: invError } = await supabase.from('invoices').insert(invoicePayload).select().single();
      if (invError) {
        showNotification(`Erro ao salvar fatura: ${invError.message}`);
        return;
      }

      // Insert items
      if (invoice.itens && invoice.itens.length > 0) {
        const itemsPayload = invoice.itens.map(i => ({
          invoice_id: invData.id,
          item_id: i.itemId || null,
          description: i.descricao,
          quantity: i.quantidade,
          unit_price: i.precoUnitario,
          tax_percent: i.impostoPercent || 0
        }));
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsPayload);
        if (itemsErr) showNotification(`Erro ao salvar itens da fatura: ${itemsErr.message}`);
      }

      // Insert payments
      if (invoice.pagamentos && invoice.pagamentos.length > 0) {
        const paymentsPayload = invoice.pagamentos.map(p => ({
          invoice_id: invData.id,
          date: p.data || new Date().toISOString(),
          amount: p.valor,
          method: p.modalidade,
          reference: p.referencia || null
        }));
        const { error: payErr } = await supabase.from('invoice_payments').insert(paymentsPayload).select();
        if (payErr) showNotification(`Erro ao salvar pagamentos da fatura: ${payErr.message}`);

        // Create transactions for payments so they appear in history/reports
        try {
          for (const p of paymentsPayload) {
            const txn = {
              type: TransactionType.SALE,
              user_id: currentUser?.id || invoice.createdBy || null,
              invoice_id: invData.id,
              client_name: invoice.cliente?.nome || invoice.cliente?.id || null,
              amount: p.amount,
              payment_method: p.method,
              location_id: invoice.locationId || currentUser?.locationId || null
            };
            await supabase.from('transactions').insert(txn);
          }
        } catch (e) {
          console.warn('failed to insert payment transactions for invoice', e);
        }
      }

      // If added as ISSUED or PAID (affect inventory)
      if (invoice.status === 'EMITIDA' || invoice.status === 'PAGA' || invoice.status === 'PAGA_PARCIAL') {
        if (invoice.tipo === 'FATURA' || invoice.tipo === 'FATURA_RECIBO') {
          invoice.itens.forEach(item => {
            if (item.itemId) updateInventory(item.itemId, invoice.locationId, -item.quantidade);
          });
        }
      }

      // Refresh invoices from server
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`*, itens:invoice_items(*), pagamentos:invoice_payments(*)`)
        .order('created_at', { ascending: false });

      if (invoicesData) {
        setInvoices(invoicesData.map(inv => ({
          id: inv.id,
          numero: inv.numero,
          tipo: inv.tipo,
          status: inv.status,
          locationId: inv.location_id,
          empresa: {
            nome: inv.company_name,
            nuit: inv.company_nuit,
            endereco: inv.company_address,
            contacto: inv.company_contact
          },
          cliente: {
            id: inv.client_id,
            nome: inv.client_name,
            nuit: inv.client_nuit,
            endereco: inv.client_address,
            contacto: inv.client_contact
          },
          itens: (inv.itens || []).map((it: any) => ({
            itemId: it.item_id,
            descricao: it.description,
            quantidade: it.quantity,
            precoUnitario: it.unit_price,
            impostoPercent: it.tax_percent
          })),
          pagamentos: (inv.pagamentos || []).map((p: any) => ({ data: p.date, valor: p.amount, modalidade: p.method, referencia: p.reference })),
          moeda: inv.currency,
          dataEmissao: inv.issue_date,
          vencimento: inv.due_date,
          observacoes: inv.notes,
          createdBy: inv.created_by
        })));
      }

      showNotification(`Documento ${invoice.tipo} criado: ${invoice.numero}`);
    } catch (err: any) {
      showNotification(`Erro ao criar fatura: ${err?.message || String(err)}`);
    }
  };

  const updateInvoice = async (updatedInvoice: Invoice) => {
    // Find old invoice to compare status change
    const oldInvoice = invoices.find(i => i.id === updatedInvoice.id);

    // Persist update to DB, then refresh state
    try {
      const invoicePayload: any = {
        numero: updatedInvoice.numero,
        tipo: updatedInvoice.tipo,
        status: updatedInvoice.status,
        location_id: updatedInvoice.locationId,
        company_name: updatedInvoice.empresa?.nome || null,
        company_nuit: updatedInvoice.empresa?.nuit || null,
        company_address: updatedInvoice.empresa?.endereco || null,
        company_contact: updatedInvoice.empresa?.contacto || null,
        client_id: updatedInvoice.cliente?.id || null,
        client_name: updatedInvoice.cliente?.nome || null,
        client_nuit: updatedInvoice.cliente?.nuit || null,
        client_address: updatedInvoice.cliente?.endereco || null,
        client_contact: updatedInvoice.cliente?.contacto || null,
        currency: updatedInvoice.moeda,
        issue_date: updatedInvoice.dataEmissao,
        due_date: updatedInvoice.vencimento || null,
        notes: updatedInvoice.observacoes || null,
        created_by: updatedInvoice.createdBy
      };

      const { error: invErr } = await supabase.from('invoices').update(invoicePayload).eq('id', updatedInvoice.id);
      if (invErr) showNotification(`Erro ao atualizar fatura: ${invErr.message}`);

      // Replace items
      await supabase.from('invoice_items').delete().eq('invoice_id', updatedInvoice.id);
      if (updatedInvoice.itens && updatedInvoice.itens.length > 0) {
        const itemsPayload = updatedInvoice.itens.map(i => ({
          invoice_id: updatedInvoice.id,
          item_id: i.itemId || null,
          description: i.descricao,
          quantity: i.quantidade,
          unit_price: i.precoUnitario,
          tax_percent: i.impostoPercent || 0
        }));
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsPayload);
        if (itemsErr) showNotification(`Erro ao salvar itens da fatura: ${itemsErr.message}`);
      }

      // Replace payments
      await supabase.from('invoice_payments').delete().eq('invoice_id', updatedInvoice.id);
      if (updatedInvoice.pagamentos && updatedInvoice.pagamentos.length > 0) {
        const paymentsPayload = updatedInvoice.pagamentos.map(p => ({
          invoice_id: updatedInvoice.id,
          date: p.data || new Date().toISOString(),
          amount: p.valor,
          method: p.modalidade,
          reference: p.referencia || null
        }));
        const { error: payErr } = await supabase.from('invoice_payments').insert(paymentsPayload);
        if (payErr) showNotification(`Erro ao salvar pagamentos da fatura: ${payErr.message}`);
      }

      // Refresh invoices list
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`*, itens:invoice_items(*), pagamentos:invoice_payments(*)`)
        .order('created_at', { ascending: false });

      if (invoicesData) {
        setInvoices(invoicesData.map(inv => ({
          id: inv.id,
          numero: inv.numero,
          tipo: inv.tipo,
          status: inv.status,
          locationId: inv.location_id,
          empresa: {
            nome: inv.company_name,
            nuit: inv.company_nuit,
            endereco: inv.company_address,
            contacto: inv.company_contact
          },
          cliente: {
            id: inv.client_id,
            nome: inv.client_name,
            nuit: inv.client_nuit,
            endereco: inv.client_address,
            contacto: inv.client_contact
          },
          itens: (inv.itens || []).map((it: any) => ({
            itemId: it.item_id,
            descricao: it.description,
            quantidade: it.quantity,
            precoUnitario: it.unit_price,
            impostoPercent: it.tax_percent
          })),
          pagamentos: (inv.pagamentos || []).map((p: any) => ({ data: p.date, valor: p.amount, modalidade: p.method, referencia: p.reference })),
          moeda: inv.currency,
          dataEmissao: inv.issue_date,
          vencimento: inv.due_date,
          observacoes: inv.notes,
          createdBy: inv.created_by
        })));
      }

      // Stock Logic on Status Change
      if (oldInvoice) {
        const wasDraft = oldInvoice.status === 'RASCUNHO';
        const isNowActive = updatedInvoice.status === 'EMITIDA' || updatedInvoice.status === 'PAGA' || updatedInvoice.status === 'PAGA_PARCIAL';
        const isStockType = updatedInvoice.tipo === 'FATURA' || updatedInvoice.tipo === 'FATURA_RECIBO';

        if (wasDraft && isNowActive && isStockType) {
          updatedInvoice.itens.forEach(item => {
            if (item.itemId) updateInventory(item.itemId, updatedInvoice.locationId, -item.quantidade);
          });
        }
      }

      showNotification(`Documento atualizado: ${updatedInvoice.numero}`);
    } catch (err: any) {
      showNotification(`Erro ao atualizar fatura: ${err?.message || String(err)}`);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      // delete payments and items first
      const { error: payErr } = await supabase.from('invoice_payments').delete().eq('invoice_id', invoiceId);
      if (payErr) showNotification(`Erro ao remover pagamentos da fatura: ${payErr.message}`);

      const { error: itemsErr } = await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
      if (itemsErr) showNotification(`Erro ao remover itens da fatura: ${itemsErr.message}`);

      const { error: invErr } = await supabase.from('invoices').delete().eq('id', invoiceId);
      if (invErr) {
        showNotification(`Erro ao remover fatura: ${invErr.message}`);
        return;
      }

      // Refresh invoices list
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`*, itens:invoice_items(*), pagamentos:invoice_payments(*)`)
        .order('created_at', { ascending: false });

      if (invoicesData) {
        setInvoices(invoicesData.map(inv => ({
          id: inv.id,
          numero: inv.numero,
          tipo: inv.tipo,
          status: inv.status,
          locationId: inv.location_id,
          empresa: {
            nome: inv.company_name,
            nuit: inv.company_nuit,
            endereco: inv.company_address,
            contacto: inv.company_contact
          },
          cliente: {
            id: inv.client_id,
            nome: inv.client_name,
            nuit: inv.client_nuit,
            endereco: inv.client_address,
            contacto: inv.client_contact
          },
          itens: (inv.itens || []).map((it: any) => ({
            itemId: it.item_id,
            descricao: it.description,
            quantidade: it.quantity,
            precoUnitario: it.unit_price,
            impostoPercent: it.tax_percent
          })),
          pagamentos: (inv.pagamentos || []).map((p: any) => ({ data: p.date, valor: p.amount, modalidade: p.method, referencia: p.reference })),
          moeda: inv.currency,
          dataEmissao: inv.issue_date,
          vencimento: inv.due_date,
          observacoes: inv.notes,
          createdBy: inv.created_by
        })));
      }

      showNotification('Fatura removida com sucesso.');
    } catch (err: any) {
      showNotification(`Erro ao remover fatura: ${err?.message || String(err)}`);
    }
  };

  // New centralized payment registration (persist payment + create a transaction so receipts show up in history/reports)
  const registerPayment = async (invoiceId: string, payment: InvoicePayment) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    // 1) Persist invoice payment to DB if invoice exists in DB
    try {
      // Check if invoice exists on the server (it might be local-only)
      const { data: invoiceRecord } = await supabase.from('invoices').select('id').eq('id', invoiceId).single();

      if (invoiceRecord) {
        const { error: payErr } = await supabase.from('invoice_payments').insert({
          invoice_id: invoiceId,
          date: payment.data || new Date().toISOString(),
          amount: payment.valor,
          method: payment.modalidade,
          reference: payment.referencia || null
        });

        if (payErr) {
          showNotification(`Erro ao persistir pagamento: ${payErr.message}`);
        }

        // update invoice status on DB to keep server in sync
        const newPayments = [...invoice.pagamentos, payment];
        const subtotal = invoice.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
        const tax = invoice.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario * ((i.impostoPercent || 0) / 100), 0);
        const total = subtotal + tax;
        const totalPaid = newPayments.reduce((acc, p) => acc + p.valor, 0);
        let newStatus = invoice.status;
        if (totalPaid >= total - 0.1) newStatus = 'PAGA';
        else if (totalPaid > 0) newStatus = 'PAGA_PARCIAL';

        const { error: invUpdateErr } = await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
        if (invUpdateErr) {
          showNotification(`Erro ao atualizar status da fatura: ${invUpdateErr.message}`);
        }
      }
    } catch (err) {
      // Non-blocking — we still want to record the transaction below so receipts appear in history
      console.warn('persisting invoice payment failed', err);
    }

    // 2) Insert a transaction row for the payment (so receipts appear in transactions/history/reports)
    const txnPayload: any = {
      type: TransactionType.SALE,
      user_id: currentUser.id,
      invoice_id: invoiceId,
      description: `Recebimento (${invoice.numero})`,
      amount: payment.valor,
      payment_method: payment.modalidade
    };
    if (currentUser.locationId) txnPayload.location_id = currentUser.locationId;

    // Prefer to include client name / nuit if available on invoice object
    if ((invoice as any).cliente?.nome) txnPayload.client_name = (invoice as any).cliente.nome;
    else if ((invoice as any).client_name) txnPayload.client_name = (invoice as any).client_name;

    if ((invoice as any).cliente?.nuit) txnPayload.client_nuit = (invoice as any).cliente.nuit;
    else if ((invoice as any).client_nuit) txnPayload.client_nuit = (invoice as any).client_nuit;

    try {
      const { data: txRes, error: txErr } = await supabase.from('transactions').insert(txnPayload).select().single();
      if (txErr) {
        showNotification(`Erro ao registrar recebimento: ${txErr.message}`);
      } else {
        // Refresh transactions list from server
        const { data: transactionsData } = await supabase
          .from('transactions')
          .select(`*, items:transaction_items(*)`)
          .order('date', { ascending: false });

        if (transactionsData) {
          setTransactions(transactionsData.map(mapDbTransactionToApp));
        }
      }
    } catch (err) {
      console.warn('failed to insert payment transaction', err);
    }

    // 3) Update local invoice state so UI reflects the new payment immediately
    const newPaymentsLocal = [...invoice.pagamentos, payment];
    const subtotalLocal = invoice.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
    const taxLocal = invoice.itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario * ((i.impostoPercent || 0) / 100), 0);
    const totalLocal = subtotalLocal + taxLocal;
    const totalPaidLocal = newPaymentsLocal.reduce((acc, p) => acc + p.valor, 0);
    let newStatusLocal = invoice.status;
    if (totalPaidLocal >= totalLocal - 0.1) newStatusLocal = 'PAGA';
    else if (totalPaidLocal > 0) newStatusLocal = 'PAGA_PARCIAL';

    const updatedInvoiceLocal = { ...invoice, pagamentos: newPaymentsLocal, status: newStatusLocal };
    // keep local state; updateInvoice already handles inventory side effects if needed
    updateInvoice(updatedInvoiceLocal);
    showNotification(`Pagamento de ${payment.valor} registrado.`);
  };


  // --- PAYROLL FUNCTIONS ---

  const updatePayrollParams = (userId: string, advances: number) => {
    setPayrollParams(prev => ({
      ...prev,
      [userId]: { advances }
    }));
  };

  const calculatePayrollForUser = (user: User): PayrollRecord => {
    const records = performanceRecords.filter(r => r.workerId === user.id);

    const fullDays = records.filter(r => r.status === AttendanceStatus.FULL_DAY).length;
    const halfDays = records.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
    const absences = records.filter(r => r.status === AttendanceStatus.ABSENT).length;

    const usefulDays = fullDays + (halfDays * 0.5);

    const realProduction = records.reduce((acc, curr) => acc + (curr.production || 0), 0);
    const dailyGoal = user.defaultDailyGoal || 0;
    const targetProduction = usefulDays * dailyGoal;

    const efficiency = targetProduction > 0 ? (realProduction / targetProduction) * 100 : 0;

    const rateDay = user.dailyRate || 0;
    const rateHalf = user.halfDayRate || 0;
    const bonusRate = user.bonusPerUnit || 0;
    const absencePenalty = user.absencePenalty || 0;

    const baseSalary = (fullDays * rateDay) + (halfDays * rateHalf);

    const productionSurplus = Math.max(0, realProduction - targetProduction);
    const productionBonus = productionSurplus * bonusRate;

    const params = payrollParams[user.id] || { advances: 0 };
    const absenceDeduction = absences * absencePenalty;
    const totalDeductions = absenceDeduction + params.advances;

    const netSalary = baseSalary + productionBonus - totalDeductions;

    return {
      userId: user.id,
      userName: user.name,
      fullDays,
      halfDays,
      absences,
      targetProduction,
      realProduction,
      efficiency: Math.floor(efficiency),
      baseSalary,
      productionBonus,
      totalDeductions,
      netSalary
    };
  };

  // Add new user (admin only)
  const addUser = async (user: { name: string; email: string; password?: string; role: Role; locationId?: string }) => {
    if (!currentUser) return;
    if (!isAdminOrGM) {
      showNotification('Apenas administradores podem criar usuários.');
      return;
    }

    try {
      if (!user.password) {
        showNotification('Erro: Senha é obrigatória');
        return;
      }

      // Call register_user RPC with correct parameter order: email, password, name, role, location_id
      const { data, error } = await supabase.rpc('register_user', {
        p_email: user.email,
        p_password: user.password,
        p_name: user.name,
        p_role: user.role,
        p_location_id: user.locationId || null
      });

      if (error) {
        console.error('RPC Error:', error);
        showNotification('Erro ao criar usuário: ' + (error.message || error.details || 'Erro desconhecido'));
        return;
      }

      if (data) {
        const response = data as any;
        if (response.success) {
          // Refresh users
          const { data: usersData } = await supabase.from('users').select('*');
          if (usersData) setAllUsers(usersData);
          showNotification(`Usuário ${user.name} criado com sucesso.`);
        } else {
          showNotification('Erro: ' + (response.message || response.error || 'Erro desconhecido'));
        }
      }
    } catch (error) {
      console.error('Exception:', error);
      showNotification('Erro ao criar usuário: ' + (error as Error).message);
    }
  };

  // Show loading screen while user is being loaded
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 animate-pulse">
            <span className="text-3xl">🌲</span>
          </div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <LogisticsContext.Provider value={{
      currentUser, allUsers, items, locations, inventory, requisitions, performanceRecords, accountingEntries, transactions, invoices, clients,
      selectedDepartmentId, lastUpdated, notification, isAdminOrGM,
      categories, measureUnits, itemTypes, rolePermissions,
      paymentMethods, expenseCategories, companyInfo, availableCurrencies, defaultCurrency,
      payrollParams,
      setSelectedDepartmentId, createRequisition, updateRequisitionStatus,
      getInventoryByLocation, getItemName, getLocationName, savePerformanceRecord, getWorkersByManager,
      getWorkersByLocation, refreshData, registerNewItem, addToInventory,
      addNewUser, updateUser, addLocation, addCategory, addMeasureUnit, addItemType,
      addPaymentMethod, removePaymentMethod, addExpenseCategory, removeExpenseCategory, updateCompanyInfo, setDefaultCurrency,
      processSale, registerExpense, hasPermission, togglePermission,
      addInvoice, updateInvoice, deleteInvoice, getNextInvoiceNumber, registerPayment,
      addClient, updateClient, getClientBalance,
      updatePayrollParams, calculatePayrollForUser,
      addUser
    }}>
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};