import React, { useState, useMemo } from 'react';
import { useLogistics } from '../context/useLogistics';
import { Role, User, AttendanceStatus, DailyPerformance, FichaIndividual } from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';
import {
    UserPlus, Users, Briefcase, MapPin, Search, X,
    Calendar, DollarSign, TrendingUp, Clock, Settings, FileText,
    ChevronRight, User as UserIcon, CheckCircle, AlertTriangle, Save, Lock, Trash2, Plus
} from 'lucide-react';

export const HumanResources = () => {
    const { allUsers, locations, addUser, updateUser, deleteUser, performanceRecords, savePerformanceRecord, payrollParams, updatePayrollParams, isAdminOrGM, createFicha, items, inventory, fichasIndividuais } = useLogistics();
    const [searchTerm, setSearchTerm] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'summary' | 'history' | 'daily' | 'financial' | 'settings' | 'fichas' | 'entregas'>('summary');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // New User Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: Role.WORKER,
        locationId: null as string | null,
        jobTitle: '',
        defaultDailyGoal: 10,
        dailyRate: 236.5,
        halfDayRate: 118,
        absencePenalty: 95,
        bonusPerUnit: 10
    });

    // Settings Form State (Inside Modal)
    const [settingsData, setSettingsData] = useState<Partial<User>>({});

    // Daily Tab Form State
    const [newRecordData, setNewRecordData] = useState({
        date: new Date().toISOString().split('T')[0],
        status: AttendanceStatus.FULL_DAY,
        production: 0,
        notes: ''
    });
    const [isAddingRecord, setIsAddingRecord] = useState(false);

    const filteredUsers = allUsers.filter((u: User) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.locationId) {
            setStatus({ type: 'info', message: 'Selecione um departamento/localização.' });
            return;
        }

        try {
            const newUserPayload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                locationId: formData.locationId || undefined,
                jobTitle: formData.jobTitle,
                defaultDailyGoal: formData.role === Role.WORKER ? formData.defaultDailyGoal : undefined,
                dailyRate: formData.role === Role.WORKER ? formData.dailyRate : undefined,
                halfDayRate: formData.role === Role.WORKER ? formData.halfDayRate : undefined,
                absencePenalty: formData.role === Role.WORKER ? formData.absencePenalty : undefined,
                bonusPerUnit: formData.role === Role.WORKER ? formData.bonusPerUnit : undefined,
            };

            await addUser(newUserPayload);

            setStatus({ type: 'success', message: 'Funcionário adicionado com sucesso!' });
            setTimeout(() => setStatus(null), 3000);

            // Reset form
            setFormData({
                name: '',
                email: '',
                password: '',
                role: Role.WORKER,
                locationId: null,
                jobTitle: '',
                defaultDailyGoal: 10,
                dailyRate: 236.5,
                halfDayRate: 118,
                absencePenalty: 95,
                bonusPerUnit: 10
            });
        } catch (error) {
            setStatus({ type: 'error', message: `Erro ao adicionar funcionário: ${error instanceof Error ? error.message : String(error)}` });
        }
    };

    const handleOpenModal = (user: User) => {
        setSelectedUser(user);
        setActiveModalTab('summary');
        setSettingsData({
            defaultDailyGoal: user.defaultDailyGoal,
            dailyRate: user.dailyRate,
            halfDayRate: user.halfDayRate,
            absencePenalty: user.absencePenalty,
            bonusPerUnit: user.bonusPerUnit,
            role: user.role,
            jobTitle: user.jobTitle
        });

        // Setup initial production goal for Daily Record form
        setNewRecordData(prev => ({ ...prev, production: user.defaultDailyGoal || 0 }));
        setIsAddingRecord(false);
    };

    const handleSaveSettings = () => {
        if (!isAdminOrGM) return;
        if (selectedUser) {
            const updated = { ...selectedUser, ...settingsData };
            updateUser(updated);
            setSelectedUser(updated); // Update local modal state
            setStatus({ type: 'success', message: 'Configurações atualizadas com sucesso!' });
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const handleDeleteUser = (user: User) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        await deleteUser(userToDelete.id);
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
        setSelectedUser(null); // Close the modal
    };

    // --- MODAL COMPONENTS ---

    // --- DELIVERY HISTORY STATE ---
    const [deliveryHistory, setDeliveryHistory] = React.useState<any[]>([]);
    const [loadingDeliveries, setLoadingDeliveries] = React.useState(false);
    React.useEffect(() => {
        if (selectedUser && activeModalTab === 'entregas') {
            setLoadingDeliveries(true);
            import('../services/employeeDeliveryService').then(({ getEmployeeDeliveries }) => {
                getEmployeeDeliveries(selectedUser.id)
                    .then(setDeliveryHistory)
                    .catch(() => setDeliveryHistory([]))
                    .finally(() => setLoadingDeliveries(false));
            });
        }
    }, [selectedUser, activeModalTab]);

    const renderModalContent = () => {
        if (!selectedUser) return null;
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Filter records for this user
        const userRecords = performanceRecords.filter((r: DailyPerformance) => r.workerId === selectedUser.id);
        const currentMonthRecords = userRecords.filter(r => r.date.startsWith(currentMonth));

        // Stats Calculation
        const fullDays = currentMonthRecords.filter(r => r.status === AttendanceStatus.FULL_DAY).length;
        const halfDays = currentMonthRecords.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
        const absences = currentMonthRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
        const realProduction = currentMonthRecords.reduce((acc: number, curr: DailyPerformance) => acc + (curr.production || 0), 0);
        const effectiveDays = fullDays + (halfDays * 0.5);
        const target = effectiveDays * (selectedUser.defaultDailyGoal || 0);

        // Estimate Salary (Simplified)
        const base = (fullDays * (selectedUser.dailyRate || 0)) + (halfDays * (selectedUser.halfDayRate || 0));
        const bonus = Math.max(0, realProduction - target) * (selectedUser.bonusPerUnit || 0);
        const penalty = absences * (selectedUser.absencePenalty || 0);
        const net = base + bonus - penalty;

        // --- TAB: SUMMARY ---
        if (activeModalTab === 'summary') {
            return (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Clock size={18} className="text-blue-500" /> Este Mês ({currentMonth})
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 text-sm">Dias Trabalhados</span>
                                    <span className="font-bold text-gray-800">{fullDays} <span className="text-xs font-normal text-gray-400">({halfDays} meios)</span></span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 text-sm">Produção Real</span>
                                    <span className={`font-bold ${realProduction >= target ? 'text-green-600' : 'text-orange-500'}`}>
                                        {realProduction} <span className="text-xs text-gray-400">/ {target} meta</span>
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Faltas</span>
                                    <span className="font-bold text-red-500">{absences}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <DollarSign size={18} className="text-green-500" /> Salário Previsto
                            </h4>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 text-sm">Base Calculada</span>
                                    <span className="font-medium text-gray-800">{base.toFixed(2)} MT</span>
                                </div>
                                <div className="flex justify-between border-b border-gray-50 pb-2">
                                    <span className="text-gray-500 text-sm">Bónus Produtividade</span>
                                    <span className="font-medium text-blue-600">+{bonus.toFixed(2)} MT</span>
                                </div>
                                <div className="flex justify-between pt-1">
                                    <span className="text-gray-800 font-bold text-sm">Líquido Estimado</span>
                                    <span className="font-bold text-green-700 text-lg">{net.toFixed(2)} MT</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <TrendingUp className="text-blue-600 mt-1" size={20} />
                        <div>
                            <h5 className="font-bold text-blue-800">Análise de Eficiência</h5>
                            <p className="text-sm text-blue-700 mt-1">
                                O funcionário está com uma eficiência de <strong>{target > 0 ? ((realProduction / target) * 100).toFixed(0) : 0}%</strong> este mês.
                                {realProduction > target
                                    ? " Excelente desempenho, acima da meta estabelecida."
                                    : " Atenção: Produção abaixo do esperado para os dias trabalhados."}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // --- TAB: HISTORY ---
        if (activeModalTab === 'history') {
            // Group records by Month
            const history: Record<string, { d: number, h: number, f: number, prod: number }> = {};

            userRecords.forEach(r => {
                const month = r.date.slice(0, 7);
                if (!history[month]) history[month] = { d: 0, h: 0, f: 0, prod: 0 };

                if (r.status === AttendanceStatus.FULL_DAY) history[month].d++;
                if (r.status === AttendanceStatus.HALF_DAY) history[month].h++;
                if (r.status === AttendanceStatus.ABSENT) history[month].f++;
                history[month].prod += (r.production || 0);
            });

            const months = Object.keys(history).sort().reverse();

            return (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Mês/Ano</th>
                                <th className="px-4 py-3 text-center">Dias (D)</th>
                                <th className="px-4 py-3 text-center">Faltas</th>
                                <th className="px-4 py-3 text-right">Produção</th>
                                <th className="px-4 py-3 text-right">Eficiência</th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {months.map(month => {
                                const h = history[month];
                                const isPast = true; // logic could check against current month
                                return (
                                    <tr key={month} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium">{month}</td>
                                        <td className="px-4 py-3 text-center">{h.d}</td>
                                        <td className="px-4 py-3 text-center">{h.f}</td>
                                        <td className="px-4 py-3 text-right">{h.prod.toFixed(0)}</td>
                                        <td className="px-4 py-3 text-right">{((h.prod / (h.d + h.h + h.f)) || 0).toFixed(1)} un/dia</td>
                                        <td className="px-4 py-3 text-center">
                                            {isPast ? <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Fechado</span> : <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Aberto</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            );
        }

        // --- TAB: DAILY ---
        if (activeModalTab === 'daily') {
            const sortedRecords = [...userRecords].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

            const handleAddDailyRecord = async () => {
                if (!selectedUser) return;
                try {
                    await savePerformanceRecord({
                        id: crypto.randomUUID(), // Temp ID
                        workerId: selectedUser.id,
                        date: newRecordData.date,
                        status: newRecordData.status,
                        production: Number(newRecordData.production),
                        notes: newRecordData.notes
                    });
                    setStatus({ type: 'success', message: 'Registo diário salvo com sucesso!' });
                    setIsAddingRecord(false);
                    setTimeout(() => setStatus(null), 3000);
                } catch (e: any) {
                    setStatus({ type: 'error', message: `Erro ao salvar: ${e.message}` });
                }
            };
            return (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <h4 className="font-bold text-blue-800">Registo Diário</h4>
                            <p className="text-xs text-blue-600">Histórico de presenças e produção de {selectedUser.name}</p>
                        </div>
                        <button
                            onClick={() => setIsAddingRecord(!isAddingRecord)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded text-sm flex items-center gap-1 transition-colors"
                        >
                            {isAddingRecord ? <X size={16} /> : <Plus size={16} />}
                            {isAddingRecord ? 'Cancelar' : 'Novo Registo'}
                        </button>
                    </div>

                    {isAddingRecord && (
                        <div className="bg-white border text-sm border-blue-200 p-4 rounded-xl shadow-sm mb-4">
                            <h5 className="font-bold text-gray-700 mb-3">Lançar Registo ({formatFlexibleDate(newRecordData.date)})</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Data</label>
                                    <input type="date" className="w-full border rounded p-2" value={newRecordData.date} onChange={e => setNewRecordData({ ...newRecordData, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Presença</label>
                                    <select className="w-full border rounded p-2" value={newRecordData.status} onChange={e => setNewRecordData({ ...newRecordData, status: e.target.value as AttendanceStatus })}>
                                        <option value={AttendanceStatus.FULL_DAY}>Dia Completo (D)</option>
                                        <option value={AttendanceStatus.HALF_DAY}>Meio Dia (D/2)</option>
                                        <option value={AttendanceStatus.ABSENT}>Falta (F)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Produção (un)</label>
                                    <input type="number" className="w-full border rounded p-2" value={newRecordData.production} onChange={e => setNewRecordData({ ...newRecordData, production: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Notas</label>
                                    <input type="text" className="w-full border rounded p-2 placeholder-gray-300" placeholder="Opcional" value={newRecordData.notes} onChange={e => setNewRecordData({ ...newRecordData, notes: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleAddDailyRecord} className="bg-blue-600 text-white font-medium px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700">
                                    <Save size={16} /> Salvar Registo
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {sortedRecords.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">Nenhum registo diário encontrado.</p>
                        ) : sortedRecords.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-200 transition">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded border border-gray-200">
                                        {formatFlexibleDate(r.date, { dateOnly: true })}
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-0.5 rounded uppercase w-10 text-center ${r.status === 'D' ? 'bg-green-100 text-green-700' :
                                        r.status === 'D/2' ? 'bg-orange-100 text-orange-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {r.status}
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-sm">
                                        <span className="text-gray-400 text-xs mr-2">PRODUÇÃO</span>
                                        <span className="font-bold text-gray-800">{r.production}</span>
                                    </div>
                                    {r.notes && (
                                        <div className="text-xs text-gray-500 italic max-w-[150px] truncate" title={r.notes}>
                                            "{r.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        // --- TAB: FINANCIAL ---
        if (activeModalTab === 'financial') {
            const history: string[] = [];
            userRecords.forEach(r => {
                const month = r.date.slice(0, 7);
                if (!history.includes(month)) history.push(month);
            });
            history.sort().reverse();
            if (!history.includes(currentMonth)) history.unshift(currentMonth);

            return (
                <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                        <DollarSign className="text-green-600 mt-1" size={20} />
                        <div>
                            <h5 className="font-bold text-green-800">Histórico de Fechos Salariais</h5>
                            <p className="text-sm text-green-700 mt-1">
                                Para cada mês em que o funcionário teve actividade registada, é apresentado o valor estimado do salário considerando dias trabalhados, faltas e produção.
                            </p>
                        </div>
                    </div>
                    {history.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-6">Nenhuma informação financeira disponível para este funcionário.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.map(m => {
                                const isCurrent = m === currentMonth;
                                const mRecords = userRecords.filter(r => r.date.startsWith(m));
                                const mFullDays = mRecords.filter(r => r.status === AttendanceStatus.FULL_DAY).length;
                                const mHalfDays = mRecords.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
                                const mAbsences = mRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
                                const mProduction = mRecords.reduce((acc, curr) => acc + (curr.production || 0), 0);
                                const mEffectiveDays = mFullDays + (mHalfDays * 0.5);
                                const mTarget = mEffectiveDays * (selectedUser.defaultDailyGoal || 0);

                                const mBase = (mFullDays * (selectedUser.dailyRate || 0)) + (mHalfDays * (selectedUser.halfDayRate || 0));
                                const mBonus = Math.max(0, mProduction - mTarget) * (selectedUser.bonusPerUnit || 0);
                                const mPenalty = mAbsences * (selectedUser.absencePenalty || 0);
                                const mNet = mBase + mBonus - mPenalty;

                                return (
                                    <div key={m} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                                <DollarSign size={20} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-gray-800">Mês: {m}</h5>
                                                <p className="text-xs text-gray-500">{isCurrent ? 'Mês em curso (Aberto)' : 'Mês Fechado'}</p>
                                                <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                                    <span>Base: {mBase.toFixed(2)}MT</span>
                                                    <span>Bónus: {mBonus.toFixed(2)}MT</span>
                                                    <span className="text-red-500">Desc: -{mPenalty.toFixed(2)}MT</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                                            <div className="text-sm font-bold text-gray-900 border px-3 py-1 rounded bg-gray-50">
                                                Total Estimado: <span className="text-green-700">{mNet.toFixed(2)} MT</span>
                                            </div>
                                            <div className="flex items-center gap-2 self-end">
                                                <span className={`px-2 py-1 rounded-sm text-[10px] uppercase font-bold ${isCurrent ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {isCurrent ? 'Pendente' : 'Processado'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        // --- TAB: SETTINGS ---
        if (activeModalTab === 'settings') {
            return (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div>
                            <h4 className="font-bold text-gray-800">Parametrização do Funcionário</h4>
                            <p className="text-xs text-gray-500">Defina o cargo, taxas de remuneração diária, metas e penalizações por faltas para este operário.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">

                        <div className="col-span-1 md:col-span-2">
                            <h5 className="font-semibold text-gray-700 mb-3 border-b pb-2 text-sm uppercase tracking-wide">Informação Geral</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função</label>
                                    <input
                                        type="text"
                                        value={settingsData.jobTitle || ''}
                                        onChange={e => setSettingsData(prev => ({ ...prev, jobTitle: e.target.value }))}
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso (Papel)</label>
                                    <select
                                        value={settingsData.role || Role.WORKER}
                                        onChange={e => setSettingsData(prev => ({ ...prev, role: e.target.value as Role }))}
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        disabled={!isAdminOrGM}
                                    >
                                        <option value={Role.WORKER}>Operário</option>
                                        <option value={Role.MANAGER}>Gerente</option>
                                        <option value={Role.GENERAL_MANAGER}>Diretor Geral</option>
                                        <option value={Role.ADMIN}>Administrador</option>
                                    </select>
                                    {!isAdminOrGM && <p className="text-[10px] text-gray-400 mt-1">Apenas Admins podem alterar o papel.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                            <h5 className="font-semibold text-gray-700 mb-3 border-b pb-2 text-sm uppercase tracking-wide mt-4">Remuneração e Metas</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxa Dia Completo (MT)</label>
                                    <input
                                        type="number" step="0.5"
                                        value={settingsData.dailyRate || 0}
                                        onChange={e => setSettingsData(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) }))}
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxa Meio Dia (MT)</label>
                                    <input
                                        type="number" step="0.5"
                                        value={settingsData.halfDayRate || 0}
                                        onChange={e => setSettingsData(prev => ({ ...prev, halfDayRate: parseFloat(e.target.value) }))}
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-red-600">Penalização Falta (MT)</label>
                                    <input
                                        type="number" step="0.5"
                                        value={settingsData.absencePenalty || 0}
                                        onChange={e => setSettingsData(prev => ({ ...prev, absencePenalty: parseFloat(e.target.value) }))}
                                        className="w-full border rounded border-red-200 p-2 focus:ring-2 focus:ring-red-500 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Produção Diária (un)</label>
                                    <input
                                        type="number" step="1"
                                        value={settingsData.defaultDailyGoal || 0}
                                        onChange={e => setSettingsData(prev => ({ ...prev, defaultDailyGoal: parseFloat(e.target.value) }))}
                                        className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-700 mb-1">Bónus por Unid Extra (MT)</label>
                                    <input
                                        type="number" step="0.5"
                                        value={settingsData.bonusPerUnit || 0}
                                        onChange={e => setSettingsData(prev => ({ ...prev, bonusPerUnit: parseFloat(e.target.value) }))}
                                        className="w-full border rounded border-blue-200 p-2 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-blue-800"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 pt-4 flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                disabled={!isAdminOrGM}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Save size={18} />
                                Salvar Configurações
                            </button>
                        </div>
                    </div>
                </div>
            );
        }


        // --- TAB: ENTREGAS (CENTRALIZADO) ---
        if (activeModalTab === 'entregas') {
            return (
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                        <div>
                            <h4 className="font-bold text-emerald-800">Histórico de Entregas de Materiais</h4>
                            <p className="text-xs text-emerald-600">Todas as entregas de materiais, EPIs e ferramentas registradas para este funcionário.</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3">Data</th>
                                    <th className="px-4 py-3">Produto</th>
                                    <th className="px-4 py-3 text-center">Qtd</th>
                                    <th className="px-4 py-3 text-center">Unidade</th>
                                    <th className="px-4 py-3 text-center">Origem</th>
                                    <th className="px-4 py-3 text-center">Observações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loadingDeliveries ? (
                                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Carregando entregas...</td></tr>
                                ) : deliveryHistory.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Nenhuma entrega registrada.</td></tr>
                                ) : (
                                    deliveryHistory.map((d: any) => (
                                        <tr key={d.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-600">{d.delivery_date ? formatFlexibleDate(d.delivery_date, { dateOnly: true }) : '-'}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{d.item_name}</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-600">{d.quantity}</td>
                                            <td className="px-4 py-3 text-center">{d.unit}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase font-bold tracking-tighter">{d.origin}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-gray-500">{d.notes || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // --- TAB: FICHAS INDIVIDUAIS ---
        if (activeModalTab === 'fichas') {
            const userFichas = fichasIndividuais.filter(f => f.entidade_id === selectedUser.id).sort((a, b) => (b.data || '').localeCompare(a.data));

            const handleSaveFicha = async (data: any) => {
                try {
                    await createFicha({
                        tipo: data.tipo,
                        entidade_id: selectedUser.id,
                        entidade_tipo: 'trabalhador',
                        data: data.data,
                        produto_id: data.produto_id || null,
                        produto: data.produto || data.produto_name || '',
                        quantidade: Number(data.quantidade) || 0,
                        unidade: data.unidade || 'Unidade',
                        observacoes: data.observacoes || '',
                        usuario_registou: '',
                        estado: 'pendente'
                    });
                    setStatus({ type: 'success', message: 'Ficha registada com sucesso.' });
                    setTimeout(() => setStatus(null), 3000);
                } catch (e: any) {
                    setStatus({ type: 'error', message: `Erro ao registar ficha: ${e?.message || String(e)}` });
                }
            };

            return (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-800">Fichas de Entrega — {selectedUser.name}</h4>
                            <p className="text-sm text-gray-500">Registos de entregas e requisições associadas ao funcionário.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-gray-100">
                            <h5 className="font-semibold text-gray-700 mb-3">Histórico de Fichas</h5>
                            {userFichas.length === 0 ? (
                                <div className="text-sm text-gray-400">Nenhuma ficha registada para este funcionário.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                            <tr>
                                                <th className="px-3 py-2">Data</th>
                                                <th className="px-3 py-2">Tipo</th>
                                                <th className="px-3 py-2">Produto</th>
                                                <th className="px-3 py-2 text-center">Qtd</th>
                                                <th className="px-3 py-2">Observações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {userFichas.map(f => (
                                                <tr key={f.id} className="hover:bg-gray-50">
                                                    <td className="px-3 py-2 text-gray-600">{f.data}</td>
                                                    <td className="px-3 py-2 font-medium text-gray-800">{f.tipo}</td>
                                                    <td className="px-3 py-2">{(f as any).produto_name || f.produto}</td>
                                                    <td className="px-3 py-2 text-center font-bold text-emerald-600">{f.quantidade}</td>
                                                    <td className="px-3 py-2 text-sm text-gray-500">{f.observacoes || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 lg:col-span-1">
                            <h5 className="font-semibold text-gray-700 mb-3">Registar Nova Ficha</h5>
                            <FichaQuickForm
                                userId={selectedUser.id}
                                items={items}
                                inventory={inventory}
                                onSave={handleSaveFicha}
                                onCancel={() => {/* noop: keep modal open */ }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    // --- TABS: Add 'Entregas' tab ---
    const modalTabs = [
        { key: 'summary', label: 'Resumo' },
        { key: 'history', label: 'Histórico' },
        { key: 'daily', label: 'Diário' },
        { key: 'financial', label: 'Financeiro' },
        { key: 'entregas', label: 'Entregas' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Recursos Humanos</h2>
                    <p className="text-sm text-gray-500">Gestão de pessoal, cadastro e configuração de salários.</p>
                </div>
            </div>

            {status && (
                <div className={`p-3 rounded text-sm ${status.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
                    status.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
                        'bg-blue-50 border border-blue-100 text-blue-800'
                    }`}>
                    {status.message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Registration Form */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                        <UserPlus size={20} className="text-blue-600" />
                        Cadastrar Novo Funcionário
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                            <input
                                required
                                type="text"
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: João da Silva"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função</label>
                            <input
                                required
                                type="text"
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.jobTitle}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, jobTitle: e.target.value })}
                                placeholder="Ex: Operador de Máquina"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (para login)</label>
                            <input
                                required
                                type="email"
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="funcionario@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
                            <input
                                required
                                type="password"
                                minLength={6}
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                            <select
                                aria-label="Nível de Acesso"
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.role}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, role: e.target.value as Role })}
                            >
                                <option value={Role.WORKER}>Operário (Campo)</option>
                                <option value={Role.MANAGER}>Gerente Regional</option>
                                <option value={Role.GENERAL_MANAGER}>Diretor Geral</option>
                                <option value={Role.ADMIN}>Administrador</option>
                            </select>
                        </div>

                        {formData.role === Role.WORKER && (
                            <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-3">
                                <p className="text-xs font-bold text-gray-500 uppercase">Configuração Salarial (MZN)</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor Dia</label>
                                        <input aria-label="Valor Dia" title="Valor Dia" type="number" step="0.1" placeholder="0.00" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.dailyRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor Meio Dia</label>
                                        <input aria-label="Valor Meio Dia" title="Valor Meio Dia" type="number" step="0.1" placeholder="0.00" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.halfDayRate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, halfDayRate: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor Falta</label>
                                        <input aria-label="Valor Falta" title="Valor Falta" type="number" step="0.1" placeholder="0.00" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.absencePenalty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, absencePenalty: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Bónus (Unid)</label>
                                        <input aria-label="Bónus (Unid)" title="Bónus por Unidade" type="number" step="0.1" placeholder="0.00" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.bonusPerUnit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, bonusPerUnit: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Diária (Produção)</label>
                                        <input aria-label="Meta Diária (Produção)" title="Meta Diária" type="number" placeholder="0" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.defaultDailyGoal} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, defaultDailyGoal: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Alocação</label>
                            <select
                                aria-label="Departamento / Alocação"
                                title="Selecione o departamento"
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.locationId || ''}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, locationId: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {locations.filter((loc, index, self) =>
                                    index === self.findIndex((l) => (
                                        l.id === loc.id
                                    ))
                                ).map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition shadow-sm mt-4">
                            Cadastrar
                        </button>
                    </form>
                </div>

                {/* Employee List */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            Quadro de Funcionários ({filteredUsers.length})
                        </h3>
                        <div className="relative">
                            <Search size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                className="pl-8 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:border-blue-500 bg-gray-50"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                                    <th className="px-4 py-3">Nome</th>
                                    <th className="px-4 py-3">Cargo</th>
                                    <th className="px-4 py-3">Departamento</th>
                                    <th className="px-4 py-3 text-center">Meta</th>
                                    <th className="px-4 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2 cursor-pointer" onClick={() => handleOpenModal(user)}>
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 cursor-pointer" onClick={() => handleOpenModal(user)}>{user.jobTitle || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1 cursor-pointer" onClick={() => handleOpenModal(user)}>
                                            <MapPin size={12} className="text-gray-400" />
                                            {locations.find(l => l.id === user.locationId)?.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700 text-center cursor-pointer" onClick={() => handleOpenModal(user)}>
                                            {user.defaultDailyGoal ? user.defaultDailyGoal : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => handleOpenModal(user)} aria-label={`Abrir perfil de ${user.name}`} title={`Abrir perfil de ${user.name}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 px-2 py-1 rounded bg-blue-50">
                                                Perfil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- EMPLOYEE PROFILE MODAL --- */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-hidden">
                    <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-6 shrink-0 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-slate-800">
                                    {selectedUser.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedUser.name}</h2>
                                    <p className="text-slate-400 flex items-center gap-2">
                                        <Briefcase size={14} /> {selectedUser.jobTitle} •
                                        <span className="bg-slate-800 px-2 py-0.5 rounded text-xs text-blue-300 border border-slate-700">
                                            {locations.find(l => l.id === selectedUser.locationId)?.name}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {isAdminOrGM && (
                                    <button
                                        onClick={() => handleDeleteUser(selectedUser)}
                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded transition"
                                        title="Apagar Funcionário"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white p-2" aria-label="Fechar">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="bg-slate-50 border-b border-gray-200 px-6 flex gap-6 overflow-x-auto shrink-0">
                            <button onClick={() => setActiveModalTab('summary')} className={`py-4 text-sm font-medium border-b-2 transition ${activeModalTab === 'summary' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Resumo
                            </button>
                            <button onClick={() => setActiveModalTab('history')} className={`py-4 text-sm font-medium border-b-2 transition ${activeModalTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Histórico Mensal
                            </button>
                            <button onClick={() => setActiveModalTab('daily')} className={`py-4 text-sm font-medium border-b-2 transition ${activeModalTab === 'daily' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Registo Diário
                            </button>
                            <button onClick={() => setActiveModalTab('financial')} className={`py-4 text-sm font-medium border-b-2 transition ${activeModalTab === 'financial' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Financeiro
                            </button>
                            <button onClick={() => setActiveModalTab('fichas')} className={`py-4 text-sm font-medium border-b-2 transition ${activeModalTab === 'fichas' ? 'border-emerald-600 text-emerald-600 underline' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                <div className="flex items-center gap-1">
                                    <FileText size={16} /> Ficha de Entregas
                                </div>
                            </button>
                            <button onClick={() => setActiveModalTab('settings')} className={`py-4 text-sm font-medium border-b-2 transition ${activeModalTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Configurações
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-white">
                            {renderModalContent()}
                        </div>
                    </div>
                </div>
            )}

            {/* --- DELETE CONFIRMATION MODAL --- */}
            {isDeleteModalOpen && userToDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirmar Apagamento de Funcionário</h3>
                        <p className="text-gray-600 mb-6">
                            Tem a certeza que deseja apagar o funcionário <strong>{userToDelete.name}</strong>? Esta ação não pode ser desfeita e todos os seus dados relacionados serão removidos.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setUserToDelete(null);
                                }}
                                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-medium transition flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- QUICK DELIVERY FORM FOR HR ---
const FichaQuickForm = ({ userId, items, inventory, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
        tipo: 'ferramentas' as any,
        entidade_id: userId,
        entidade_tipo: 'trabalhador',
        data: new Date().toISOString().split('T')[0],
        produto_id: '',
        produto: '',
        quantidade: 1,
        unidade: 'Unidade',
        observacoes: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return [];
        return items.filter((i: any) => i.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5);
    }, [items, searchTerm]);

    const handleSelect = (item: any) => {
        setFormData({
            ...formData,
            produto_id: item.id,
            produto: item.name,
            unidade: item.unit || 'Unidade'
        });
        setSearchTerm(item.name);
        setShowResults(false);
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Procurar Produto</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setShowResults(true); }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ex: Enxada, Bota, Combustível..."
                    />
                </div>
                {showResults && filteredItems.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                        {filteredItems.map((it: any) => (
                            <button
                                key={it.id}
                                onClick={() => handleSelect(it)}
                                className="w-full text-left p-3 hover:bg-emerald-50 border-b border-gray-50 last:border-0"
                            >
                                <div className="font-bold text-gray-800 text-sm">{it.name}</div>
                                <div className="text-[10px] text-gray-500 uppercase">{it.category}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantidade</label>
                    <input
                        type="number"
                        step="0.01"
                        value={formData.quantidade}
                        onChange={e => setFormData({ ...formData, quantidade: parseFloat(e.target.value) })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unidade</label>
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                        {formData.unidade}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Ficha</label>
                    <select
                        value={formData.tipo}
                        onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                        <option value="ferramentas">Ferramentas</option>
                        <option value="pecas">Peças</option>
                        <option value="materiais">Materiais</option>
                        <option value="combustivel">Combustível</option>
                        <option value="oleo">Óleo</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Data</label>
                    <input
                        type="date"
                        value={formData.data}
                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Observações (Opcional)</label>
                <textarea
                    value={formData.observacoes}
                    onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm min-h-[80px]"
                    placeholder="Notas adicionais..."
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 uppercase text-xs tracking-widest">Cancelar</button>
                <button
                    onClick={() => onSave(formData)}
                    disabled={!formData.produto_id}
                    className="flex-[2] py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 uppercase text-xs tracking-widest shadow-lg shadow-emerald-200"
                >
                    Confirmar Entrega
                </button>
            </div>
        </div>
    );
};
