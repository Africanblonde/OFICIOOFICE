import React, { useState } from 'react';
import { useLogistics } from '../context/LogisticsContext';
import { Role, User, AttendanceStatus } from '../types';
import {
    UserPlus, Users, Briefcase, MapPin, Search, X,
    Calendar, DollarSign, TrendingUp, Clock, Settings, FileText,
    ChevronRight, User as UserIcon, CheckCircle, AlertTriangle, Save, Lock
} from 'lucide-react';

export const HumanResources = () => {
    const { allUsers, locations, addNewUser, updateUser, performanceRecords, payrollParams, updatePayrollParams, isAdminOrGM } = useLogistics();
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'summary' | 'history' | 'daily' | 'financial' | 'settings'>('summary');

    // New User Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: Role.WORKER,
        locationId: '',
        jobTitle: '',
        defaultDailyGoal: 10,
        dailyRate: 236.5,
        halfDayRate: 118,
        absencePenalty: 95,
        bonusPerUnit: 10
    });

    // Settings Form State (Inside Modal)
    const [settingsData, setSettingsData] = useState<Partial<User>>({});

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.locationId) {
            alert("Selecione um departamento/localização.");
            return;
        }

        const newUser: User = {
            id: '', // Será preenchido pela Edge Function
            name: formData.name,
            role: formData.role,
            locationId: formData.locationId,
            jobTitle: formData.jobTitle,
            defaultDailyGoal: formData.role === Role.WORKER ? formData.defaultDailyGoal : undefined,
            dailyRate: formData.role === Role.WORKER ? formData.dailyRate : undefined,
            halfDayRate: formData.role === Role.WORKER ? formData.halfDayRate : undefined,
            absencePenalty: formData.role === Role.WORKER ? formData.absencePenalty : undefined,
            bonusPerUnit: formData.role === Role.WORKER ? formData.bonusPerUnit : undefined,
        };

        await addNewUser(newUser, formData.email, formData.password);

        // Reset
        setFormData({
            name: '',
            email: '',
            password: '',
            role: Role.WORKER,
            locationId: '',
            jobTitle: '',
            defaultDailyGoal: 10,
            dailyRate: 236.5,
            halfDayRate: 118,
            absencePenalty: 95,
            bonusPerUnit: 10
        });
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
    };

    const handleSaveSettings = () => {
        if (!isAdminOrGM) return;
        if (selectedUser) {
            const updated = { ...selectedUser, ...settingsData };
            updateUser(updated);
            setSelectedUser(updated); // Update local modal state
            alert("Configurações atualizadas com sucesso!");
        }
    };

    // --- MODAL COMPONENTS ---

    const renderModalContent = () => {
        if (!selectedUser) return null;
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        // Filter records for this user
        const userRecords = performanceRecords.filter(r => r.workerId === selectedUser.id);
        const currentMonthRecords = userRecords.filter(r => r.date.startsWith(currentMonth));

        // Stats Calculation
        const fullDays = currentMonthRecords.filter(r => r.status === AttendanceStatus.FULL_DAY).length;
        const halfDays = currentMonthRecords.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
        const absences = currentMonthRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
        const realProduction = currentMonthRecords.reduce((acc, curr) => acc + (curr.production || 0), 0);
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
                        <tbody className="divide-y divide-gray-100">
                            {months.map(m => {
                                const data = history[m];
                                const effDays = data.d + (data.h * 0.5);
                                const mTarget = effDays * (selectedUser.defaultDailyGoal || 0);
                                const eff = mTarget > 0 ? (data.prod / mTarget) * 100 : 0;
                                const isPast = m < currentMonth;

                                return (
                                    <tr key={m} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{m}</td>
                                        <td className="px-4 py-3 text-center text-gray-600">{data.d} <span className="text-xs text-gray-400">({data.h})</span></td>
                                        <td className="px-4 py-3 text-center text-red-500 font-bold">{data.f}</td>
                                        <td className="px-4 py-3 text-right font-medium">{data.prod}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${eff >= 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {eff.toFixed(0)}%
                                            </span>
                                        </td>
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
            const sortedRecords = [...userRecords].sort((a, b) => b.date.localeCompare(a.date));
            return (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {sortedRecords.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-200 transition">
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded border border-gray-200">
                                    {new Date(r.date).toLocaleDateString()}
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
            );
        }

        // --- TAB: FINANCIAL ---
        if (activeModalTab === 'financial') {
            // Mock financial history based on months
            const history: string[] = [];
            userRecords.forEach(r => {
                const month = r.date.slice(0, 7);
                if (!history.includes(month)) history.push(month);
            });
            history.sort().reverse();

            return (
                <div className="space-y-3">
                    {history.map(m => {
                        const isCurrent = m === currentMonth;
                        return (
                            <div key={m} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-gray-800">Salário {m}</h5>
                                        <p className="text-xs text-gray-500">{isCurrent ? 'Em processamento' : 'Processado e Fechado'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCurrent ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                        {isCurrent ? 'Pendente' : 'Pago'}
                                    </span>
                                    <button className="text-gray-400 hover:text-blue-600">
                                        <FileText size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        // --- TAB: SETTINGS ---
        if (activeModalTab === 'settings') {
            const canEdit = isAdminOrGM;

            return (
                <div className="space-y-4">
                    {!canEdit && (
                        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg flex items-center gap-2 text-sm border border-yellow-200">
                            <Lock size={16} />
                            Apenas Administradores podem alterar configurações salariais.
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cargo / Função</label>
                            <input
                                type="text"
                                disabled={!canEdit}
                                className="w-full border rounded p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={settingsData.jobTitle || ''}
                                onChange={e => setSettingsData({ ...settingsData, jobTitle: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Categoria (Role)</label>
                            <select
                                disabled={!canEdit}
                                className="w-full border rounded p-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                                value={settingsData.role}
                                onChange={e => setSettingsData({ ...settingsData, role: e.target.value as Role })}
                            >
                                <option value={Role.WORKER}>Operário</option>
                                <option value={Role.MANAGER}>Gerente</option>
                                <option value={Role.GENERAL_MANAGER}>Diretor Geral</option>
                                <option value={Role.ADMIN}>Admin</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h5 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <DollarSign size={16} /> Parâmetros Salariais (MZN)
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Dia (D)</label>
                                <input
                                    type="number" step="0.1"
                                    disabled={!canEdit}
                                    className="w-full border rounded p-2 text-sm font-semibold text-gray-800 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    value={settingsData.dailyRate || 0}
                                    onChange={e => setSettingsData({ ...settingsData, dailyRate: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Meio Dia (D/2)</label>
                                <input
                                    type="number" step="0.1"
                                    disabled={!canEdit}
                                    className="w-full border rounded p-2 text-sm font-semibold text-gray-800 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    value={settingsData.halfDayRate || 0}
                                    onChange={e => setSettingsData({ ...settingsData, halfDayRate: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Penalidade Falta (F)</label>
                                <input
                                    type="number" step="0.1"
                                    disabled={!canEdit}
                                    className="w-full border rounded p-2 text-sm font-semibold text-red-600 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    value={settingsData.absencePenalty || 0}
                                    onChange={e => setSettingsData({ ...settingsData, absencePenalty: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Bónus por Unidade Extra</label>
                                <input
                                    type="number" step="0.1"
                                    disabled={!canEdit}
                                    className="w-full border rounded p-2 text-sm font-semibold text-green-600 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    value={settingsData.bonusPerUnit || 0}
                                    onChange={e => setSettingsData({ ...settingsData, bonusPerUnit: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Diária Padrão (Árvores/Produção)</label>
                        <input
                            type="number"
                            disabled={!canEdit}
                            className="w-full border rounded p-2 text-sm bg-blue-50 text-blue-900 font-bold border-blue-200 disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-200"
                            value={settingsData.defaultDailyGoal || 0}
                            onChange={e => setSettingsData({ ...settingsData, defaultDailyGoal: parseFloat(e.target.value) })}
                        />
                    </div>

                    <div className="pt-2">
                        {canEdit && (
                            <button
                                onClick={handleSaveSettings}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Save size={16} /> Salvar Alterações
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Recursos Humanos</h2>
                    <p className="text-sm text-gray-500">Gestão de pessoal, cadastro e configuração de salários.</p>
                </div>
            </div>

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
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                                onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
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
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                            <select
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
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
                                        <input type="number" step="0.1" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.dailyRate} onChange={e => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor Meio Dia</label>
                                        <input type="number" step="0.1" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.halfDayRate} onChange={e => setFormData({ ...formData, halfDayRate: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Valor Falta</label>
                                        <input type="number" step="0.1" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.absencePenalty} onChange={e => setFormData({ ...formData, absencePenalty: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Bónus (Unid)</label>
                                        <input type="number" step="0.1" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.bonusPerUnit} onChange={e => setFormData({ ...formData, bonusPerUnit: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Meta Diária (Produção)</label>
                                        <input type="number" className="w-full border rounded p-1 text-sm bg-white text-gray-900" value={formData.defaultDailyGoal} onChange={e => setFormData({ ...formData, defaultDailyGoal: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Alocação</label>
                            <select
                                className="w-full border rounded p-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.locationId}
                                onChange={e => setFormData({ ...formData, locationId: e.target.value })}
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
                                    <tr key={user.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleOpenModal(user)}>
                                        <td className="px-4 py-3 font-medium text-gray-800 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {user.name.charAt(0)}
                                            </div>
                                            {user.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{user.jobTitle || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 flex items-center gap-1">
                                            <MapPin size={12} className="text-gray-400" />
                                            {locations.find(l => l.id === user.locationId)?.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700 text-center">
                                            {user.defaultDailyGoal ? user.defaultDailyGoal : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button className="text-blue-600 hover:text-blue-800 text-xs font-medium border border-blue-200 px-2 py-1 rounded bg-blue-50">
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
                            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-white p-2">
                                <X size={24} />
                            </button>
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
        </div>
    );
};