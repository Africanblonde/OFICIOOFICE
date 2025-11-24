import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, Item, Location, InventoryRecord, Requisition, Role, RequestStatus, LocationType, LogEntry,
  DailyPerformance, AttendanceStatus
} from '../types';
import { USERS, ITEMS, LOCATIONS, INITIAL_INVENTORY, INITIAL_REQUISITIONS, INITIAL_PERFORMANCE } from '../constants';

interface LogisticsContextType {
  currentUser: User;
  items: Item[];
  locations: Location[];
  inventory: InventoryRecord[];
  requisitions: Requisition[];
  performanceRecords: DailyPerformance[];
  selectedDepartmentId: string | null; // For sidebar navigation filtering
  lastUpdated: Date;
  setCurrentUser: (user: User) => void;
  setSelectedDepartmentId: (id: string | null) => void;
  createRequisition: (itemId: string, qty: number) => void;
  updateRequisitionStatus: (reqId: string, newStatus: RequestStatus) => void;
  getInventoryByLocation: (locationId: string) => InventoryRecord[];
  getItemName: (itemId: string) => string;
  getLocationName: (locationId: string) => string;
  savePerformanceRecord: (record: DailyPerformance) => void;
  getWorkersByManager: (managerId: string) => User[];
  getWorkersByLocation: (locationId: string) => User[];
  refreshData: () => void; // Manual refresh trigger
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(USERS[0]); // Default to Admin
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [items] = useState<Item[]>(ITEMS);
  const [locations] = useState<Location[]>(LOCATIONS);
  const [inventory, setInventory] = useState<InventoryRecord[]>(INITIAL_INVENTORY);
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQUISITIONS);
  const [performanceRecords, setPerformanceRecords] = useState<DailyPerformance[]>(INITIAL_PERFORMANCE);

  // --- AUTO REFRESH LOGIC (20 MINUTES) ---
  const REFRESH_INTERVAL = 20 * 60 * 1000; // 20 minutes in milliseconds

  const refreshData = () => {
    console.log("Sincronizando dados com o servidor...");
    // In a real app, this would be: await fetch('/api/data');
    
    // --- SIMULATION FOR DEMO ---
    // Simulating an external change coming from the server (e.g., another manager created a request)
    const randomItem = items[Math.floor(Math.random() * items.length)];
    const randomLoc = locations.filter(l => l.type === LocationType.BRANCH)[0];
    
    const simulatedExternalReq: Requisition = {
      id: `req-ext-${Date.now()}`,
      requesterId: 'u-manager-simulated',
      sourceLocationId: 'loc-central',
      targetLocationId: randomLoc.id,
      itemId: randomItem.id,
      quantity: Math.floor(Math.random() * 5) + 1,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [{
        timestamp: new Date().toISOString(),
        actorId: 'system',
        action: 'SYNC',
        message: 'Recebido via sincronização automática (Outro Gerente)'
      }]
    };

    // Only add simulation occasionally or on manual refresh to show it works
    setRequisitions(prev => [simulatedExternalReq, ...prev]);
    // ---------------------------

    setLastUpdated(new Date());
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Helper to find parent location for requests
  const getSourceLocation = (targetLocId: string): string => {
    const target = locations.find(l => l.id === targetLocId);
    if (!target?.parentId) return 'loc-central'; // Default fallback
    return target.parentId;
  };

  const createRequisition = (itemId: string, quantity: number) => {
    const sourceId = getSourceLocation(currentUser.locationId);
    
    const newReq: Requisition = {
      id: `req-${Date.now()}`,
      requesterId: currentUser.id,
      sourceLocationId: sourceId,
      targetLocationId: currentUser.locationId,
      itemId,
      quantity,
      status: RequestStatus.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: [{
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        action: 'CREATE',
        message: `Solicitação criada por ${currentUser.name}`
      }]
    };
    setRequisitions(prev => [newReq, ...prev]);
  };

  const updateInventory = (locationId: string, itemId: string, delta: number) => {
    setInventory(prev => {
      const existing = prev.find(i => i.locationId === locationId && i.itemId === itemId);
      if (existing) {
        return prev.map(i => i.locationId === locationId && i.itemId === itemId 
          ? { ...i, quantity: i.quantity + delta } 
          : i
        );
      } else {
        // Create new record if positive delta
        if (delta > 0) {
          return [...prev, { locationId, itemId, quantity: delta }];
        }
        return prev;
      }
    });
  };

  const updateRequisitionStatus = (reqId: string, newStatus: RequestStatus) => {
    setRequisitions(prev => prev.map(req => {
      if (req.id !== reqId) return req;

      const log: LogEntry = {
        timestamp: new Date().toISOString(),
        actorId: currentUser.id,
        action: 'STATUS_CHANGE',
        message: `Status alterado de ${req.status} para ${newStatus} por ${currentUser.name}`
      };

      // Handle inventory movements based on status change
      if (req.status === RequestStatus.PENDING && newStatus === RequestStatus.APPROVED) {
          // Just administrative approval
      } else if (req.status === RequestStatus.APPROVED && newStatus === RequestStatus.IN_TRANSIT) {
         updateInventory(req.sourceLocationId, req.itemId, -req.quantity);
      } else if (req.status === RequestStatus.IN_TRANSIT && newStatus === RequestStatus.DELIVERED) {
         updateInventory(req.targetLocationId, req.itemId, req.quantity);
      }

      return {
        ...req,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        logs: [...req.logs, log]
      };
    }));
  };

  const savePerformanceRecord = (record: DailyPerformance) => {
    setPerformanceRecords(prev => {
      const exists = prev.findIndex(r => r.workerId === record.workerId && r.date === record.date);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = record;
        return updated;
      }
      return [...prev, record];
    });
  };

  const getWorkersByManager = (managerId: string) => {
    const manager = USERS.find(u => u.id === managerId);
    if (!manager) return [];

    // Find all child locations of the manager's location
    const childLocations = locations.filter(l => l.parentId === manager.locationId).map(l => l.id);
    
    // Include manager's own location if they have workers directly there
    const relevantLocations = [manager.locationId, ...childLocations];

    return USERS.filter(u => u.role === Role.WORKER && relevantLocations.includes(u.locationId));
  };

  const getWorkersByLocation = (locationId: string) => {
    // Find location and its direct children (assuming 1 level depth for now for simplicity, or recursive if needed)
    // For this app structure: Central -> Branch -> Field
    // If location is Branch, we want Branch + Field children
    
    const childLocations = locations.filter(l => l.parentId === locationId).map(l => l.id);
    const relevantLocations = [locationId, ...childLocations];
    
    return USERS.filter(u => u.role === Role.WORKER && relevantLocations.includes(u.locationId));
  };

  const getInventoryByLocation = (locationId: string) => {
    return inventory.filter(i => i.locationId === locationId);
  };

  const getItemName = (id: string) => items.find(i => i.id === id)?.name || id;
  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || id;

  return (
    <LogisticsContext.Provider value={{
      currentUser,
      items,
      locations,
      inventory,
      requisitions,
      performanceRecords,
      selectedDepartmentId,
      lastUpdated,
      setCurrentUser,
      setSelectedDepartmentId,
      createRequisition,
      updateRequisitionStatus,
      getInventoryByLocation,
      getItemName,
      getLocationName,
      savePerformanceRecord,
      getWorkersByManager,
      getWorkersByLocation,
      refreshData
    }}>
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) throw new Error("useLogistics must be used within LogisticsProvider");
  return context;
};
