
export enum Role {
  ADMIN = 'ADMIN',       // Administração Central
  GENERAL_MANAGER = 'GENERAL_MANAGER', // Diretor Geral / CEO
  MANAGER = 'MANAGER',   // Gestor de Departamento/Filial
  WORKER = 'WORKER'      // Equipe de Campo
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED'
}

export enum LocationType {
  CENTRAL = 'CENTRAL',
  BRANCH = 'BRANCH',
  FIELD = 'FIELD'
}

export enum AttendanceStatus {
  FULL_DAY = 'D',        // Dia Completo
  HALF_DAY = 'D/2',      // Meio Dia
  ABSENT = 'F'           // Falta
}

export enum ItemType {
  CONSUMABLE = 'CONSUMABLE', // Consumível (Gasolina, Luvas descartáveis)
  ASSET = 'ASSET'            // Ativo Durável (Motosserra, GPS)
}

export interface ItemTypeDefinition {
  id: string;
  name: string;      // ex: "EPI", "Ferramenta", "Veículo"
  behavior: ItemType; // ASSET ou CONSUMABLE
}

export enum ItemCondition {
  NEW = 'NEW',       // Novo
  GOOD = 'GOOD',     // Bom Estado
  FAIR = 'FAIR',     // Desgastado/Regular
  POOR = 'POOR',     // Ruim/Manutenção Necessária
  DAMAGED = 'DAMAGED' // Danificado
}

export interface User {
  id: string;
  name: string;
  role: Role;
  locationId: string | null; // Creates the hierarchy link (null = no location assigned)
  jobTitle?: string; // Cargo (ex: Motosserrista)

  // New Salary Structure
  defaultDailyGoal?: number; // Meta (ex: 12 árvores)
  dailyRate?: number;        // Valor Dia (ex: 236.5)
  halfDayRate?: number;      // Valor Meio Dia (ex: 118)
  absencePenalty?: number;   // Valor Desconto Falta (ex: 95)
  bonusPerUnit?: number;     // Valor Bónus por árvore extra (ex: 10)
  email?: string; // Added email field
}

export interface PayrollRecord {
  userId: string;
  userName: string;
  fullDays: number;
  halfDays: number;
  absences: number;

  targetProduction: number;
  realProduction: number;
  efficiency: number; // Percentage

  baseSalary: number; // (D * Rate) + (D/2 * HalfRate)
  productionBonus: number; // (Real - Target) * BonusRate
  totalDeductions: number; // (F * Penalty) + Advances
  netSalary: number;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
  type: ItemType;
  unit: string; // Nova propriedade: Litros, Unidade, Kg, etc.
  price: number; // Preço unitário padrão
  is_for_sale?: boolean; // Indica se o item está disponível para venda no POS
}

export interface InventoryRecord {
  itemId: string;
  locationId: string;
  quantity: number;
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  parentId: string | null;
}

export interface Requisition {
  id: string;
  requesterId: string;
  sourceLocationId: string;
  targetLocationId: string;
  itemId: string;
  quantity: number;
  status: RequestStatus;
  condition: ItemCondition; // Novo campo: Estado do item requisitado/enviado
  createdAt: string;
  updatedAt: string;
  logs: LogEntry[];
}

export interface RequisitionSheet {
  id: string;
  requisitionNumber: string; // e.g., "REQ-2025/001"
  requesterId: string;
  sourceLocationId: string;
  sourceLocationName?: string;
  targetLocationId: string;
  targetLocationName?: string;
  status: RequestStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: RequisitionSheetItem[];
}

export interface RequisitionSheetItem {
  id: string;
  sheetId: string;
  itemId?: string | null; // Nullable for manual items
  itemName: string;
  quantity: number;
  unit: string;
  condition: ItemCondition;
  isDelivered: boolean;
  notes?: string;
}

export interface LogEntry {
  timestamp: string;
  actorId: string;
  action: string;
  message: string;
}

export interface DailyPerformance {
  id: string;
  workerId: string;
  date: string; // ISO Date YYYY-MM-DD
  status: AttendanceStatus;
  production: number; // Árvores cortadas
  notes?: string;
}

export interface AIAnalysis {
  summary: string;
  risks: string[];
  optimizations: string[];
}

export interface AccountingEntry {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  locationId: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  type: 'ATIVO' | 'PASSIVO'; // Baseado no ItemType
  userId: string;
}

// --- POS & FINANCE TYPES ---

