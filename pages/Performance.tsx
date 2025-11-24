import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { AttendanceStatus, DailyPerformance, Role, User, LocationType } from '../types';
import { Calendar, UserCheck, Calculator, AlertCircle, Save, TrendingDown, Users, Building, AlertTriangle } from 'lucide-react';

export const Performance = () => {
  const { currentUser, getWorkersByManager, getWorkersByLocation, performanceRecords, savePerformanceRecord, locations, selectedDepartmentId } = useLogistics();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeWorkerId, setActiveWorkerId] = useState<string | null>(null);

  // Local state for the form being edited
  const [formData, setFormData] = useState<{
    status: AttendanceStatus;
    hours: number;
    achieved: number;
    notes: string;
  }>({
    status: AttendanceStatus.PRESENT,
    hours: 8,
    achieved: 0,
    notes: ''
  });

  const getExistingRecord = (workerId: string) => {
    return performanceRecords.find(r => r.workerId === workerId && r.date === selectedDate);
  };

  // Logic: Min(Time%, Goal%)
  const calculateScore = (hours: number, achieved: number, target: number, status: AttendanceStatus) => {
    if (status === AttendanceStatus.ABSENT) return 0;
    if (status === AttendanceStatus.EXCUSED) return 0; // Or null? Treating as 0 for production but maybe different for HR.

    const standardDayHours = 8;
    const timePercent = Math.min((hours / standardDayHours) * 100, 100); // Cap at 100% time
    const goalPercent = target > 0 ? Math.min((achieved / target) * 100, 100) : 100; // Cap at 100% goal
    
    // The "Min" Logic requested
    return Math.floor(Math.min(timePercent, goalPercent));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 70) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  // --- ADMIN VIEW RENDERERS ---
  
  const renderAdminView = () => {
    // If selectedDepartmentId is active, only show that branch. Otherwise show all branches.
    const allBranches = locations.filter(l => l.type === LocationType.BRANCH);
    const branches = selectedDepartmentId 
      ? allBranches.filter(b => b.id === selectedDepartmentId) 
      : allBranches;
    
    // Aggregation Logic
    const branchStats = branches.map(branch => {
      // Safety check in case getWorkersByLocation returns something unexpected, though types enforce string
      const workers = getWorkersByLocation(branch.id) || [];
      const records = workers.map(w => ({
        worker: w,
        record: getExistingRecord(w.id)
      }));

      const presentCount = records.filter(r => r.record && (r.record.status === AttendanceStatus.PRESENT || r.record.status === AttendanceStatus.PARTIAL)).length;
      const totalScore = records.reduce((acc, curr) => acc + (curr.record?.score || 0), 0);
      const avgScore = workers.length > 0 ? Math.floor(totalScore / workers.length) : 0;
      
      const alerts = records.filter(r => {
        if (!r.record) return true; // Pending
        if (r.record.status === AttendanceStatus.ABSENT) return true;
        if (r.record.score < 50) return true;
        return false;
      });

      return {
        branch,
        workers,
        records,
        presentCount,
        avgScore,
        alerts
      };
    });

    const totalWorkers = branchStats.reduce((acc, curr) => acc + curr.workers.length, 0);
    const globalAvg = branchStats.length > 0 ? Math.floor(branchStats.reduce((acc, curr) => acc + curr.avgScore, 0) / branchStats.length) : 0;

    return (
      <div className="space-y-8">
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <p className="text-gray-500 text-sm font-medium">Média {selectedDepartmentId ? 'do Departamento' : 'Global'}</p>
             <div className="flex items-end gap-2 mt-1">
               <h3 className="text-3xl font-bold text-gray-900">{globalAvg}%</h3>
               <span className="text-xs text-green-600 font-bold mb-1">Hoje</span>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <p className="text-gray-500 text-sm font-medium">Equipes Monitoradas</p>
             <div className="flex items-end gap-2 mt-1">
               <h3 className="text-3xl font-bold text-gray-900">{branches.length}</h3>
               <span className="text-xs text-gray-400 mb-1">Departamentos</span>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <p className="text-gray-500 text-sm font-medium">Total de Trabalhadores</p>
             <div className="flex items-end gap-2 mt-1">
               <h3 className="text-3xl font-bold text-gray-900">{totalWorkers}</h3>
               <span className="text-xs text-gray-400 mb-1">Ativos</span>
             </div>
          </div>
        </div>

        {/* Alerts Section */}
        {branchStats.some(b => b.alerts.length > 0) && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-6">
            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-4">
              <AlertTriangle size={20} />
              Alertas de Produtividade e Presença
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchStats.flatMap(b => b.alerts.map((a, idx) => (
                <div key={`${b.branch.id}-${idx}`} className="bg-white p-3 rounded-lg shadow-sm border border-red-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase">{b.branch.name}</span>
                    <p className="font-semibold text-gray-800">{a.worker.name}</p>
                    <p className="text-xs text-red-600">
                      {!a.record ? 'Registro Pendente' : a.record.status === AttendanceStatus.ABSENT ? 'Falta Registrada' : `Baixa Produtividade (${a.record.score}%)`}
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <TrendingDown size={16} />
                  </div>
                </div>
              )))}
            </div>
          </div>
        )}

        {/* Department Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {branchStats.map(stat => (
            <div key={stat.branch.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg border border-gray-200">
                    <Building size={20} className="text-blue-600"/>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{stat.branch.name}</h4>
                    <p className="text-xs text-gray-500">{stat.workers.length} Trabalhadores</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(stat.avgScore)}`}>
                  Média: {stat.avgScore}%
                </div>
              </div>
              
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {stat.records.map(({ worker, record }) => (
                  <div key={worker.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${!record ? 'bg-gray-300' : record.status === AttendanceStatus.ABSENT ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{worker.name}</p>
                        <p className="text-xs text-gray-500">{worker.jobTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       {record ? (
                         <>
                           <span className={`text-xs font-bold px-2 py-0.5 rounded ${getScoreColor(record.score)}`}>{record.score}%</span>
                           <p className="text-[10px] text-gray-400 mt-0.5">{record.status === AttendanceStatus.ABSENT ? 'Falta' : `${record.goalAchieved}/${record.goalTarget}`}</p>
                         </>
                       ) : (
                         <span className="text-xs text-gray-400 italic">Pendente</span>
                       )}
                    </div>
                  </div>
                ))}
                {stat.workers.length === 0 && (
                  <div className="p-6 text-center text-gray-400 text-sm">Nenhum trabalhador alocado.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- MANAGER/WORKER LOGIC ---

  const handleEditWorker = (worker: User) => {
    setActiveWorkerId(worker.id);
    const existing = getExistingRecord(worker.id);
    if (existing) {
      setFormData({
        status: existing.status,
        hours: existing.hoursWorked,
        achieved: existing.goalAchieved,
        notes: existing.notes || ''
      });
    } else {
      setFormData({
        status: AttendanceStatus.PRESENT,
        hours: 8,
        achieved: 0, 
        notes: ''
      });
    }
  };

  const handleSave = (worker: User) => {
    const target = worker.defaultDailyGoal || 0;
    const score = calculateScore(formData.hours, formData.achieved, target, formData.status);

    const record: DailyPerformance = {
      id: getExistingRecord(worker.id)?.id || `perf-${Date.now()}-${worker.id}`,
      workerId: worker.id,
      date: selectedDate,
      status: formData.status,
      hoursWorked: formData.hours,
      goalTarget: target,
      goalAchieved: formData.achieved,
      score: score,
      notes: formData.notes
    };

    savePerformanceRecord(record);
    setActiveWorkerId(null);
  };

  // Main Render
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {currentUser.role === Role.ADMIN ? 'Controle de Produtividade Global' : 'Registro Diário de Produção'}
          </h2>
          <p className="text-sm text-gray-500">
            {currentUser.role === Role.ADMIN 
              ? 'Visão consolidada por departamento e alertas de desempenho.' 
              : `Equipe: ${locations.find(l => l.id === currentUser.locationId)?.name}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar size={18} className="text-gray-400" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-medium text-gray-700 outline-none"
          />
        </div>
      </div>

      {currentUser.role === Role.ADMIN ? renderAdminView() : (
        /* MANAGER VIEW */
        <div className="grid grid-cols-1 gap-4">
          {(getWorkersByManager(currentUser.id) || []).map(worker => {
            const record = getExistingRecord(worker.id);
            const isEditing = activeWorkerId === worker.id;
            const target = worker.defaultDailyGoal || 0;

            // Calculated on the fly for preview
            const previewScore = isEditing 
              ? calculateScore(formData.hours, formData.achieved, target, formData.status)
              : (record?.score || 0);

            return (
              <div key={worker.id} className={`bg-white rounded-xl border transition-all ${isEditing ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 shadow-sm hover:border-blue-300'}`}>
                <div className="p-4 flex flex-col md:flex-row items-center gap-4">
                  
                  {/* User Info */}
                  <div className="flex items-center gap-3 w-full md:w-1/4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{worker.name}</h4>
                      <p className="text-xs text-gray-500">{worker.jobTitle || 'Operário'}</p>
                    </div>
                  </div>

                  {/* Status & Input Area */}
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    
                    {isEditing ? (
                      <>
                        {/* Inputs when editing */}
                        <select 
                          className="p-2 border rounded bg-gray-50 text-sm w-full"
                          value={formData.status}
                          onChange={e => setFormData({...formData, status: e.target.value as AttendanceStatus})}
                        >
                          <option value={AttendanceStatus.PRESENT}>Presente (Integral)</option>
                          <option value={AttendanceStatus.PARTIAL}>Parcial / Atraso</option>
                          <option value={AttendanceStatus.ABSENT}>Falta Injustificada</option>
                          <option value={AttendanceStatus.EXCUSED}>Falta Justificada</option>
                        </select>

                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase text-gray-400 font-bold">Horas</label>
                          <input 
                            type="number" min="0" max="12"
                            className="p-1 border-b border-gray-300 focus:border-blue-500 outline-none text-sm"
                            value={formData.hours}
                            disabled={formData.status === AttendanceStatus.ABSENT || formData.status === AttendanceStatus.EXCUSED}
                            onChange={e => setFormData({...formData, hours: parseFloat(e.target.value)})}
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] uppercase text-gray-400 font-bold">Meta ({target})</label>
                          <input 
                            type="number" min="0"
                            className="p-1 border-b border-gray-300 focus:border-blue-500 outline-none text-sm font-semibold"
                            value={formData.achieved}
                            disabled={formData.status === AttendanceStatus.ABSENT}
                            onChange={e => setFormData({...formData, achieved: parseFloat(e.target.value)})}
                          />
                        </div>

                        {/* Preview Score */}
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase text-gray-400 font-bold">Nota do Dia</span>
                          <span className={`text-xl font-bold ${getScoreColor(previewScore).split(' ')[0]}`}>
                            {previewScore}%
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Read-only view */}
                        <div className="text-sm text-gray-600">
                          Status: <span className="font-medium">{record ? (record.status === AttendanceStatus.PRESENT ? 'Presente' : record.status === AttendanceStatus.ABSENT ? 'Falta' : 'Parcial') : '-'}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Horas: <span className="font-medium">{record?.hoursWorked || '-'}h</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Produção: <span className="font-medium">{record?.goalAchieved || '-'}</span> / <span className="text-gray-400">{target}</span>
                        </div>
                        <div className="">
                          {record ? (
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreColor(record.score)}`}>
                              {record.score}% Score
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Pendente</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-auto flex justify-end">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button onClick={() => setActiveWorkerId(null)} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
                        <button onClick={() => handleSave(worker)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
                          <Save size={14} /> Salvar
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditWorker(worker)}
                        className={`px-4 py-2 text-sm border rounded hover:bg-gray-50 transition ${record ? 'border-gray-300 text-gray-700' : 'border-blue-200 text-blue-600 bg-blue-50'}`}
                      >
                        {record ? 'Editar' : 'Registrar'}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Explanation of the logic */}
                {isEditing && formData.status !== AttendanceStatus.ABSENT && (
                  <div className="bg-slate-50 px-4 py-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                        <Calculator size={12} />
                        <span>Cálculo: Mínimo entre Tempo ({Math.floor((formData.hours/8)*100)}%) e Meta ({target > 0 ? Math.floor((formData.achieved/target)*100) : 100}%)</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(getWorkersByManager(currentUser.id) || []).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
              <UserCheck className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-gray-500">Nenhum trabalhador associado a esta localização.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};