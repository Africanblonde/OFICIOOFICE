
import { Item, Location, LocationType, Role, User, InventoryRecord, Requisition, RequestStatus, DailyPerformance, AttendanceStatus, ItemType, ItemCondition, RolePermissions, AppPermission } from './types';

export const LOCATIONS: Location[] = [
  { id: 'loc-central', name: 'Almoxarifado Central (Maputo HQ)', type: LocationType.CENTRAL, parentId: null },
  { id: 'loc-nampula', name: 'Filial Nampula', type: LocationType.BRANCH, parentId: 'loc-central' },
  { id: 'loc-beira', name: 'Filial Beira', type: LocationType.BRANCH, parentId: 'loc-central' },
  { id: 'loc-tete', name: 'Filial Tete (Moatize)', type: LocationType.BRANCH, parentId: 'loc-central' },
  { id: 'loc-zambezia', name: 'Filial Zambézia (Gurúè)', type: LocationType.BRANCH, parentId: 'loc-central' },
  { id: 'loc-manica', name: 'Filial Manica (Chimoio)', type: LocationType.BRANCH, parentId: 'loc-central' },
  { id: 'loc-field-alpha', name: 'Equipe Alpha (Nampula)', type: LocationType.FIELD, parentId: 'loc-nampula' },
  { id: 'loc-field-bravo', name: 'Equipe Bravo (Beira)', type: LocationType.FIELD, parentId: 'loc-beira' },
  { id: 'loc-field-charlie', name: 'Equipe Carvão (Tete)', type: LocationType.FIELD, parentId: 'loc-tete' },
  { id: 'loc-field-delta', name: 'Equipe Chá (Zambézia)', type: LocationType.FIELD, parentId: 'loc-zambezia' },
  { id: 'loc-field-echo', name: 'Equipe Madeira (Manica)', type: LocationType.FIELD, parentId: 'loc-manica' },
];

// Standard Rates based on prompt
const RATE_DAY = 236.5;
const RATE_HALF = 118;
const RATE_ABSENCE_PENALTY = 95;
const RATE_BONUS = 10;

export const USERS: User[] = [
  { id: 'u-admin', name: 'Carlos Admin', role: Role.ADMIN, locationId: 'loc-central', jobTitle: 'Diretor de Operações' },
  { id: 'u-gm', name: 'Roberto (Diretor Geral)', role: Role.GENERAL_MANAGER, locationId: 'loc-central', jobTitle: 'CEO' },
  { id: 'u-manager-nam', name: 'Joana (Gestora Nampula)', role: Role.MANAGER, locationId: 'loc-nampula', jobTitle: 'Gerente Regional' },
  { id: 'u-manager-bei', name: 'Pedro (Gestor Beira)', role: Role.MANAGER, locationId: 'loc-beira', jobTitle: 'Gerente Regional' },
  { id: 'u-manager-tete', name: 'Miguel (Gestor Tete)', role: Role.MANAGER, locationId: 'loc-tete', jobTitle: 'Gerente de Minas' },
  { id: 'u-manager-zam', name: 'Sofia (Gestora Zambézia)', role: Role.MANAGER, locationId: 'loc-zambezia', jobTitle: 'Gerente Agrícola' },
  { id: 'u-manager-man', name: 'André (Gestor Manica)', role: Role.MANAGER, locationId: 'loc-manica', jobTitle: 'Gerente Florestal' },

  // Field Workers with new Salary Structure
  {
    id: 'u-worker-1', name: 'Adelino Ernesto', role: Role.WORKER, locationId: 'loc-field-alpha', jobTitle: 'Cortador',
    defaultDailyGoal: 12, dailyRate: RATE_DAY, halfDayRate: RATE_HALF, absencePenalty: RATE_ABSENCE_PENALTY, bonusPerUnit: RATE_BONUS
  },
  {
    id: 'u-worker-2', name: 'Augusto João', role: Role.WORKER, locationId: 'loc-field-alpha', jobTitle: 'Ajudante',
    defaultDailyGoal: 8, dailyRate: RATE_DAY, halfDayRate: RATE_HALF, absencePenalty: RATE_ABSENCE_PENALTY, bonusPerUnit: RATE_BONUS
  },
  {
    id: 'u-worker-3', name: 'Ana (Operário Bravo)', role: Role.WORKER, locationId: 'loc-field-bravo', jobTitle: 'Técnica de Campo',
    defaultDailyGoal: 10, dailyRate: 300, halfDayRate: 150, absencePenalty: 100, bonusPerUnit: 15
  },
  {
    id: 'u-worker-4', name: 'Paulo (Operário Tete)', role: Role.WORKER, locationId: 'loc-field-charlie', jobTitle: 'Operador de Máquina',
    defaultDailyGoal: 20, dailyRate: 400, halfDayRate: 200, absencePenalty: 150, bonusPerUnit: 5
  },
  {
    id: 'u-worker-5', name: 'Ricardo (Operário Zambézia)', role: Role.WORKER, locationId: 'loc-field-delta', jobTitle: 'Colhedor',
    defaultDailyGoal: 15, dailyRate: RATE_DAY, halfDayRate: RATE_HALF, absencePenalty: RATE_ABSENCE_PENALTY, bonusPerUnit: RATE_BONUS
  },
  {
    id: 'u-worker-6', name: 'Beatriz (Operário Manica)', role: Role.WORKER, locationId: 'loc-field-echo', jobTitle: 'Fiscal Florestal',
    defaultDailyGoal: 10, dailyRate: 250, halfDayRate: 125, absencePenalty: 100, bonusPerUnit: 12
  },
];

