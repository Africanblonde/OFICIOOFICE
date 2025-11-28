
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
  locationId: string; // Creates the hierarchy link
  jobTitle?: string; // Cargo (ex: Motosserrista)

  // New Salary Structure
  defaultDailyGoal?: number; // Meta (ex: 12 árvores)
  dailyRate?: number;        // Valor Dia (ex: 236.5)
  halfDayRate?: number;      // Valor Meio Dia (ex: 118)
  absencePenalty?: number;   // Valor Desconto Falta (ex: 95)
  bonusPerUnit?: number;     // Valor Bónus por árvore extra (ex: 10)
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

  // Financials
  amount: number; // Valor Total
  paymentMethod: PaymentMethod;
  invoiceId?: string | null; // Optional link to related invoice/payment
}

// --- INVOICING / FATURAÇÃO TYPES ---

export type DocumentType = "COTACAO" | "PRO_FORMA" | "FATURA" | "FATURA_RECIBO";
export type InvoiceStatus = "RASCUNHO" | "EMITIDA" | "PAGA_PARCIAL" | "PAGA" | "CANCELADA";

export interface CompanyInfo {
  nome: string;
  nuit: string;
  endereco: string;
  contacto?: string;
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
}

// --- CLIENT REGISTRY (CRM) ---
export interface Client {
  id: string;
  name: string;
  nuit?: string;
  email?: string;
  contact?: string;
  address?: string;
  notes?: string;
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