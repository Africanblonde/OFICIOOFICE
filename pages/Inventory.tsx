import React, { useState, useEffect } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { MapPin } from 'lucide-react';

export const Inventory = () => {
  const { locations, items, inventory, currentUser, getItemName, selectedDepartmentId } = useLogistics();
  const [filterLoc, setFilterLoc] = useState(selectedDepartmentId || currentUser.locationId);

  // Update internal filter if selectedDepartmentId changes (via sidebar)
  useEffect(() => {
    if (selectedDepartmentId) {
      setFilterLoc(selectedDepartmentId);
    } else if (currentUser.role !== 'ADMIN') {
        setFilterLoc(currentUser.locationId);
    } else {
        setFilterLoc('all');
    }
  }, [selectedDepartmentId, currentUser]);

  // Group inventory by location for easy display
  const filteredInventory = inventory.filter(inv => {
    if (filterLoc === 'all') return true;
    return inv.locationId === filterLoc;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Controle de Estoque</h2>
           <p className="text-sm text-gray-500">Visualização de ativos por localidade.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <MapPin size={18} className="text-gray-400 ml-2" />
          <select 
            value={filterLoc} 
            onChange={(e) => setFilterLoc(e.target.value)}
            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none pr-4"
          >
            <option value="all">Todas as Localizações</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map((record, idx) => {
            const item = items.find(i => i.id === record.itemId);
            const location = locations.find(l => l.id === record.locationId);
            
            return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                             <span className="text-xs font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">{item?.category}</span>
                             <span className="text-xs text-gray-400">{item?.sku}</span>
                        </div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{item?.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> {location?.name}
                        </p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-end justify-between">
                         <div className="text-xs text-gray-400">Quantidade Disponível</div>
                         <div className={`text-2xl font-bold ${record.quantity < 5 ? 'text-red-500' : 'text-gray-900'}`}>
                             {record.quantity}
                         </div>
                    </div>
                </div>
            );
        })}
        
        {filteredInventory.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                Nenhum item encontrado nesta localização.
            </div>
        )}
      </div>
    </div>
  );
};