export const ITEMS: Item[] = [
  { id: 'it-chainsaw', name: 'Motosserra Stihl MS 382', sku: 'EQ-001', category: 'Equipamento', type: ItemType.ASSET, unit: 'Unidade', price: 25000 },
  { id: 'it-helmet', name: 'Capacete de Segurança', sku: 'PPE-005', category: 'EPI', type: ItemType.CONSUMABLE, unit: 'Unidade', price: 450 },
  { id: 'it-gloves', name: 'Luvas de Couro', sku: 'PPE-012', category: 'EPI', type: ItemType.CONSUMABLE, unit: 'Par', price: 120 },
  { id: 'it-gps', name: 'GPS Garmin eTrex', sku: 'TEC-003', category: 'Tecnologia', type: ItemType.ASSET, unit: 'Unidade', price: 15000 },
  { id: 'it-boots', name: 'Botas de Segurança', sku: 'PPE-020', category: 'EPI', type: ItemType.CONSUMABLE, unit: 'Par', price: 1800 },
  { id: 'it-drone', name: 'Drone Mapeamento', sku: 'TEC-010', category: 'Tecnologia', type: ItemType.ASSET, unit: 'Unidade', price: 85000 },
];

export const INITIAL_INVENTORY: InventoryRecord[] = [
  // Central has plenty
  { itemId: 'it-chainsaw', locationId: 'loc-central', quantity: 50 },
  { itemId: 'it-helmet', locationId: 'loc-central', quantity: 200 },
  { itemId: 'it-gloves', locationId: 'loc-central', quantity: 500 },
  { itemId: 'it-gps', locationId: 'loc-central', quantity: 30 },
  { itemId: 'it-drone', locationId: 'loc-central', quantity: 5 },
  // Branches have some
  { itemId: 'it-chainsaw', locationId: 'loc-nampula', quantity: 5 },
  { itemId: 'it-helmet', locationId: 'loc-nampula', quantity: 20 },
  { itemId: 'it-gps', locationId: 'loc-tete', quantity: 10 },
  { itemId: 'it-boots', locationId: 'loc-tete', quantity: 50 },
  { itemId: 'it-gloves', locationId: 'loc-zambezia', quantity: 100 },
  { itemId: 'it-chainsaw', locationId: 'loc-manica', quantity: 8 },
  // Field has very little
  { itemId: 'it-chainsaw', locationId: 'loc-field-alpha', quantity: 2 },
];

export const INITIAL_REQUISITIONS: Requisition[] = [
  {
    id: 'req-001',
    requesterId: 'u-manager-nam',
    sourceLocationId: 'loc-central',
    targetLocationId: 'loc-nampula',
    itemId: 'it-chainsaw',
    quantity: 5,
    status: RequestStatus.PENDING,
    condition: ItemCondition.NEW,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    logs: [
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        actorId: 'u-manager-nam',
        action: 'CREATE',
        message: 'Solicitação inicial de 5 motosserras. Preferência por equipamentos novos.'
      }
    ]
  },
  {
    id: 'req-002',
    requesterId: 'u-manager-tete',
    sourceLocationId: 'loc-central',
    targetLocationId: 'loc-tete',
    itemId: 'it-boots',
    quantity: 20,
    status: RequestStatus.APPROVED,
    condition: ItemCondition.NEW,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    logs: [
      {
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        actorId: 'u-manager-tete',
        action: 'CREATE',
        message: 'Botas para nova equipe.'
      },
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        actorId: 'u-admin',
        action: 'APPROVE',
        message: 'Aprovado. Preparando para envio.'
      }
    ]
  }
];

// Mock data: Yesterday's performance (using new logic)
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const INITIAL_PERFORMANCE: DailyPerformance[] = [
  {
    id: 'perf-001',
    workerId: 'u-worker-1',
    date: yesterday,
    status: AttendanceStatus.FULL_DAY, // D
    production: 15, // Goal 12, Surplus 3
    notes: 'Excelente produtividade.'
  },
  {
    id: 'perf-002',
    workerId: 'u-worker-2',
    date: yesterday,
    status: AttendanceStatus.HALF_DAY, // D/2
    production: 4, // Goal 8 (adjusted),
    notes: 'Saiu mais cedo para consulta.'
  },
  {
    id: 'perf-003',
    workerId: 'u-worker-4',
    date: yesterday,
    status: AttendanceStatus.FULL_DAY,
    production: 22, // Goal 20
    notes: 'Operação em Tete normal.'
  }
];