export enum TransactionType {
  SALE = 'SALE',
  EXPENSE = 'EXPENSE'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD', // POS Físico
  MOBILE_MONEY = 'MOBILE_MONEY', // M-Pesa, e-Mola
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE'
}

// --- EXPENSE MANAGEMENT TYPES ---
export enum ApprovalStatus {
  DRAFT = 'DRAFT',           // Rascunho
  PENDING = 'PENDING',       // Aguardando aprovação
  APPROVED = 'APPROVED',     // Aprovado
  REJECTED = 'REJECTED',     // Rejeitado
  PAID = 'PAID'              // Pago
}

export enum AttachmentType {
  RECEIPT = 'RECEIPT',
  INVOICE = 'INVOICE',
  RECEIPT_PHOTO = 'RECEIPT_PHOTO',
  CONTRACT = 'CONTRACT'
}

export interface CartItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  userId: string;
  locationId: string;

  // Sale details
  clientName?: string;
  clientNuit?: string;
  items?: CartItem[];

  // Expense details
  description?: string; // Para despesas
  category?: string; // Ex: Combustível, Manutenção
  costCenterId?: string; // --- NEW: Obrigatório para despesas

  // Financials
  amount: number; // Valor Total
  paymentMethod: PaymentMethod;
  invoiceId?: string | null; // Optional link to related invoice/payment

  // --- NEW: Approval Workflow ---
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvalDate?: string;
  rejectionReason?: string;
  requiresApproval?: boolean; // true se amount > 5000
  employeeId?: string;        // Funcionário responsável (para despesas)
  receiptNumber?: string;     // Número do recibo
}

// --- INVOICING / FATURAÇÃO TYPES ---

export type DocumentType = "COTACAO" | "PRO_FORMA" | "FATURA" | "FATURA_RECIBO";
export type InvoiceStatus = "RASCUNHO" | "EMITIDA" | "PAGA_PARCIAL" | "PAGA" | "CANCELADA";

// --- COLLECTIONS / COBRANÇAS TYPES ---
export enum CollectionStatus {
  NOT_DUE = 'NOT_DUE',           // Não vencida
  DUE = 'DUE',                   // Vencida
  OVERDUE_30 = 'OVERDUE_30',     // Atraso de 30+ dias
  OVERDUE_60 = 'OVERDUE_60',     // Atraso de 60+ dias
  OVERDUE_90 = 'OVERDUE_90',     // Atraso de 90+ dias
  IN_COLLECTION = 'IN_COLLECTION', // Em cobrança ativa
  PARTIALLY_PAID = 'PARTIALLY_PAID', // Parcialmente paga
  PAID = 'PAID',                 // Paga
  WRITTEN_OFF = 'WRITTEN_OFF'    // Anulada/Perda
}

export enum CollectionAttemptType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE = 'PHONE',
  LETTER = 'LETTER',
  PERSONAL_VISIT = 'PERSONAL_VISIT'
}

export enum CollectionAttemptStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PROMISED = 'PROMISED'
}

export interface CompanyInfo {
  nome: string;
  nuit: string;
  endereco: string;
  contacto?: string;
  email?: string;
  logo?: string;
}

export interface Client {
  id?: string;
  nome?: string;
  name?: string; // English alias for nome
  nuit?: string;
  endereco?: string;
  address?: string; // English alias for endereco
  contacto?: string;
  contact?: string; // English alias for contacto
  email?: string;
  notes?: string;
}

export interface ClientInfo {
  id?: string; // Link to registered client
  nome: string;
  nuit?: string;
  endereco?: string;
  contacto?: string;
}

export interface InvoiceItem {
  itemId?: string; // Optional linkage to Inventory Item
  descricao: string;
  quantidade: number;
  precoUnitario: number; // sem impostos
  impostoPercent?: number; // IVA
}

export interface InvoicePayment {
  data: string;
  valor: number;
  modalidade: PaymentMethod;
  referencia?: string;
}

export interface Invoice {
  id: string;
  numero: string; // sequencial (ex: 2025/000123)
  tipo: DocumentType;
  status: InvoiceStatus;
  locationId: string; // Which branch issued this
  empresa: CompanyInfo;
  cliente: ClientInfo;
  itens: InvoiceItem[];
  pagamentos: InvoicePayment[];
  moeda: "MZN" | "USD";
  dataEmissao: string;
  vencimento?: string;
  observacoes?: string;
  createdBy: string;
  // --- NEW: Collections Fields ---
  daysOverdue?: number;           // Dias de atraso (calculado automaticamente)
  collectionStatus?: CollectionStatus; // Status de cobrança
  lastCollectionAttempt?: string; // Data da última tentativa
  collectionNotes?: string;       // Notas sobre cobrança
  isInstallmentPlan?: boolean;    // Se é parcelado
}

