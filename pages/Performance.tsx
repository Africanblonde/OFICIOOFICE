import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/useLogistics';
import { AttendanceStatus, DailyPerformance, Role, User, LocationType } from '../types';
import {
    Calendar, UserCheck, Calculator, AlertCircle, Save, TrendingDown,
    Users, Building, AlertTriangle, UserX, CheckCircle, Clock, XCircle,
    BarChart2, FileText, Filter, Download, Lock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

export const Performance = () => {
    const { currentUser, getWorkersByManager, getWorkersByLocation, performanceRecords, savePerformanceRecord, locations, selectedDepartmentId, allUsers, isAdminOrGM } = useLogistics();

    // Tabs: 'register' (Diário) vs 'report' (Relatório Geral)
    const [activeTab, setActiveTab] = useState<'register' | 'report'>('register');

    // --- REGISTER STATE ---
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeWorkerId, setActiveWorkerId] = useState<string | null>(null);
    const [formData, setFormData] = useState<{
        status: AttendanceStatus;
        production: number;
        notes: string;
    }>({
        status: AttendanceStatus.FULL_DAY,
        production: 0,
        notes: ''
    });

    // --- REPORT STATE ---
    const [reportStartDate, setReportStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // First day of current month
        return d.toISOString().split('T')[0];
    });
    const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);

    // =================================================================================
    //  HELPER FUNCTIONS
    // =================================================================================

    const getExistingRecord = (workerId: string, date: string = selectedDate) => {
        return performanceRecords.find(r => r.workerId === workerId && r.date === date);
    };

    const getStatusLabel = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.FULL_DAY: return 'D';
            case AttendanceStatus.HALF_DAY: return 'D/2';
            case AttendanceStatus.ABSENT: return 'F';
            default: return status;
        }
    };

    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.FULL_DAY: return 'text-green-600 bg-green-50 border-green-200';
            case AttendanceStatus.HALF_DAY: return 'text-orange-600 bg-orange-50 border-orange-200';
            case AttendanceStatus.ABSENT: return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600';
        }
    };

    // =================================================================================
    //  LOGIC: DAILY REGISTRATION
    // =================================================================================

    const handleEditWorker = (worker: User) => {
        // Security Check: If record exists and NOT Admin/GM, prevent editing
        const existing = getExistingRecord(worker.id);
        if (existing && !isAdminOrGM) {
            alert("Apenas Administradores podem alterar registros já submetidos.");
            return;
        }

        setActiveWorkerId(worker.id);
        if (existing) {
            setFormData({
                status: existing.status,
                production: existing.production,
                notes: existing.notes || ''
            });
        } else {
            setFormData({
                status: AttendanceStatus.FULL_DAY,
                production: worker.defaultDailyGoal || 0,
                notes: ''
            });
        }
    };

    const handleQuickExcuse = (worker: User) => {
        const existing = getExistingRecord(worker.id);
        if (existing && !isAdminOrGM) return; // Prevent overwriting if already exists

        if (!confirm(`Confirmar "Falta" (F) para ${worker.name} na data ${selectedDate}?`)) return;
        const record: DailyPerformance = {
            id: existing?.id || `perf-${Date.now()}-${worker.id}`,
            workerId: worker.id,
            date: selectedDate,
            status: AttendanceStatus.ABSENT,
            production: 0,
            notes: 'Falta Registrada (Rápido)'
        };
        savePerformanceRecord(record);
    };

    const handleSave = (worker: User) => {
        const existing = getExistingRecord(worker.id);
        const record: DailyPerformance = {
            id: existing?.id || `perf-${Date.now()}-${worker.id}`,
            workerId: worker.id,
            date: selectedDate,
            status: formData.status,
            production: formData.status === AttendanceStatus.ABSENT ? 0 : formData.production,
            notes: formData.notes
        };
        savePerformanceRecord(record);
        setActiveWorkerId(null);
    };

    const renderDailyRegistration = () => {
        // Determine which workers to show
        let workersToShow: User[] = [];
        if (currentUser?.role === Role.ADMIN) {
            // Admin sees selected department or all
            const allWorkers = allUsers.filter(u => u.role === Role.WORKER);
            if (selectedDepartmentId) {
                // Get location hierarchy
                const subLocs = locations.filter(l => l.parentId === selectedDepartmentId).map(l => l.id);
                const validLocs = [selectedDepartmentId, ...subLocs];
                workersToShow = allWorkers.filter(w => w.locationId && validLocs.includes(w.locationId));
            } else {
                workersToShow = allWorkers;
            }
        } else {
            // Manager sees their workers
            workersToShow = currentUser ? getWorkersByManager(currentUser.id) : [];
        }

        // Sort by name
        workersToShow.sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Lock size={14} /> Registros salvos só podem ser alterados pela Administração.
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="text-sm font-medium text-gray-700 outline-none bg-white"
                        />
                    </div>
                </div>

                {workersToShow.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                        <Users size={48} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum trabalhador encontrado para o filtro atual.</p>
                    </div>
                ) : (
                    workersToShow.map(worker => {
                        const record = getExistingRecord(worker.id);
                        const isEditing = activeWorkerId === worker.id;
                        const target = worker.defaultDailyGoal || 0;

                        // Logic for disabling edit
                        const isLocked = !!record && !isAdminOrGM;

                        return (
                            <div key={worker.id} className={`bg-white rounded-xl border transition-all ${isEditing ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-gray-200 shadow-sm hover:border-blue-300'}`}>
                                <div className="p-4 flex flex-col md:flex-row items-center gap-4">
                                    {/* User Info */}
                                    <div className="flex items-center gap-3 w-full md:w-1/4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                            {worker.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{worker.name}</h4>
                                            <p className="text-xs text-gray-500">{worker.jobTitle || 'Operário'}</p>
                                        </div>
                                    </div>

                                    {/* Status & Input Area */}
                                    <div className="flex-1 w-full">
                                        {isEditing ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex gap-2">
                                                    {[AttendanceStatus.FULL_DAY, AttendanceStatus.HALF_DAY, AttendanceStatus.ABSENT].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setFormData({ ...formData, status: s as AttendanceStatus })}
                                                            className={`flex-1 py-2 px-3 rounded border text-sm font-bold transition-all ${formData.status === s
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {getStatusLabel(s)}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] uppercase text-gray-400 font-bold mb-1 block">Produção</label>
                                                        <input
                                                            type="number" min="0"
                                                            disabled={formData.status === AttendanceStatus.ABSENT}
                                                            className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm font-semibold disabled:bg-gray-100 disabled:text-gray-400 bg-white text-gray-900"
                                                            value={formData.production}
                                                            onChange={e => setFormData({ ...formData, production: parseFloat(e.target.value) })}
                                                        />
                                                    </div>
                                                    <div className="text-xs text-gray-400 pt-5">Meta: {target}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between md:justify-around w-full">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Estado</span>
                                                    <span className={`px-3 py-1 rounded text-sm font-bold border mt-1 ${record ? getStatusColor(record.status) : 'bg-gray-100 text-gray-400'}`}>
                                                        {record ? getStatusLabel(record.status) : '-'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">Produção</span>
                                                    <div className="mt-1 flex items-baseline gap-1">
                                                        <span className="text-lg font-bold text-gray-900">{record ? record.production : '-'}</span>
                                                        <span className="text-xs text-gray-400">/ {target}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="w-full md:w-auto flex justify-end gap-2 mt-2 md:mt-0">
                                        {isEditing ? (
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <button onClick={() => setActiveWorkerId(null)} className="flex-1 md:flex-none px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded border border-gray-200">Cancelar</button>
                                                <button onClick={() => handleSave(worker)} className="flex-1 md:flex-none px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2">
                                                    <Save size={14} /> Salvar
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {!isLocked && (
                                                    <button onClick={() => handleQuickExcuse(worker)} className="px-3 py-2 text-sm border border-red-200 text-red-700 bg-red-50 rounded hover:bg-red-100 transition flex items-center gap-1" title="Registrar Falta">
                                                        <XCircle size={14} /> <span className="hidden sm:inline">Falta</span>
                                                    </button>
                                                )}

                                                {isLocked ? (
                                                    <button disabled className="px-4 py-2 text-sm border border-gray-100 bg-gray-50 text-gray-400 rounded flex items-center gap-2 cursor-not-allowed">
                                                        <Lock size={12} /> Registrado
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleEditWorker(worker)} className={`px-4 py-2 text-sm border rounded hover:bg-gray-50 transition ${record ? 'border-gray-300 text-gray-700' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>
                                                        {record ? 'Editar' : 'Registrar'}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

    // =================================================================================
    //  LOGIC: GENERAL REPORT
    // =================================================================================

    const generateReportData = useMemo(() => {
        // 1. Filter Workers based on role/location
        const allWorkers = allUsers.filter(u => u.role === Role.WORKER);
        let workersToReport = allWorkers;

        if (!currentUser || currentUser.role !== Role.ADMIN) {
            // Managers only see their sub-hierarchy
            const managerLocs = [currentUser?.locationId || '', ...locations.filter(l => l.parentId === currentUser?.locationId).map(l => l.id)];
            workersToReport = allWorkers.filter(w => w.locationId && managerLocs.includes(w.locationId));
        } else if (selectedDepartmentId) {
            // Admin with filter
            const subLocs = locations.filter(l => l.parentId === selectedDepartmentId).map(l => l.id);
            const validLocs = [selectedDepartmentId, ...subLocs];
            workersToReport = allWorkers.filter(w => w.locationId && validLocs.includes(w.locationId));
        }

        // 2. Aggregate Data per Worker
        const report = workersToReport.map(worker => {
            // Filter records within date range
            const records = performanceRecords.filter(r =>
                r.workerId === worker.id &&
                r.date >= reportStartDate &&
                r.date <= reportEndDate
            );

            const dCount = records.filter(r => r.status === AttendanceStatus.FULL_DAY).length;
            const halfCount = records.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
            const fCount = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
            const totalProduction = records.reduce((acc, curr) => acc + (curr.production || 0), 0);

            // Days worked (D + D/2)
            const effectiveDays = dCount + halfCount; // Counting actual presence days for average
            const avgProduction = effectiveDays > 0 ? (totalProduction / effectiveDays).toFixed(1) : '0';

            const locationName = locations.find(l => l.id === worker.locationId)?.name || 'N/A';

            return {
                worker,
                locationName,
                dCount,
                halfCount,
                fCount,
                totalProduction,
                avgProduction: parseFloat(avgProduction)
            };
        });

        // 3. Calculate Global Stats
        const globalTotalProduction = report.reduce((acc, curr) => acc + curr.totalProduction, 0);
        const globalAbsences = report.reduce((acc, curr) => acc + curr.fCount, 0);
        const globalD = report.reduce((acc, curr) => acc + curr.dCount, 0);
        const globalHalf = report.reduce((acc, curr) => acc + curr.halfCount, 0);

        return {
            rows: report,
            globalTotalProduction,
            globalAbsences,
            globalD,
            globalHalf,
            totalWorkers: report.length
        };

    }, [allUsers, performanceRecords, locations, currentUser, selectedDepartmentId, reportStartDate, reportEndDate]);


    const renderGeneralReport = () => {
        const { rows, globalTotalProduction, globalAbsences, globalD, globalHalf } = generateReportData;

        // Charts Data
        const topWorkers = [...rows].sort((a, b) => b.totalProduction - a.totalProduction).slice(0, 5);
        const attendanceData = [
            { name: 'Dias Completos (D)', value: globalD, color: '#22c55e' },
            { name: 'Meios Dias (D/2)', value: globalHalf, color: '#f97316' },
            { name: 'Faltas (F)', value: globalAbsences, color: '#ef4444' },
        ].filter(d => d.value > 0);

        return (
            <div className="space-y-6">
                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Filter size={18} />
                        <span className="font-semibold text-sm">Filtro de Período:</span>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">De</span>
                            <input
                                type="date"
                                value={reportStartDate}
                                onChange={(e) => setReportStartDate(e.target.value)}
                                className="border rounded px-2 py-1 text-sm bg-gray-50 text-gray-900 focus:outline-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Até</span>
                            <input
                                type="date"
                                value={reportEndDate}
                                onChange={(e) => setReportEndDate(e.target.value)}
                                className="border rounded px-2 py-1 text-sm bg-gray-50 text-gray-900 focus:outline-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Global Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Produção Total</p>
                        <h3 className="text-3xl font-bold text-blue-600 mt-1">{globalTotalProduction}</h3>
                        <p className="text-xs text-gray-500 mt-1">Árvores no período</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Total de Faltas</p>
                        <h3 className="text-3xl font-bold text-red-600 mt-1">{globalAbsences}</h3>
                        <p className="text-xs text-gray-500 mt-1">Ocorrências 'F'</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Assiduidade Total</p>
                        <h3 className="text-3xl font-bold text-green-600 mt-1">{globalD + globalHalf}</h3>
                        <p className="text-xs text-gray-500 mt-1">Dias trabalhados (D + D/2)</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-xs font-bold text-gray-400 uppercase">Média Geral</p>
                        <h3 className="text-3xl font-bold text-gray-800 mt-1">
                            {(globalTotalProduction / (globalD + globalHalf || 1)).toFixed(1)}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Árvores / Dia Trabalhado</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Workers Chart */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <TrendingDown className="rotate-180 text-green-600" /> Top 5 Produtores
                        </h4>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={topWorkers} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="worker.name" width={100} tick={{ fontSize: 10 }} />
                                <ReTooltip />
                                <Bar dataKey="totalProduction" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                    {topWorkers.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Attendance Distribution */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col">
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <UserCheck className="text-purple-600" /> Distribuição de Presença
                        </h4>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={attendanceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {attendanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <ReTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText size={18} /> Detalhe por Funcionário
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-xs text-gray-500 uppercase font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Funcionário</th>
                                    <th className="px-6 py-4">Localização</th>
                                    <th className="px-6 py-4 text-center text-green-700 bg-green-50/50">D (Dias)</th>
                                    <th className="px-6 py-4 text-center text-orange-700 bg-orange-50/50">D/2 (Meios)</th>
                                    <th className="px-6 py-4 text-center text-red-700 bg-red-50/50">F (Faltas)</th>
                                    <th className="px-6 py-4 text-right">Total Produção</th>
                                    <th className="px-6 py-4 text-right">Média / Dia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">Nenhum dado no período.</td></tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr key={row.worker.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-medium text-gray-900">{row.worker.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.locationName}</td>
                                            <td className="px-6 py-4 text-center font-bold text-green-700 bg-green-50/30">{row.dCount}</td>
                                            <td className="px-6 py-4 text-center font-bold text-orange-700 bg-orange-50/30">{row.halfCount}</td>
                                            <td className="px-6 py-4 text-center font-bold text-red-700 bg-red-50/30">{row.fCount}</td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-700">{row.totalProduction}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{row.avgProduction}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="space-y-6">
            {/* HEADER & TABS */}
            <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-gray-200 pb-2">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Desempenho Operacional</h2>
                    <p className="text-sm text-gray-500">
                        Controle de produção florestal e assiduidade.
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('register')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <CheckCircle size={16} />
                            Registo Diário
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'report' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <BarChart2 size={16} />
                            Relatório Geral
                        </div>
                    </button>
                </div>
            </div>

            {/* CONTENT RENDERER */}
            {activeTab === 'register' ? renderDailyRegistration() : renderGeneralReport()}
        </div>
    );
};