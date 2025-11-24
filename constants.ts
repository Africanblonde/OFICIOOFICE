import { Item, Location, LocationType, Role, User, InventoryRecord, Requisition, RequestStatus, DailyPerformance, AttendanceStatus } from './types';

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

export const USERS: User[] = [
  { id: 'u-admin', name: 'Carlos Admin', role: Role.ADMIN, locationId: 'loc-central', jobTitle: 'Diretor de Operações' },
  { id: 'u-manager-nam', name: 'Joana (Gestora Nampula)', role: Role.MANAGER, locationId: 'loc-nampula', jobTitle: 'Gerente Regional' },
  { id: 'u-manager-bei', name: 'Pedro (Gestor Beira)', role: Role.MANAGER, locationId: 'loc-beira', jobTitle: 'Gerente Regional' },
  { id: 'u-manager-tete', name: 'Miguel (Gestor Tete)', role: Role.MANAGER, locationId: 'loc-tete', jobTitle: 'Gerente de Minas' },
  { id: 'u-manager-zam', name: 'Sofia (Gestora Zambézia)', role: Role.MANAGER, locationId: 'loc-zambezia', jobTitle: 'Gerente Agrícola' },
  { id: 'u-manager-man', name: 'André (Gestor Manica)', role: Role.MANAGER, locationId: 'loc-manica', jobTitle: 'Gerente Florestal' },
  { id: 'u-worker-1', name: 'Mateus (Operário Alpha)', role: Role.WORKER, locationId: 'loc-field-alpha', defaultDailyGoal: 20, jobTitle: 'Motosserrista' },
  { id: 'u-worker-2', name: 'Lucas (Operário Alpha)', role: Role.WORKER, locationId: 'loc-field-alpha', defaultDailyGoal: 20, jobTitle: 'Ajudante' },
  { id: 'u-worker-3', name: 'Ana (Operário Bravo)', role: Role.WORKER, locationId: 'loc-field-bravo', defaultDailyGoal: 15, jobTitle: 'Técnica de Campo' },
  { id: 'u-worker-4', name: 'Paulo (Operário Tete)', role: Role.WORKER, locationId: 'loc-field-charlie', defaultDailyGoal: 30, jobTitle: 'Operador de Máquina' },
  { id: 'u-worker-5', name: 'Ricardo (Operário Zambézia)', role: Role.WORKER, locationId: 'loc-field-delta', defaultDailyGoal: 25, jobTitle: 'Colhedor' },
  { id: 'u-worker-6', name: 'Beatriz (Operário Manica)', role: Role.WORKER, locationId: 'loc-field-echo', defaultDailyGoal: 18, jobTitle: 'Fiscal Florestal' },
];

export const ITEMS: Item[] = [
  { id: 'it-chainsaw', name: 'Motosserra Stihl MS 382', sku: 'EQ-001', category: 'Equipamento' },
  { id: 'it-helmet', name: 'Capacete de Segurança', sku: 'PPE-005', category: 'EPI' },
  { id: 'it-gloves', name: 'Luvas de Couro', sku: 'PPE-012', category: 'EPI' },
  { id: 'it-gps', name: 'GPS Garmin eTrex', sku: 'TEC-003', category: 'Tecnologia' },
  { id: 'it-boots', name: 'Botas de Segurança', sku: 'PPE-020', category: 'EPI' },
  { id: 'it-drone', name: 'Drone Mapeamento', sku: 'TEC-010', category: 'Tecnologia' },
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
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    logs: [
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        actorId: 'u-manager-nam',
        action: 'CREATE',
        message: 'Solicitação inicial de 5 motosserras.'
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
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    logs: []
  }
];

// Mock data: Yesterday's performance
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const INITIAL_PERFORMANCE: DailyPerformance[] = [
  {
    id: 'perf-001',
    workerId: 'u-worker-1',
    date: yesterday,
    status: AttendanceStatus.PRESENT,
    hoursWorked: 8,
    goalTarget: 20,
    goalAchieved: 22,
    score: 100, // Worked full time, exceeded goal. Max 100.
    notes: 'Excelente produtividade.'
  },
  {
    id: 'perf-002',
    workerId: 'u-worker-2',
    date: yesterday,
    status: AttendanceStatus.PARTIAL,
    hoursWorked: 4, // 50% time
    goalTarget: 20,
    goalAchieved: 10, // 50% goal
    score: 50, // Min(50%, 50%) = 50
    notes: 'Saiu mais cedo para consulta.'
  },
  {
    id: 'perf-003',
    workerId: 'u-worker-4',
    date: yesterday,
    status: AttendanceStatus.PRESENT,
    hoursWorked: 9, 
    goalTarget: 30,
    goalAchieved: 35,
    score: 100,
    notes: 'Operação em Tete normal.'
  }
];