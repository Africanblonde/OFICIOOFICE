
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User, Item, Location, InventoryRecord, Requisition, Role, RequestStatus, LocationType, LogEntry,
  DailyPerformance, AttendanceStatus, ItemCondition, ItemType, ItemTypeDefinition, AccountingEntry,
  Transaction, CartItem, TransactionType, PaymentMethod, RolePermissions, AppPermission, PayrollRecord,
  Invoice, InvoiceItem, InvoicePayment, DocumentType, InvoiceStatus, Client, CompanyInfo,
  RequisitionSheet, RequisitionSheetItem, FichaIndividual, InitialStock, StockAlarm, AuditLog, FichaTipo, RegistoEstado,
  CostCenter, CostCenterType, PendingInvoiceItem, PendingItemStatus, InvoicePendingLink, CreditNote,
  ClientExtended, ItemExtended, SalesReport, FinancialReport, ProfitabilityReport
} from '../types';
// Removed demo constants imports (USERS, ITEMS, LOCATIONS, etc.)
import { supabase } from '../services/supabaseClient';
import subscribeToPublicTables from '../services/realtimeService';
import createUserWithEdge from '../services/userService';
import { DEFAULT_ROLE_PERMISSIONS } from '../constants';

interface LogisticsContextType {
  currentUser: User | null;
  allUsers: User[];
  items: Item[];
  locations: Location[];
  inventory: InventoryRecord[];
  requisitions: Requisition[];
  requisitionSheets: RequisitionSheet[]; // NEW
  performanceRecords: DailyPerformance[];
  accountingEntries: AccountingEntry[];
  logEntries: LogEntry[];
  transactions: Transaction[];
  invoices: Invoice[];
  clients: Client[]; // New
  fichasIndividuais: FichaIndividual[];
  initialStocks: InitialStock[];
  stockAlarms: StockAlarm[];
  auditLogs: AuditLog[];

  // Novos estados para faturamento expandido
  costCenters: CostCenter[];
  pendingInvoiceItems: PendingInvoiceItem[];
  invoicePendingLinks: InvoicePendingLink[];
  creditNotes: CreditNote[];

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
  createRequisitionSheet: (targetLocationId: string, items: { itemId?: string, itemName: string, quantity: number, unit: string, condition: ItemCondition, notes?: string }[], notes?: string) => Promise<void>;
  updateRequisitionStatus: (reqId: string, newStatus: RequestStatus) => void;
  updateRequisitionSheetStatus: (sheetId: string, newStatus: RequestStatus) => Promise<void>;
  updateRequisitionSheetItemDelivery: (itemId: string, isDelivered: boolean) => Promise<void>;
  getInventoryByLocation: (locationId: string) => InventoryRecord[];
  getItemName: (itemId: string) => string;
  getLocationName: (locationId: string) => string;
  getClientName: (clientId: string) => string;
  savePerformanceRecord: (record: DailyPerformance) => void;
  getWorkersByManager: (managerId: string) => User[];
  getWorkersByLocation: (locationId: string) => User[];
  refreshData: () => void;
  registerNewItem: (name: string, sku: string, category: string, unit: string, behavior: ItemType, initialQty: number, locationId: string, unitPrice: number, isForSale?: boolean) => void;
  addToInventory: (itemId: string, locationId: string, qty: number, unitPrice: number) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  addUser: (user: { name: string; email: string; password?: string; role: Role; locationId?: string; jobTitle?: string; defaultDailyGoal?: number; dailyRate?: number; halfDayRate?: number; absencePenalty?: number; bonusPerUnit?: number; }) => Promise<void>;
  updateUser: (updatedUser: User) => void;
  deleteUser: (userId: string) => Promise<void>;
  addLocation: (name: string, type: LocationType, parentId: string | null) => void;
  removeLocation: (locationId: string) => void;
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

  // Ficha Individual Functions
  createFicha: (ficha: Omit<FichaIndividual, 'id' | 'codigo' | 'created_at' | 'updated_at'>) => Promise<void>;
  confirmFicha: (fichaId: string) => Promise<void>;
  lockFicha: (fichaId: string) => Promise<void>;
  updateFicha: (ficha: FichaIndividual) => Promise<void>;
  deleteFicha: (fichaId: string) => Promise<void>;

  // Cost Center Functions
  addCostCenter: (costCenter: Omit<CostCenter, 'id' | 'createdAt'>) => Promise<void>;
  updateCostCenter: (costCenter: CostCenter) => Promise<void>;
  deleteCostCenter: (costCenterId: string) => Promise<void>;

