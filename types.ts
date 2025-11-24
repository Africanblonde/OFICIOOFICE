export enum Role {
  ADMIN = 'ADMIN',       // Administração Central
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
  PRESENT = 'PRESENT',   // Presente Integral
  PARTIAL = 'PARTIAL',   // Presente Parcial (Atraso/Saída antecipada)
  ABSENT = 'ABSENT',     // Falta Injustificada
  EXCUSED = 'EXCUSED'    // Falta Justificada (Atestado)
}

export interface User {
  id: string;
  name: string;
  role: Role;
  locationId: string; // Creates the hierarchy link
  defaultDailyGoal?: number; // Meta padrão (ex: 20 árvores)
  jobTitle?: string; // Cargo (ex: Motosserrista)
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
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
  hoursWorked: number; // 0 to 24
  goalTarget: number;
  goalAchieved: number;
  score: number; // 0 to 100 percentage
  notes?: string;
}

export interface AIAnalysis {
  summary: string;
  risks: string[];
  optimizations: string[];
}