// --- PERMISSION CONSTANTS ---

export const AVAILABLE_PERMISSIONS: { id: AppPermission; label: string; category: string }[] = [
  { id: 'VIEW_DASHBOARD', label: 'Visualizar Dashboard', category: 'Geral' },
  { id: 'VIEW_REPORTS', label: 'Relatórios Diários e Executivos', category: 'Geral' },
  { id: 'VIEW_REQUISITIONS', label: 'Visualizar Requisições', category: 'Logística' },
  { id: 'MANAGE_REQUISITIONS', label: 'Aprovar/Rejeitar Requisições', category: 'Logística' },
  { id: 'VIEW_INVENTORY', label: 'Visualizar Estoque', category: 'Logística' },
  { id: 'MANAGE_INVENTORY', label: 'Adicionar/Criar Estoque', category: 'Logística' },
  { id: 'VIEW_PERFORMANCE', label: 'Visualizar Desempenho', category: 'RH Operacional' },
  { id: 'MANAGE_PERFORMANCE', label: 'Lançar Produção/Presença', category: 'RH Operacional' },
  { id: 'VIEW_POS', label: 'Acessar Ponto de Venda', category: 'Vendas & Finanças' },
  { id: 'MANAGE_POS', label: 'Realizar Vendas/Despesas', category: 'Vendas & Finanças' },
  { id: 'VIEW_INVOICES', label: 'Visualizar Documentos/Faturas', category: 'Vendas & Finanças' }, // NEW
  { id: 'MANAGE_INVOICES', label: 'Emitir/Gerenciar Faturas', category: 'Vendas & Finanças' }, // NEW
  { id: 'VIEW_PATRIMONY', label: 'Visualizar Patrimônio/Contabilidade', category: 'Gestão' },
  { id: 'VIEW_HR', label: 'Visualizar Módulo RH', category: 'Gestão' },
  { id: 'MANAGE_HR', label: 'Gerenciar Funcionários (Criar/Editar)', category: 'Gestão' },
  { id: 'VIEW_PAYROLL', label: 'Visualizar Folha Salarial', category: 'Gestão' },
  { id: 'MANAGE_PAYROLL', label: 'Processar Folha Salarial', category: 'Gestão' },
  { id: 'VIEW_SETTINGS', label: 'Acessar Definições', category: 'Sistema' },
  { id: 'MANAGE_SETTINGS', label: 'Gerenciar Configurações (Locais/Itens)', category: 'Sistema' },
  { id: 'MANAGE_USERS', label: 'Gerenciar Usuários', category: 'Sistema' },
  { id: 'MANAGE_PERMISSIONS', label: 'Gerenciar Permissões', category: 'Sistema' },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  [Role.ADMIN]: [
    'VIEW_DASHBOARD', 'VIEW_REPORTS', 'VIEW_REQUISITIONS', 'MANAGE_REQUISITIONS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_PERFORMANCE', 'MANAGE_PERFORMANCE', 'VIEW_POS', 'MANAGE_POS', 'VIEW_INVOICES', 'MANAGE_INVOICES', 'VIEW_PATRIMONY',
    'VIEW_HR', 'MANAGE_HR', 'VIEW_PAYROLL', 'MANAGE_PAYROLL', 'VIEW_SETTINGS', 'MANAGE_SETTINGS', 'MANAGE_USERS', 'MANAGE_PERMISSIONS'
  ],
  [Role.GENERAL_MANAGER]: [
    'VIEW_DASHBOARD', 'VIEW_REPORTS', 'VIEW_REQUISITIONS', 'MANAGE_REQUISITIONS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_PERFORMANCE', 'VIEW_POS', 'VIEW_INVOICES', 'MANAGE_INVOICES', 'VIEW_PATRIMONY', 'VIEW_HR', 'MANAGE_HR', 'VIEW_PAYROLL', 'VIEW_SETTINGS', 'MANAGE_SETTINGS', 'MANAGE_USERS'
  ],
  [Role.MANAGER]: [
    'VIEW_DASHBOARD', 'VIEW_REQUISITIONS', 'VIEW_INVENTORY', 'MANAGE_INVENTORY',
    'VIEW_PERFORMANCE', 'MANAGE_PERFORMANCE', 'VIEW_POS', 'MANAGE_POS', 'VIEW_INVOICES', 'MANAGE_INVOICES'
  ],
  [Role.WORKER]: [
    'VIEW_DASHBOARD', 'VIEW_INVENTORY', 'VIEW_REQUISITIONS'
  ]
};