  // Pending Invoice Items Functions
  createPendingInvoiceItem: (item: Omit<PendingInvoiceItem, 'id' | 'totalValue' | 'invoicedQuantity' | 'remainingQuantity' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePendingInvoiceItem: (item: PendingInvoiceItem) => Promise<void>;
  deletePendingInvoiceItem: (itemId: string) => Promise<void>;
  linkInvoiceToPendingItem: (invoiceItemId: string, pendingItemId: string, quantityUsed: number) => Promise<void>;

  // Credit Notes Functions
  createCreditNote: (creditNote: Omit<CreditNote, 'id' | 'createdAt'>) => Promise<void>;
  updateCreditNote: (creditNote: CreditNote) => Promise<void>;

  // Extended Client Functions
  updateClientExtended: (client: ClientExtended) => Promise<void>;
  getClientCreditStatus: (clientId: string) => { availableCredit: number; isBlocked: boolean };

  // Reports Functions
  generateSalesReport: (startDate: string, endDate: string) => Promise<SalesReport>;
  generateFinancialReport: (startDate: string, endDate: string) => Promise<FinancialReport>;
  generateProfitabilityReport: (startDate: string, endDate: string) => Promise<ProfitabilityReport>;
  createInitialStock: (stock: Omit<InitialStock, 'id' | 'created_at'>) => Promise<void>;
  updateStockAlarm: (alarm: StockAlarm) => Promise<void>;
  getAuditLogsForTable: (table: string, recordId: string) => AuditLog[];
  // Reset local/front-end data (clears localStorage and resets in-memory lists)
  resetLocalData: () => void;
}


export const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

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
  const [requisitionSheets, setRequisitionSheets] = useState<RequisitionSheet[]>([]);
  const [performanceRecords, setPerformanceRecords] = useState<DailyPerformance[]>([]);
  const [accountingEntries, setAccountingEntries] = useState<AccountingEntry[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]); // Added missing state
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

  // Helper: validate UUID format
  const isValidUuid = (id?: string | null) => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

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

  // Ficha Individual State
  const [fichasIndividuais, setFichasIndividuais] = useState<FichaIndividual[]>([]);
  const [initialStocks, setInitialStocks] = useState<InitialStock[]>([]);
  const [stockAlarms, setStockAlarms] = useState<StockAlarm[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Novos estados para faturamento expandido
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [pendingInvoiceItems, setPendingInvoiceItems] = useState<PendingInvoiceItem[]>([]);
  const [invoicePendingLinks, setInvoicePendingLinks] = useState<InvoicePendingLink[]>([]);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

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
        console.log('👤 Sessão encontrada para usuário:', session.user.id, session.user.email);

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
            locationId: userData.location_id || null,
            jobTitle: userData.job_title,
            defaultDailyGoal: userData.default_daily_goal,
            dailyRate: userData.daily_rate,
            halfDayRate: userData.half_day_rate,
            absencePenalty: userData.absence_penalty,
            bonusPerUnit: userData.bonus_per_unit
          };
          console.log('👤 Usuário mapeado para aplicação:', mappedUser);
          console.log('🔐 Role do usuário (BD):', mappedUser.role);
          actor = mappedUser;
          setCurrentUser(mappedUser);
        } else if (error) {
          console.error('❌ Erro ao buscar usuário do BD:', error);
          // Fallback for new users who haven't been saved to DB yet
          const tempUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email || 'User',
            role: Role.WORKER,
            locationId: null,
          };
          console.warn('⚠️ Usando fallback (WORKER) pois usuário não existe no BD ainda');
          actor = tempUser;
          setCurrentUser(tempUser);
        } else {
          console.error('❌ userData vazio mas sem erro (situação estranha)');
          const tempUser: User = {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email || 'User',
            role: Role.WORKER,
            locationId: null,
          };
          actor = tempUser;
          setCurrentUser(tempUser);
        }
      } else {
        console.warn('⚠️ Nenhuma sessão disponível');
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
            locationId: user.location_id || null,
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

      // Fetch Requisition Sheets (New System)
      const { data: sheetsData } = await supabase
        .from('requisition_sheets')
        .select(`
          *,
          items:requisition_sheet_items(*)
        `)
        .order('created_at', { ascending: false });

      if (sheetsData) {
        const mappedSheets: RequisitionSheet[] = sheetsData.map(sheet => ({
          id: sheet.id,
          requisitionNumber: sheet.requisition_number,
          requesterId: sheet.requester_id,
          sourceLocationId: sheet.source_location_id,
          sourceLocationName: sheet.source_location_name,
          targetLocationId: sheet.target_location_id,
          targetLocationName: sheet.target_location_name,
          status: sheet.status,
          notes: sheet.notes,
          createdAt: sheet.created_at,
          updatedAt: sheet.updated_at,
          items: (sheet.items || []).map((it: any) => ({
            id: it.id,
            sheetId: it.sheet_id,
            itemId: it.item_id,
            itemName: it.item_name,
            quantity: it.quantity,
            unit: it.unit,
            condition: it.condition,
            isDelivered: it.is_delivered,
            notes: it.notes
          }))
        }));
        setRequisitionSheets(mappedSheets);
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
          items: txn.items?.map((item: any) => ({
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

  // Force refresh of current user data after initial load to ensure we have latest role
  useEffect(() => {
    if (!isLoadingUser && currentUser) {
      // Wait a moment for data to settle, then refresh
      const timeoutId = setTimeout(() => {
        console.log('🔄 Forçando atualização do perfil do usuário após carregamento inicial...');
        refreshData();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoadingUser]);

  // 20 Minutes Interval
  const REFRESH_INTERVAL = 20 * 60 * 1000;

  // Notification timeout reference to allow clearing/resetting it
  const notificationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = (msg: string, duration: number = 5000) => {
    // Clear any existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    console.log('📢 Notificação:', msg);
    setNotification(msg);

    // Set new timeout
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, duration);
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
    console.log("🔄 Sincronizando dados com o servidor...");

    // Refresh lastUpdated timestamp
    setLastUpdated(new Date());

    try {
      // Re-fetch session and re-load current user's profile from public.users
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.warn('⚠️ Sem sessão de usuário disponível');
        return;
      }

      console.log('📡 Buscando dados frescos para usuário:', session.user.id);

      // Force a fresh fetch by using .single() and not caching
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && userData) {
        console.log('✅ Dados atualizados do Supabase:', userData);
        const mappedUser: User = {
          id: userData.id,
          name: userData.name,
          role: userData.role,
          locationId: userData.location_id || null,
          jobTitle: userData.job_title,
          defaultDailyGoal: userData.default_daily_goal,
          dailyRate: userData.daily_rate,
          halfDayRate: userData.half_day_rate,
          absencePenalty: userData.absence_penalty,
          bonusPerUnit: userData.bonus_per_unit
        };
        console.log('📋 Dados mapeados:', mappedUser);
        console.log('🔐 Role atualizada:', userData.role, '→', mappedUser.role);

        // Check if role changed
        const roleChanged = currentUser && currentUser.role !== mappedUser.role;
        if (roleChanged) {
          console.log('⚠️ ROLE ALTERADA! De', currentUser?.role, 'para', mappedUser.role);
          showNotification(`✨ Seu role foi atualizado para: ${mappedUser.role}`, 6000);
        } else {
          console.log('✓ Role mantém-se:', mappedUser.role);
        }

        // Update currentUser with fresh data
        setCurrentUser(mappedUser);

        // If user is admin/GM, re-fetch all users; otherwise ensure allUsers contains only self
        if (mappedUser.role === Role.ADMIN || mappedUser.role === Role.GENERAL_MANAGER) {
          console.log('👥 Usuário é ADMIN/GM, buscando lista completa de usuários');
          const { data: usersData } = await supabase.from('users').select('*');
          if (usersData) {
            const mappedUsers = usersData.map((user: any) => ({
              id: user.id,
              name: user.name,
              role: user.role,
              locationId: user.location_id || null,
              jobTitle: user.job_title,
              defaultDailyGoal: user.default_daily_goal,
              dailyRate: user.daily_rate,
              halfDayRate: user.half_day_rate,
              absencePenalty: user.absence_penalty,
              bonusPerUnit: user.bonus_per_unit
            }));
            console.log(`📊 ${mappedUsers.length} usuários carregados`);
            setAllUsers(mappedUsers);
          }
        } else {
          // If not admin/GM, only show own user in allUsers
          setAllUsers([mappedUser]);
        }

        // Fetch Requisition Sheets
        const { data: sheetsData } = await supabase
          .from('requisition_sheets')
          .select(`*, items:requisition_sheet_items(*)`)
          .order('created_at', { ascending: false });

        if (sheetsData) {
          const mappedSheets: RequisitionSheet[] = sheetsData.map(sheet => ({
            id: sheet.id,
            requisitionNumber: sheet.requisition_number,
            requesterId: sheet.requester_id,
            sourceLocationId: sheet.source_location_id,
            sourceLocationName: sheet.source_location_name,
            targetLocationId: sheet.target_location_id,
            targetLocationName: sheet.target_location_name,
            status: sheet.status,
            notes: sheet.notes,
            createdAt: sheet.created_at,
            updatedAt: sheet.updated_at,
            items: (sheet.items || []).map((it: any) => ({
              id: it.id,
              sheetId: it.sheet_id,
              itemId: it.item_id,
              itemName: it.item_name,
              quantity: it.quantity,
              unit: it.unit,
              condition: it.condition,
              isDelivered: it.is_delivered,
              notes: it.notes
            }))
          }));
          setRequisitionSheets(mappedSheets);
        }

        // Fetch Fichas Individuais
        const { data: fichasData } = await supabase.from('fichas_individuais').select('*').order('created_at', { ascending: false });
        if (fichasData) {
          setFichasIndividuais(fichasData.map((f: any) => ({
            id: f.id,
            codigo: f.codigo,
            tipo: f.tipo,
            entidade_id: f.entidade_id,
            entidade_tipo: f.entidade_tipo,
            data: f.data,
            produto_id: f.produto_id,
            produto: f.produto_name || f.produto,
            quantidade: f.quantidade,
            unidade: f.unidade,
            stock_antes: f.stock_antes,
            stock_depois: f.stock_depois,
            observacoes: f.observacoes,
            usuario_registou: f.usuario_registou,
            estado: f.estado,
            created_at: f.created_at,
            updated_at: f.updated_at
          })));
        }

        // Fetch Initial Stocks
        const { data: stocksData } = await supabase.from('initial_stock').select('*');
        if (stocksData) setInitialStocks(stocksData);

        // Fetch Stock Alarms
        const { data: alarmsData } = await supabase.from('stock_alarms').select('*');
        if (alarmsData) setStockAlarms(alarmsData);

        // Fetch Audit Logs (only for admin)
        if (mappedUser.role === Role.ADMIN) {
          const { data: logsData } = await supabase.from('audit_log').select('*').order('timestamp', { ascending: false });
          if (logsData) setAuditLogs(logsData);
        }

      } else if (error) {
        // Handle 406 and other specific errors
        if ((error as any).code === '406' || (error as any).status === 406) {
          console.error('❌ Erro 406 (Not Acceptable): Verifique se a query está correta. Error:', error.message);
          // Don't show notification here to avoid blocking the app
        } else {
          console.error('❌ Erro ao buscar dados do usuário:', error);
        }
      }
    } catch (err: any) {
      // Log the full error without blocking the app
      console.error('❌ Error refreshing profile:', {
        message: err?.message,
        status: err?.status,
        details: err
      });
      // Don't rethrow - allow app to continue running
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [items]);

  // Real-time subscriptions: keep UI in sync when other users make changes.
  useEffect(() => {
    // Skip if loading user or not initialized
    if (isLoadingUser || !currentUser) {
      return;
    }

    const unsubscribe = subscribeToPublicTables(supabase, async (payload: any) => {
      // payload shape may vary between supabase versions; handle common properties
      const table = payload.table || payload.table_name || payload?.schema?.table;
      const eventType = payload.eventType || payload.event || payload.type || payload?.change?.event;
      const record = payload.record || payload.new || payload.new_record || payload?.change?.new || payload?.after || payload.data;

      // Debug
      console.log('🔔 Realtime event', { table, eventType, record });

      try {
        if (table === 'inventory') {
          const { data: inventoryData } = await supabase.from('inventory').select('*');
          if (inventoryData) {
            const mappedInventory = inventoryData.map((inv: any) => ({ itemId: inv.item_id, locationId: inv.location_id, quantity: inv.quantity }));
            setInventory(mappedInventory);
          }
          return;
        }

        if (table === 'requisitions') {
          const { data: requisitionsData } = await supabase
            .from('requisitions')
            .select(`*, logs:requisition_logs(*)`)
            .order('created_at', { ascending: false });
          if (requisitionsData) setRequisitions(requisitionsData.map((req: any) => ({ ...req, logs: req.logs || [] })));
          return;
        }

        if (table === 'requisition_sheets' || table === 'requisition_sheet_items') {
          // Re-fetch sheets
          const { data: sheetsData } = await supabase
            .from('requisition_sheets')
            .select(`*, items:requisition_sheet_items(*)`)
            .order('created_at', { ascending: false });

          if (sheetsData) {
            const mappedSheets: RequisitionSheet[] = sheetsData.map(sheet => ({
              id: sheet.id,
              requisitionNumber: sheet.requisition_number,
              requesterId: sheet.requester_id,
              sourceLocationId: sheet.source_location_id,
              sourceLocationName: sheet.source_location_name,
              targetLocationId: sheet.target_location_id,
              targetLocationName: sheet.target_location_name,
              status: sheet.status,
              notes: sheet.notes,
              createdAt: sheet.created_at,
              updatedAt: sheet.updated_at,
              items: (sheet.items || []).map((it: any) => ({
                id: it.id,
                sheetId: it.sheet_id,
                itemId: it.item_id,
                itemName: it.item_name,
                quantity: it.quantity,
                unit: it.unit,
                condition: it.condition,
                isDelivered: it.is_delivered,
                notes: it.notes
              }))
            }));
            setRequisitionSheets(mappedSheets);
          }
          return;
        }

        if (table === 'fichas_individuais') {
          const { data: fichasData } = await supabase.from('fichas_individuais').select('*').order('created_at', { ascending: false });
          if (fichasData) {
            setFichasIndividuais(fichasData.map((f: any) => ({
              id: f.id,
              codigo: f.codigo,
              tipo: f.tipo,
              entidade_id: f.entidade_id,
              entidade_tipo: f.entidade_tipo,
              data: f.data,
              produto_id: f.produto_id,
              produto: f.produto_name || f.produto,
              quantidade: f.quantidade,
              unidade: f.unidade,
              stock_antes: f.stock_antes,
              stock_depois: f.stock_depois,
              observacoes: f.observacoes,
              usuario_registou: f.usuario_registou,
              estado: f.estado,
              created_at: f.created_at,
              updated_at: f.updated_at
            })));
          }
          return;
        }

        if (table === 'transactions') {
          const { data: transactionsData } = await supabase
            .from('transactions')
            .select(`*, items:transaction_items(*)`)
            .order('date', { ascending: false });
          if (transactionsData) setTransactions(transactionsData.map(mapDbTransactionToApp));
          return;
        }

        if (table === 'invoices') {
          const { data: invoicesData } = await supabase
            .from('invoices')
            .select(`*, itens:invoice_items(*), pagamentos:invoice_payments(*)`)
            .order('created_at', { ascending: false });
          if (invoicesData) setInvoices(invoicesData.map((inv: any) => ({
            id: inv.id,
            numero: inv.numero,
            tipo: inv.tipo,
            status: inv.status,
            locationId: inv.location_id,
            empresa: { nome: inv.company_name, nuit: inv.company_nuit, endereco: inv.company_address, contacto: inv.company_contact },
            cliente: { id: inv.client_id, nome: inv.client_name, nuit: inv.client_nuit, endereco: inv.client_address, contacto: inv.client_contact },
            itens: (inv.itens || []).map((it: any) => ({ itemId: it.item_id, descricao: it.description, quantidade: it.quantity, precoUnitario: it.unit_price, impostoPercent: it.tax_percent })),
            pagamentos: (inv.pagamentos || []).map((p: any) => ({ data: p.date, valor: p.amount, modalidade: p.method, referencia: p.reference })),
            moeda: inv.currency,
            dataEmissao: inv.issue_date,
            vencimento: inv.due_date,
            observacoes: inv.notes,
            createdBy: inv.created_by
          })));
          return;
        }

        if (table === 'items') {
          const { data: itemsData } = await supabase.from('items').select('*');
          if (itemsData) setItems(itemsData);
          return;
        }

        if (table === 'users') {
          // If actor is admin, refresh all users; otherwise refresh current user only
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          const actorId = session.user.id;
          const { data: userData } = await supabase.from('users').select('*').eq('id', actorId).single();
          if (userData) {
            const mappedUser: User = {
              id: userData.id,
              name: userData.name,
              role: userData.role,
              locationId: userData.location_id || null,
              jobTitle: userData.job_title,
              defaultDailyGoal: userData.default_daily_goal,
              dailyRate: userData.daily_rate,
              halfDayRate: userData.half_day_rate,
              absencePenalty: userData.absence_penalty,
              bonusPerUnit: userData.bonus_per_unit
            };
            setCurrentUser(mappedUser);

            if (mappedUser.role === Role.ADMIN || mappedUser.role === Role.GENERAL_MANAGER) {
              const { data: usersData } = await supabase.from('users').select('*');
              if (usersData) setAllUsers(usersData.map((u: any) => ({ id: u.id, name: u.name, role: u.role, locationId: u.location_id || null, jobTitle: u.job_title, defaultDailyGoal: u.default_daily_goal, dailyRate: u.daily_rate, halfDayRate: u.half_day_rate, absencePenalty: u.absence_penalty, bonusPerUnit: u.bonus_per_unit })));
            }
          }
          return;
        }
      } catch (err) {
        console.error('Erro ao processar evento realtime:', err);
      }
    });

    return () => {
      unsubscribe().catch(() => null);
    };
  }, [isLoadingUser, currentUser]);

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
    if (!currentUser) return; // Guard
    const targetId = customTargetLocationId || currentUser.locationId;
    if (!targetId) {
      showNotification("Erro: Localização de destino não definida.");
      return;
    }
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

  const createRequisitionSheet = async (targetLocationId: string, itemsList: { itemId?: string, itemName: string, quantity: number, unit: string, condition: ItemCondition, notes?: string }[], notes?: string) => {
    if (!currentUser) return;

    const sourceId = getSourceLocation(targetLocationId);

    // Generate simplified ID (Mock) - Trigger handles this ideally or we generate UUID
    // In real app, DB trigger handles REQ-YYYY/NNN

    // 1. Create Sheet
    const { data: sheetData, error: sheetError } = await supabase
      .from('requisition_sheets')
      .insert({
        requester_id: currentUser.id,
        source_location_id: sourceId,
        source_location_name: getLocationName(sourceId),
        target_location_id: targetLocationId,
        target_location_name: getLocationName(targetLocationId),
        status: RequestStatus.PENDING,
        notes,
        requisition_number: `REQ-${new Date().getFullYear()}/${Math.floor(Math.random() * 10000)}` // Temp number until DB trigger
      })
      .select()
      .single();

    if (sheetError) {
      showNotification(`Erro ao criar requisição: ${sheetError.message}`);
      return;
    }

    // 2. Create Items
    const itemsToInsert = itemsList.map(it => ({
      sheet_id: sheetData.id,
      item_id: it.itemId || null,
      item_name: it.itemName,
      quantity: it.quantity,
      unit: it.unit,
      condition: it.condition || ItemCondition.NEW,
      notes: it.notes
    }));

    const { error: itemsError } = await supabase
      .from('requisition_sheet_items')
      .insert(itemsToInsert);

    if (itemsError) {
      showNotification(`Erro ao adicionar itens: ${itemsError.message}`);
      // Ideally rollback sheet here
    } else {
      showNotification("Requisição criada com sucesso!");
      refreshData();
    }
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

  const addToInventory = async (itemId: string, locationId: string, qty: number, unitPrice: number) => {
    if (!currentUser) return;
    // Validate locationId is provided and well-formed UUID
    if (!locationId || !isValidUuid(locationId)) {
      showNotification('Erro: Localização inválida. Selecione uma localização válida antes de adicionar estoque.');
      return;
    }

    if (currentUser.role === Role.MANAGER && locationId !== currentUser.locationId) {
      alert("Você só pode adicionar estoque à sua própria localização.");
      return;
    }

    // Update local inventory immediately for better UX
    setInventory(prev => {
        const existingIdx = prev.findIndex(r => r.itemId === itemId && r.locationId === locationId);
        if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = { ...updated[existingIdx], quantity: updated[existingIdx].quantity + qty };
            return updated;
        }
        // If it doesn't exist, we rely on the DB update which will trigger a refresh or we add a temp record
        return [...prev, { id: `temp-${Date.now()}`, itemId, locationId, quantity: qty }];
    });

    await updateInventory(itemId, locationId, qty);

    const item = items.find(i => i.id === itemId);

    // 1. Record Accounting Entry (Asset/Liability)
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

    // 2. NEW: Record Financial Expense (Purchase)
    try {
      const description = `Compra de estoque: ${qty}x ${item?.name || 'Item Desconhecido'}`;
      await supabase.from('transactions').insert({
        type: TransactionType.EXPENSE,
        user_id: currentUser.id,
        location_id: locationId,
        description: description,
        category: 'Compra de Estoque',
        amount: qty * unitPrice,
        payment_method: PaymentMethod.CASH, // Default to cash for direct stock additions
        date: new Date().toISOString()
      });
      // Refresh transactions to reflect new expense
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`*, items:transaction_items(*)`)
        .order('date', { ascending: false });
      if (transactionsData) setTransactions(transactionsData.map(mapDbTransactionToApp));
    } catch (txnError) {
      console.error('Erro ao registrar despesa de estoque:', txnError);
    }

    showNotification(`Estoque adicionado: ${qty}x ${item?.name}`);
  };

  const updateItem = async (itemId: string, updates: Partial<Item>) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      showNotification("❌ ACESSO NEGADO: Apenas administradores podem editar itens.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('items')
        .update({
          name: updates.name,
          sku: updates.sku,
          category: updates.category,
          unit: updates.unit,
          type: updates.type,
          price: updates.price,
          is_for_sale: updates.is_for_sale
        })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === itemId ? data : i));
      showNotification(`✅ Item "${updates.name || 'item'}" atualizado com sucesso.`);
    } catch (error: any) {
      showNotification(`❌ Erro ao atualizar item: ${error.message}`);
    }
  };

  const registerNewItem = async (name: string, sku: string, category: string, unit: string, behavior: ItemType, initialQty: number, locationId: string, unitPrice: number, isForSale: boolean = true) => {
    const { data, error } = await supabase.from('items').insert({
      name,
      sku,
      category,
      unit,
      type: behavior,
      price: unitPrice,
      is_for_sale: isForSale
    }).select().single();

    if (error) {
      showNotification(`Erro ao cadastrar item: ${error.message}`);
      return;
    }

    const newItem = data as Item;
    setItems(prev => [...prev, newItem]);

    if (initialQty > 0) {
      await addToInventory(newItem.id, locationId, initialQty, unitPrice);
    } else {
      showNotification("Item cadastrado com sucesso.");
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      showNotification("❌ ACESSO NEGADO: Apenas administradores podem apagar itens.");
      return;
    }

    // Attempt to delete from Supabase
    // Note: DB constraints should be set to CASCADE for inventory and SET NULL for history
    const { error } = await supabase.from('items').delete().eq('id', itemId);

    if (error) {
      // RLS rejection
      if ((error as any).status === 403 || /policy/i.test(error.message || '')) {
        console.warn('RLS rejection on deleteItem', { userId: currentUser.id, itemId, error });
        showNotification('❌ RLS policy rejected deletion (unauthorized).');
        return;
      }

      // Foreign key / conflict (has inventory or other constraints)
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('foreign key') || msg.includes('violates') || msg.includes('conflict') || msg.includes('cannot delete')) {
        showNotification('❌ Item tem registos associados (estoque ou dependências). Remova-os antes de apagar.');
        return;
      }

      // Generic fallback
      showNotification(`❌ Erro ao apagar item: ${error.message}`);
      return;
    }

    // Update local state
    setItems(prev => prev.filter(i => i.id !== itemId));
    showNotification(`✅ Item apagado com sucesso.`);
  };



  const updateRequisitionSheetStatus = async (sheetId: string, newStatus: RequestStatus) => {
    if (!currentUser) return;

    const sheet = requisitionSheets.find(s => s.id === sheetId);
    if (!sheet) {
        showNotification(`Erro: Ficha de requisição ${sheetId} não encontrada.`);
        return;
    }

    const { error } = await supabase
      .from('requisition_sheets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', sheetId);

    if (error) {
      showNotification(`Erro ao atualizar status: ${error.message}`);
      return;
    }

    // Update inventory if needed
    if (newStatus === RequestStatus.APPROVED) {
        for (const item of sheet.items) {
            if (item.itemId) { // Only for existing items with an ID
                await updateInventory(item.itemId, sheet.sourceLocationId, -item.quantity);
            }
        }
    }

    if (newStatus === RequestStatus.CONFIRMED) {
        for (const item of sheet.items) {
            if (item.itemId) { // Only for existing items with an ID
                await updateInventory(item.itemId, sheet.targetLocationId, item.quantity);
            }
        }
    }

    // Local state update (optimistic or wait for reload)
    setRequisitionSheets(prev => prev.map(s => s.id === sheetId ? { ...s, status: newStatus } : s));
    showNotification(`Status da requisição atualizado para ${newStatus}.`);
  };

  const updateRequisitionSheetItemDelivery = async (itemId: string, isDelivered: boolean) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('requisition_sheet_items')
      .update({ is_delivered: isDelivered })
      .eq('id', itemId);

    if (error) {
      showNotification(`Erro ao atualizar entrega do item: ${error.message}`);
      return;
    }

    // Local state update
    setRequisitionSheets(prev => prev.map(sheet => ({
      ...sheet,
      items: sheet.items.map(it => it.id === itemId ? { ...it, isDelivered: isDelivered } : it)
    })));
  };

  const getInventoryByLocation = (locationId: string) => {
    return inventory.filter(r => r.locationId === locationId);
  };

  const getItemName = (itemId: string) => items.find(i => i.id === itemId)?.name || 'Item desconhecido';
  const getLocationName = (locationId: string) => locations.find(l => l.id === locationId)?.name || 'Local desconhecido';
  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Cliente desconhecido';

  const savePerformanceRecord = async (record: DailyPerformance) => {
    if (!currentUser) return;
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
    return allUsers.filter(u => u.role === Role.WORKER && u.locationId && relevantLocationIds.includes(u.locationId));
  };

  const getWorkersByLocation = (locationId: string) => {
    const subLocations = locations.filter(l => l.parentId === locationId).map(l => l.id);
    const relevantLocationIds = [locationId, ...subLocations];
    return allUsers.filter(u => u.role === Role.WORKER && u.locationId && relevantLocationIds.includes(u.locationId));
  };



  const updateUser = async (updatedUser: User) => {
    try {
      // 1. Update in Supabase
      const { error } = await supabase.from('users').update({
        name: updatedUser.name,
        role: updatedUser.role,
        location_id: updatedUser.locationId,
        job_title: updatedUser.jobTitle,
        default_daily_goal: updatedUser.defaultDailyGoal,
        daily_rate: updatedUser.dailyRate,
        half_day_rate: updatedUser.halfDayRate,
        absence_penalty: updatedUser.absencePenalty,
        bonus_per_unit: updatedUser.bonusPerUnit
      }).eq('id', updatedUser.id);

      if (error) {
        throw error;
      }

      // 2. Update local state
      setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

      // Also update currentUser if it's the same person
      if (currentUser && currentUser.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }

      showNotification("Dados do funcionário atualizados com sucesso.");
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      showNotification(`Erro ao atualizar: ${err.message}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      showNotification("❌ ACESSO NEGADO: Apenas administradores podem apagar funcionários.");
      return;
    }

    // Prevent deleting the current user (admin)
    if (userId === currentUser.id) {
      showNotification("❌ Não é possível apagar sua própria conta.");
      return;
    }

    // Delete from public.users table
    const { error: userError } = await supabase.from('users').delete().eq('id', userId);

    if (userError) {
      // RLS rejection
      if ((userError as any).status === 403 || /policy/i.test(userError.message || '')) {
        console.warn('RLS rejection on deleteUser', { actorId: currentUser.id, targetUserId: userId, error: userError });
        showNotification('❌ RLS policy rejected deletion (unauthorized).');
        return;
      }

      const msg = (userError.message || '').toLowerCase();
      // Not found
      if ((userError as any).status === 404 || msg.includes('not found') || msg.includes('no rows')) {
        showNotification('❌ Usuário não encontrado.');
        return;
      }

      // FK / constraint problems when deleting user
      if (msg.includes('foreign key') || msg.includes('violates') || msg.includes('conflict')) {
        showNotification('❌ Erro de integridade: o usuário tem registos dependentes. Remova dependências antes de apagar.');
        return;
      }

      // Generic fallback
      showNotification(`❌ Erro ao apagar funcionário: ${userError.message}`);
      return;
    }

    // Delete from auth.users (this should cascade if properly configured)
    // Note: Supabase admin API might be needed for this, but we can try
    // For now, the public.users deletion is sufficient

    // Update local state
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    showNotification(`✅ Funcionário apagado com sucesso.`);
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

  const removeLocation = async (locationId: string) => {
    // Check if any users are assigned to this location
    const isLocationInUse = allUsers.some(user => user.locationId === locationId);
    if (isLocationInUse) {
      showNotification("Não é possível remover. Existem usuários alocados para esta localização.");
      return;
    }

    const { error } = await supabase.from('locations').delete().match({ id: locationId });

    if (error) {
      showNotification(`Erro ao remover localização: ${error.message}`);
      return;
    }

    setLocations(prev => prev.filter(loc => loc.id !== locationId));
    showNotification("Localização removida com sucesso.");
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
    // Validate currentUser id
    if (!isValidUuid(currentUser.id)) {
      showNotification('Erro: ID do usuário inválido. Contate o administrador.');
      return;
    }

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
      if (!isValidUuid(currentUser.locationId)) {
        showNotification('Erro: Localização do usuário inválida. Contate o administrador.');
        return;
      }
      transactionData.location_id = currentUser.locationId;
    }

    const { data: txnData, error: txnError } = await supabase.from('transactions').insert(transactionData).select().single();

    if (txnError) {
      const msg = txnError.message || '';
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('violates foreign key')) {
        showNotification('Erro de integridade referencial ao processar venda. Verifique cliente, localização ou produtos.');
      } else {
        showNotification(`Erro ao processar venda: ${msg}`);
      }
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

    if (!isValidUuid(currentUser.id)) {
      showNotification('Erro: ID do usuário inválido. Contate o administrador.');
      return;
    }

    // Only include location_id if it's not null
    if (currentUser.locationId) {
      if (!isValidUuid(currentUser.locationId)) {
        showNotification('Erro: Localização do usuário inválida. Contate o administrador.');
        return;
      }
      expenseData.location_id = currentUser.locationId;
    }

    const { data, error } = await supabase.from('transactions').insert(expenseData).select().single();

    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('violates foreign key')) {
        showNotification('Erro de integridade referencial ao registrar despesa. Verifique cliente/locais.');
      } else {
        showNotification(`Erro ao registrar despesa: ${msg}`);
      }
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
      // Validate invoice.numero uniqueness before attempting insert
      if (!invoice.numero || invoice.numero.trim() === '') {
        showNotification('Número da fatura inválido.');
        return;
      }
      const { data: existingInv } = await supabase.from('invoices').select('id').eq('numero', invoice.numero).limit(1);
      if (existingInv && (existingInv as any).length > 0) {
        showNotification(`Número de fatura já existe: ${invoice.numero}`);
        return;
      }

      // Validate foreign-key style fields
      if (invoice.locationId && !isValidUuid(invoice.locationId)) {
        showNotification('Localização da fatura inválida. Remova ou selecione uma localização válida.');
        return;
      }
      if (invoice.cliente && invoice.cliente.id && !isValidUuid(invoice.cliente.id)) {
        showNotification('Cliente selecionado inválido. Verifique o cliente.');
        return;
      }

      // Task 1.3: Validate client and credit limit
      if (invoice.cliente.id) {
        const clientRecord = clients.find(c => c.id === invoice.cliente.id);
        if (clientRecord) {
          // Check if client is blocked
          if (clientRecord && (clientRecord as any).is_blocked) {
            const blockReason = (clientRecord as any).block_reason || 'Não especificado';
            showNotification(`Cliente bloqueado: ${blockReason}`);
            return;
          }

          // Check credit limit
          const invoiceTotal = invoice.itens.reduce((sum, item) => {
            return sum + (item.quantidade * item.precoUnitario * (1 + (item.impostoPercent || 0) / 100));
          }, 0);

          const creditLimit = (clientRecord as any).credit_limit || 0;
          const creditUsed = (clientRecord as any).credit_used || 0;
          const availableCredit = creditLimit - creditUsed;

          if (invoiceTotal > availableCredit && availableCredit >= 0) {
            showNotification(
              `Crédito insuficiente. Limite: ${creditLimit.toFixed(2)} MZN | ` +
              `Utilizado: ${creditUsed.toFixed(2)} MZN | ` +
              `Disponível: ${availableCredit.toFixed(2)} MZN`
            );
            return;
          }
        }
      }

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
        created_by: invoice.createdBy,
        is_editable: invoice.status === 'RASCUNHO'
      };

      const { data: invData, error: invError } = await supabase.from('invoices').insert(invoicePayload).select().single();
      if (invError) {
        // Friendly messages for FK violations
        const msg = invError.message || '';
        if (msg.toLowerCase().includes('foreign key') || msg.toLowerCase().includes('violates foreign key')) {
          showNotification('Erro de integridade referencial: verifique cliente, localização ou produtos relacionados.');
        } else if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
          showNotification('Número de fatura duplicado. Use outro número.');
        } else {
          showNotification(`Erro ao salvar fatura: ${msg}`);
        }
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
          tax_percent: i.impostoPercent || 16  // Task 1.1: Default VAT to 16%
        }));
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsPayload);
        if (itemsErr) showNotification(`Erro ao salvar itens da fatura: ${itemsErr.message}`);
      }

      // Task 1.6: Create invoice audit log entry
      try {
        await supabase.from('invoice_audit_log').insert({
          invoice_id: invData.id,
          action: 'CREATE',
          changed_fields: {
            old_values: null,
            new_values: {
              numero: invoice.numero,
              status: invoice.status,
              cliente: invoice.cliente.nome,
              total_items: invoice.itens.length
            }
          },
          user_id: currentUser?.id || invoice.createdBy || null
        });
      } catch (auditErr) {
        console.warn('Failed to create audit log entry:', auditErr);
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
      user_id: currentUser?.id,
      invoice_id: invoiceId,
      description: `Recebimento (${invoice.numero})`,
      amount: payment.valor,
      payment_method: payment.modalidade
    };
    if (currentUser?.locationId) {
      if (!isValidUuid(currentUser.locationId)) {
        console.warn('Localização do usuário inválida ao criar transação de pagamento; gravando sem location_id.');
      } else {
        if (currentUser) txnPayload.location_id = currentUser.locationId;
      }
    }

    // Prefer to include client name / nuit if available on invoice object
    if ((invoice as any).cliente?.nome) txnPayload.client_name = (invoice as any).cliente.nome;
    else if ((invoice as any).client_name) txnPayload.client_name = (invoice as any).client_name;

    if ((invoice as any).cliente?.nuit) txnPayload.client_nuit = (invoice as any).cliente.nuit;
    else if ((invoice as any).client_nuit) txnPayload.client_nuit = (invoice as any).client_nuit;

    try {
      // Validate user_id and location_id before insert
      if (!isValidUuid(txnPayload.user_id)) {
        showNotification('Erro: usuário inválido ao registrar transação. Contate o administrador.');
        return;
      }
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

  // Add new user (admin only) - thin wrapper that delegates to services/userService
  const addUser = async (user: { name: string; email: string; password?: string; role: Role; locationId?: string; jobTitle?: string; defaultDailyGoal?: number; dailyRate?: number; halfDayRate?: number; absencePenalty?: number; bonusPerUnit?: number; }) => {
    if (!currentUser) {
      throw new Error("Ação não permitida: Usuário não autenticado.");
    }
    if (!isAdminOrGM) {
      throw new Error('Apenas administradores podem criar usuários.');
    }
    if (!user.password) {
      throw new Error('Senha é obrigatória');
    }

    try {
      showNotification(`⏳ Criando usuário ${user.name}...`);

      const result = await createUserWithEdge({
        name: user.name,
        email: user.email,
        password: user.password,
        role: String(user.role),
        locationId: user.locationId || null,
        jobTitle: user.jobTitle || null,
        defaultDailyGoal: user.defaultDailyGoal ?? null,
        dailyRate: user.dailyRate ?? null,
        halfDayRate: user.halfDayRate ?? null,
        absencePenalty: user.absencePenalty ?? null,
        bonusPerUnit: user.bonusPerUnit ?? null
      });

      if (!result.success) {
        console.error('❌ Edge Function error:', result);
        const msg = result.error || `Erro ao criar usuário (status ${result.status || 'unknown'})`;
        showNotification(`❌ Erro: ${msg}`);
        throw new Error(msg);
      }

      console.log('✅ Usuário criado com sucesso! ID:', result.data?.userId || result.data?.user_id || null);
      showNotification(`📝 Usuário criado! Atualizando lista...`);

      // Refresh users list
      const { data: usersData, error: selectError } = await supabase.from('users').select('*');
      if (selectError) {
        console.error('Erro ao buscar lista de usuários:', selectError);
        showNotification(`⚠️ Usuário criado, mas erro ao atualizar lista`);
      } else if (usersData) {
        const mappedUsers = usersData.map((u: any) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          locationId: u.location_id || null,
          jobTitle: u.job_title,
          defaultDailyGoal: u.default_daily_goal,
          dailyRate: u.daily_rate,
          halfDayRate: u.half_day_rate,
          absencePenalty: u.absence_penalty,
          bonusPerUnit: u.bonus_per_unit
        }));
        setAllUsers(mappedUsers);
        showNotification(`✅ Usuário ${user.name} criado com sucesso!`, 6000);
      }

    } catch (error: any) {
      console.error('❌ Exception ao criar usuário:', error);
      const errorMsg = error?.message || 'Erro desconhecido ao criar usuário';
      showNotification(`❌ Erro: ${errorMsg}`, 6000);
      throw error;
    }
  };

  // Ficha Individual Functions
  const createFicha = async (ficha: Omit<FichaIndividual, 'id' | 'codigo' | 'created_at' | 'updated_at'>) => {
    if (!currentUser) return;
    try {
      // 1. Obter localização da entidade/pessoa se disponível, ou usar a do usuário atual
      const person = allUsers.find(u => u.id === ficha.entidade_id);
      const targetLocationId = person?.locationId || currentUser.locationId;

      if (!targetLocationId) {
        showNotification("Erro: Não foi possível determinar a localização para saída de stock.");
        return;
      }

      // 2. Obter stock atual antes da redução
      let stockAntes = 0;
      if (ficha.produto_id) {
        const invRecord = inventory.find(i => i.itemId === ficha.produto_id && i.locationId === targetLocationId);
        stockAntes = invRecord?.quantity || 0;
      }

      // 3. Gerar código automático
      const { count } = await supabase.from('fichas_individuais').select('id', { count: 'exact', head: true });
      const nextCode = `FICHA-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;

      // 4. Inserir registo
      const { data, error } = await supabase.from('fichas_individuais').insert({
        codigo: nextCode,
        tipo: ficha.tipo,
        entidade_id: ficha.entidade_id,
        entidade_tipo: ficha.entidade_tipo,
        data: ficha.data,
        produto_id: ficha.produto_id,
        produto_name: ficha.produto,
        quantidade: ficha.quantidade,
        unidade: ficha.unidade,
        stock_antes: stockAntes,
        stock_depois: stockAntes - ficha.quantidade,
        observacoes: ficha.observacoes,
        usuario_registou: currentUser.id,
        estado: 'confirmado' // Sugestão: entrega direta já nasce confirmada para reduzir stock
      }).select().single();

      if (error) throw error;

      // 5. Reduzir stock se houver produto_id
      if (ficha.produto_id) {
        await updateInventory(ficha.produto_id, targetLocationId, -ficha.quantidade);
      }

      setFichasIndividuais(prev => [data, ...prev]);
      showNotification('Entrega registrada e stock atualizado!');
    } catch (error: any) {
      console.error('Erro ao criar ficha:', error);
      showNotification(`Erro ao criar ficha: ${error.message}`);
    }
  };

  const confirmFicha = async (fichaId: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('fichas_individuais').update({ estado: 'confirmado' }).eq('id', fichaId);
      if (error) throw error;
      setFichasIndividuais(prev => prev.map(f => f.id === fichaId ? { ...f, estado: 'confirmado' } : f));
      showNotification('Ficha confirmada!');
    } catch (error: any) {
      showNotification(`Erro ao confirmar ficha: ${error.message}`);
    }
  };

  const lockFicha = async (fichaId: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('fichas_individuais').update({ estado: 'trancado' }).eq('id', fichaId);
      if (error) throw error;
      setFichasIndividuais(prev => prev.map(f => f.id === fichaId ? { ...f, estado: 'trancado' } : f));
      showNotification('Ficha trancada!');
    } catch (error: any) {
      showNotification(`Erro ao trancar ficha: ${error.message}`);
    }
  };

  const updateFicha = async (ficha: FichaIndividual) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      showNotification('Apenas administradores podem editar fichas.');
      return;
    }
    try {
      const { error } = await supabase.from('fichas_individuais').update(ficha).eq('id', ficha.id);
      if (error) throw error;
      setFichasIndividuais(prev => prev.map(f => f.id === ficha.id ? ficha : f));
      showNotification('Ficha atualizada!');
    } catch (error: any) {
      showNotification(`Erro ao atualizar ficha: ${error.message}`);
    }
  };

  const deleteFicha = async (fichaId: string) => {
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      showNotification('Apenas administradores podem apagar fichas.');
      return;
    }
    try {
      const { error } = await supabase.from('fichas_individuais').delete().eq('id', fichaId);
      if (error) throw error;
      setFichasIndividuais(prev => prev.filter(f => f.id !== fichaId));
      showNotification('Ficha apagada!');
    } catch (error: any) {
      showNotification(`Erro ao apagar ficha: ${error.message}`);
    }
  };

  const createInitialStock = async (stock: Omit<InitialStock, 'id' | 'created_at'>) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('initial_stock').insert({
        ...stock,
        usuario_registou: currentUser.id
      }).select().single();
      if (error) throw error;
      setInitialStocks(prev => [...prev, data]);
      showNotification('Stock inicial criado!');
    } catch (error: any) {
      showNotification(`Erro ao criar stock inicial: ${error.message}`);
    }
  };

  const updateStockAlarm = async (alarm: StockAlarm) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('stock_alarms').upsert(alarm).select().single();
      if (error) throw error;
      setStockAlarms(prev => prev.map(a => a.id === alarm.id ? data : a));
      showNotification('Alarme de stock atualizado!');
    } catch (error: any) {
      showNotification(`Erro ao atualizar alarme: ${error.message}`);
    }
  };

  const getAuditLogsForTable = (table: string, recordId: string) => {
    return auditLogs.filter(log => log.tabela === table && log.record_id === recordId);
  };

  // === NOVAS FUNÇÕES PARA FATURAMENTO EXPANDIDO ===

  // Cost Center Functions
  const addCostCenter = async (costCenter: Omit<CostCenter, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('cost_centers').insert({
        ...costCenter,
        created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      setCostCenters(prev => [...prev, data]);
      showNotification('Centro de custo criado!');
    } catch (error: any) {
      showNotification(`Erro ao criar centro de custo: ${error.message}`);
    }
  };

  const updateCostCenter = async (costCenter: CostCenter) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('cost_centers').update(costCenter).eq('id', costCenter.id).select().single();
      if (error) throw error;
      setCostCenters(prev => prev.map(cc => cc.id === costCenter.id ? data : cc));
      showNotification('Centro de custo atualizado!');
    } catch (error: any) {
      showNotification(`Erro ao atualizar centro de custo: ${error.message}`);
    }
  };

  const deleteCostCenter = async (costCenterId: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('cost_centers').delete().eq('id', costCenterId);
      if (error) throw error;
      setCostCenters(prev => prev.filter(cc => cc.id !== costCenterId));
      showNotification('Centro de custo removido!');
    } catch (error: any) {
      showNotification(`Erro ao remover centro de custo: ${error.message}`);
    }
  };

  // Pending Invoice Items Functions
  const createPendingInvoiceItem = async (item: Omit<PendingInvoiceItem, 'id' | 'totalValue' | 'invoicedQuantity' | 'remainingQuantity' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    try {
      const totalValue = item.quantity * item.unitPrice;
      const { data, error } = await supabase.from('pending_invoice_items').insert({
        ...item,
        total_value: totalValue,
        invoiced_quantity: 0,
        remaining_quantity: item.quantity,
        created_by: currentUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      setPendingInvoiceItems(prev => [...prev, data]);
      showNotification('Item por faturar criado!');
    } catch (error: any) {
      showNotification(`Erro ao criar item pendente: ${error.message}`);
    }
  };

  const updatePendingInvoiceItem = async (item: PendingInvoiceItem) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('pending_invoice_items').update({
        ...item,
        updated_at: new Date().toISOString()
      }).eq('id', item.id).select().single();
      if (error) throw error;
      setPendingInvoiceItems(prev => prev.map(pi => pi.id === item.id ? data : pi));
      showNotification('Item pendente atualizado!');
    } catch (error: any) {
      showNotification(`Erro ao atualizar item pendente: ${error.message}`);
    }
  };

  const deletePendingInvoiceItem = async (itemId: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.from('pending_invoice_items').delete().eq('id', itemId);
      if (error) throw error;
      setPendingInvoiceItems(prev => prev.filter(pi => pi.id !== itemId));
      showNotification('Item pendente removido!');
    } catch (error: any) {
      showNotification(`Erro ao remover item pendente: ${error.message}`);
    }
  };

  const linkInvoiceToPendingItem = async (invoiceItemId: string, pendingItemId: string, quantityUsed: number) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('invoice_pending_links').insert({
        invoice_item_id: invoiceItemId,
        pending_item_id: pendingItemId,
        quantity_used: quantityUsed,
        created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      setInvoicePendingLinks(prev => [...prev, data]);
      showNotification('Item ligado à fatura!');
    } catch (error: any) {
      showNotification(`Erro ao ligar item: ${error.message}`);
    }
  };

  // Credit Notes Functions
  const createCreditNote = async (creditNote: Omit<CreditNote, 'id' | 'createdAt'>) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('credit_notes').insert({
        ...creditNote,
        created_by: currentUser.id,
        created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      setCreditNotes(prev => [...prev, data]);
      showNotification('Nota de crédito criada!');
    } catch (error: any) {
      showNotification(`Erro ao criar nota de crédito: ${error.message}`);
    }
  };

  const updateCreditNote = async (creditNote: CreditNote) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('credit_notes').update(creditNote).eq('id', creditNote.id).select().single();
      if (error) throw error;
      setCreditNotes(prev => prev.map(cn => cn.id === creditNote.id ? data : cn));
      showNotification('Nota de crédito atualizada!');
    } catch (error: any) {
      showNotification(`Erro ao atualizar nota de crédito: ${error.message}`);
    }
  };

  // Extended Client Functions
  const updateClientExtended = async (client: ClientExtended) => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase.from('clients').update({
        ...client,
        credit_limit: client.creditLimit,
        current_balance: client.currentBalance,
        status: client.status,
        client_type: client.clientType
      }).eq('id', client.id).select().single();
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === client.id ? data : c));
      showNotification('Cliente atualizado!');
    } catch (error: any) {
      showNotification(`Erro ao atualizar cliente: ${error.message}`);
    }
  };

  const getClientCreditStatus = (clientId: string) => {
    const client = clients.find(c => c.id === clientId) as ClientExtended;
    if (!client) return { availableCredit: 0, isBlocked: true };

    const availableCredit = client.creditLimit - client.currentBalance;
    const isBlocked = client.status === 'BLOCKED' || client.status === 'SUSPENDED' || availableCredit < 0;

    return { availableCredit, isBlocked };
  };

  // Reports Functions (implementações básicas)
  const generateSalesReport = async (startDate: string, endDate: string): Promise<SalesReport> => {
    // Implementação básica - será expandida
    return {
      period: `${startDate} - ${endDate}`,
      totalSales: 0,
      totalInvoices: invoices.length,
      totalClients: clients.length,
      salesByProduct: [],
      salesByClient: []
    };
  };

  const generateFinancialReport = async (startDate: string, endDate: string): Promise<FinancialReport> => {
    // Implementação básica - será expandida
    return {
      accountsReceivable: 0,
      overdueAccounts: 0,
      cashFlow: [],
      clientBalances: []
    };
  };

  const generateProfitabilityReport = async (startDate: string, endDate: string): Promise<ProfitabilityReport> => {
    // Implementação básica - será expandida
    return {
      costCenters: [],
      products: []
    };
  };

  // Reset local front-end data: clears localStorage and resets app states to empty/defaults.
  const resetLocalData = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        console.log('🧹 Limpando localStorage...');
        localStorage.clear();
      }
    } catch (err) {
      console.warn('Não foi possível limpar localStorage:', err);
    }

    // Reset in-memory states
    setAllUsers([]);
    setItems([]);
    setLocations([]);
    setInventory([]);
    setRequisitions([]);
    setRequisitionSheets([]);
    setPerformanceRecords([]);
    setAccountingEntries([]);
    setLogEntries([]);
    setTransactions([]);
    setInvoices([]);
    setClients([]);
    setFichasIndividuais([]);
    setInitialStocks([]);
    setStockAlarms([]);
    setAuditLogs([]);
    setCostCenters([]);
    setPendingInvoiceItems([]);
    setInvoicePendingLinks([]);
    setCreditNotes([]);

    setCategories([]);
    setMeasureUnits([]);
    setItemTypes([]);
    setPaymentMethods([]);
    setExpenseCategories([]);
    setCompanyInfo({ nome: '', nuit: '', endereco: '', contacto: '' });
    setDefaultCurrency(availableCurrencies[0] || 'MZN');
    setPayrollParams({});

    setSelectedDepartmentId(null);
    setCurrentUser(null);
    setLastUpdated(new Date());
    setNotification(null);

    showNotification('Dados locais reiniciados.');
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
      currentUser, allUsers, items, locations, inventory, requisitions, requisitionSheets, performanceRecords, accountingEntries, transactions, invoices, clients, fichasIndividuais, initialStocks, stockAlarms, auditLogs, logEntries,
      costCenters, pendingInvoiceItems, invoicePendingLinks, creditNotes,
      selectedDepartmentId, lastUpdated, notification, isAdminOrGM,
      categories, measureUnits, itemTypes, rolePermissions,
      paymentMethods, expenseCategories, companyInfo, availableCurrencies, defaultCurrency,
      payrollParams,
      setSelectedDepartmentId, createRequisition,
      createRequisitionSheet,
      updateRequisitionStatus,
      updateRequisitionSheetStatus,
      updateRequisitionSheetItemDelivery,
      getInventoryByLocation, getItemName, getLocationName, getClientName, savePerformanceRecord, getWorkersByManager,
      getWorkersByLocation, refreshData, registerNewItem, addToInventory, deleteItem, updateItem,
      resetLocalData,
      addUser, updateUser, deleteUser, addLocation, removeLocation, addCategory, addMeasureUnit, addItemType,
      addPaymentMethod, removePaymentMethod, addExpenseCategory, removeExpenseCategory, updateCompanyInfo, setDefaultCurrency,
      processSale, registerExpense, hasPermission, togglePermission,
      addInvoice, updateInvoice, deleteInvoice, getNextInvoiceNumber, registerPayment,
      addClient, updateClient, getClientBalance,
      updatePayrollParams, calculatePayrollForUser,
      createFicha, confirmFicha, lockFicha, updateFicha, deleteFicha, createInitialStock, updateStockAlarm, getAuditLogsForTable,
      addCostCenter, updateCostCenter, deleteCostCenter,
      createPendingInvoiceItem, updatePendingInvoiceItem, deletePendingInvoiceItem, linkInvoiceToPendingItem,
      createCreditNote, updateCreditNote,
      updateClientExtended, getClientCreditStatus,
      generateSalesReport, generateFinancialReport, generateProfitabilityReport
    }}>
      {children}
    </LogisticsContext.Provider>
  );
};
