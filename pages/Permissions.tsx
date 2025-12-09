
import React from 'react';
import { useLogistics } from '../context/useLogistics';
import { AVAILABLE_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from '../constants';
import { Role } from '../types';
import { Shield, Lock, Check, AlertTriangle } from 'lucide-react';

export const Permissions = () => {
  const { rolePermissions, togglePermission, hasPermission, isAdminOrGM } = useLogistics();

  // Group permissions by category
  const categories = Array.from(new Set(AVAILABLE_PERMISSIONS.map(p => p.category)));
  const roles = [Role.ADMIN, Role.GENERAL_MANAGER, Role.MANAGER, Role.WORKER];

  if (!isAdminOrGM) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <Lock size={64} className="mb-4 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-700">Acesso Negado</h2>
        <p>Você não tem permissão para gerenciar as configurações de acesso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-indigo-600" />
            Matriz de Permissões
          </h2>
          <p className="text-sm text-gray-500">Controle granular de acesso por cargo e funcionalidade.</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle size={14} />
          <span>Alterações entram em vigor imediatamente.</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider w-1/3">Funcionalidade / Permissão</th>
                {roles.map(role => (
                  <th key={role} className="p-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {role.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map(category => (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest border-y border-gray-200">
                      {category}
                    </td>
                  </tr>
                  
                  {/* Permissions Rows */}
                  {AVAILABLE_PERMISSIONS.filter(p => p.category === category).map(perm => (
                    <tr key={perm.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <p className="text-sm font-medium text-gray-800">{perm.label}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{perm.id}</p>
                      </td>
                      {roles.map(role => {
                         const isEnabled = rolePermissions[role]?.includes(perm.id);
                         // Disable editing for Admin's own Permission Management to prevent lockout
                         const isLocked = role === Role.ADMIN && perm.id === 'MANAGE_PERMISSIONS';
                         
                         return (
                          <td key={`${role}-${perm.id}`} className="p-4 text-center">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={isEnabled || isLocked}
                                disabled={isLocked}
                                onChange={() => togglePermission(role, perm.id)}
                              />
                              <div className={`w-11 h-6 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 transition-colors ${isEnabled || isLocked ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                                <div className={`absolute top-0.5 left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all ${isEnabled || isLocked ? 'translate-x-full border-white' : ''}`}></div>
                              </div>
                            </label>
                          </td>
                         );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