// --- COLLECTIONS / COBRANÇAS INTERFACES ---

export interface CollectionAttempt {
  id: string;
  invoiceId: string;
  clientId?: string;
  attemptDate: string; // ISO timestamp
  attemptType: CollectionAttemptType;
  attemptStatus: CollectionAttemptStatus;
  notes?: string;
  responseReceived: boolean;
  responseDate?: string; // ISO timestamp
  responseNotes?: string;
  nextAttemptScheduled?: string; // ISO timestamp
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceInstallment {
  id: string;
  invoiceId: string;
  installmentNumber: number;
  totalInstallments: number;
  installmentAmount: number;
  dueDate: string; // ISO date YYYY-MM-DD
  paidDate?: string; // ISO date
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  daysOverdue: number; // Calculated field
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientBalance {
  clientId: string;
  clientName: string;
  nuit?: string;
  totalInvoices: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
  maxDaysOverdue: number;
  overdueInvoiceCount: number;
  lastPaymentDate?: string;
}

export interface ClientBalanceHistory {
  id: string;
  clientId: string;
  balanceAmount: number;
  overdueAmount: number;
  daysOldestOverdue: number;
  recordedDate: string; // ISO timestamp
  notes?: string;
}

export interface OverdueInvoice {
  id: string;
  numero: string;
  clientName: string;
  clientNuit?: string;
  valorTotal: number;
  dueDate: string;
  daysOverdue: number;
  collectionStatus: CollectionStatus;
  status: InvoiceStatus;
  attemptCount: number;
  lastAttemptDate?: string;
}

// --- PERMISSIONS SYSTEM ---

export type AppPermission =
  | 'VIEW_DASHBOARD'
  | 'VIEW_REPORTS' // NEW: Access to Daily Briefing/Reports Modal
  | 'VIEW_REQUISITIONS'
  | 'MANAGE_REQUISITIONS' // Approve/Reject
  | 'VIEW_INVENTORY'
  | 'MANAGE_INVENTORY' // Add stock, create items
  | 'VIEW_PERFORMANCE'
  | 'MANAGE_PERFORMANCE' // Edit records
  | 'VIEW_POS'
  | 'MANAGE_POS' // Make sales/expenses
  | 'VIEW_INVOICES' // NEW
  | 'MANAGE_INVOICES' // NEW: Create/Edit/Print Invoices
  | 'VIEW_PATRIMONY'
  | 'VIEW_HR'
  | 'MANAGE_HR'
  | 'VIEW_PAYROLL'
  | 'MANAGE_PAYROLL'
  | 'VIEW_SETTINGS'
  | 'MANAGE_SETTINGS' // NEW: Create Locations, Item Types, Categories
  | 'MANAGE_USERS' // NEW: Create/Edit Users
  | 'MANAGE_PERMISSIONS';

export type RolePermissions = Record<Role, AppPermission[]>;

// Novos tipos para Ficha Individual
export type FichaTipo = 'combustivel' | 'oleo' | 'pecas' | 'materiais' | 'ferramentas';
export type RegistoEstado = 'pendente' | 'confirmado' | 'trancado';

export interface FichaIndividual {
  id: string;
  codigo: string;
  tipo: FichaTipo;
  entidade_id: string;
  entidade_tipo: string; // 'viatura', 'maquina', 'trabalhador'
  data: string;
  produto_id?: string;
  produto: string; // nome do produto
  quantidade: number;
  unidade: string;
  stock_antes?: number;
  stock_depois?: number;
  observacoes?: string;
  usuario_registou: string;
  estado: RegistoEstado;
  created_at: string;
  updated_at: string;
}

export interface InitialStock {
  id: string;
  produto: string;
  quantidade_inicial: number;
  valor_unitario?: number;
  data_entrada: string;
  fornecedor?: string;
  usuario_registou: string;
  created_at: string;
}

export interface StockAlarm {
  id: string;
  produto: string;
  stock_minimo: number;
  stock_critico: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  tabela: string;
  record_id: string;
  action: string;
  user_id?: string;
  old_values?: any;
  new_values?: any;
  timestamp: string;
}

// --- FATURAMENTO & DESPESAS EXPANDIDO ---

export enum ClientType {
  FINAL = 'FINAL',           // Cliente final
  RESELLER = 'RESELLER',     // Revendedor
  INSTITUTIONAL = 'INSTITUTIONAL' // Institucional
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED'
}

export enum CostCenterType {
  PRODUCTION = 'PRODUCTION', // Produção (talhões)
  ADMIN = 'ADMIN',          // Administração
  TRANSPORT = 'TRANSPORT',  // Transporte
  SALES = 'SALES'          // Vendas
}

export enum PendingItemStatus {
  PENDING = 'PENDING',
  PARTIALLY_INVOICED = 'PARTIALLY_INVOICED',
  FULLY_INVOICED = 'FULLY_INVOICED'
}

export interface CostCenter {
  id: string;
  name: string;
  description?: string;
  type: CostCenterType;
  locationId?: string;
  managerId?: string;
  isActive: boolean;
  budgetLimit?: number;        // --- NEW
  budgetPeriod?: string;        // MONTHLY, QUARTERLY, ANNUAL
  budgetStartDate?: string;     // ISO date
  createdAt: string;
}

// --- NEW: EXPENSE MANAGEMENT INTERFACES ---

export interface ExpenseAttachment {
  id: string;
  transactionId: string;
  attachmentType: AttachmentType;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedAt: string;
  description?: string;
  createdAt: string;
}

export interface ExpenseBudgetTracking {
  id: string;
  costCenterId: string;
  periodStart: string; // ISO date
  periodEnd: string;   // ISO date
  budgetAmount?: number;
  spentAmount: number;
  approvedPendingAmount: number;
  percentageUsed: number;
  lastUpdated: string;
  notes?: string;
}

export interface ExpenseCategoryLimit {
  id: string;
  costCenterId: string;
  categoryName: string;
  monthlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface PendingExpenseApproval {
  id: string;
  receiptNumber?: string;
  description?: string;
  category?: string;
  amount: number;
  date: string;
  userId: string;
  userName: string;
  costCenterName?: string;
  approvalStatus: ApprovalStatus;
  attachmentCount: number;
  requiresApproval: boolean;
}

export interface ExpenseBudgetSummary {
  costCenterId: string;
  costCenterName?: string;
  periodStart: string;
  periodEnd: string;
  budgetAmount?: number;
  spentAmount: number;
  approvalPendingAmount?: number;
  remainingBudget: number;
  percentageUsed: number;
  budgetStatus: 'OK' | 'WARNING' | 'CRITICAL' | 'EXCEEDED';
}

export interface ExpenseByCategoryReport {
  categoryName?: string;
  category?: string;
  costCenterName?: string;
  totalAmount: number;
  expenseCount: number;
  percentageOfTotal: number;
  averageExpense: number;
}

export interface PendingInvoiceItem {
  id: string;
  clientId: string;
  itemId: string;
  costCenterId?: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  referenceDocument?: string;
  documentDate?: string;
  notes?: string;
  status: PendingItemStatus;
  invoicedQuantity: number;
  remainingQuantity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePendingLink {
  id: string;
  invoiceItemId: string;
  pendingItemId: string;
  quantityUsed: number;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  numero: string;
  originalInvoiceId: string;
  reason: string;
  totalAmount: number;
  status: InvoiceStatus;
  issuedDate: string;
  createdBy: string;
  createdAt: string;
}

export interface CreditNoteItem {
  id: string;
  creditNoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
}

// Extensões das interfaces existentes
export interface ClientExtended extends Client {
  creditLimit: number;
  currentBalance: number;
  status: ClientStatus;
  clientType: ClientType;
}

export interface ItemExtended extends Item {
  costCenterId?: string;
  stockControl: boolean;
  averageCost: number;
  is_for_sale?: boolean; // Inherited from Item, but explicitly documented
}

export interface InvoiceExtended extends Invoice {
  costCenterId?: string;
}

// --- RELATÓRIOS FINANCEIROS ---

export interface SalesReport {
  period: string;
  totalSales: number;
  totalInvoices: number;
  totalClients: number;
  salesByProduct: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  salesByClient: Array<{
    clientName: string;
    totalValue: number;
    invoiceCount: number;
  }>;
}

export interface FinancialReport {
  accountsReceivable: number;
  overdueAccounts: number;
  cashFlow: Array<{
    date: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  clientBalances: Array<{
    clientId: string;
    clientName: string;
    balance: number;
    lastPayment?: string;
  }>;
}

export interface ProfitabilityReport {
  costCenters: Array<{
    costCenterId: string;
    costCenterName: string;
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
  }>;
  products: Array<{
    productId: string;
    productName: string;
    soldQuantity: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
}