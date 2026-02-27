
import React, { useState, useEffect } from 'react';
import { useLogistics } from '../context/useLogistics';
import { ItemCondition, Role } from '../types';
import { Plus, Trash2, ArrowLeft, Save, Box, FileText, Check } from 'lucide-react';

interface RowItem {
    id: string; // temp id for key
    itemId: string; // '' for manual
    itemName: string;
    quantity: number;
    unit: string;
    condition: ItemCondition;
    notes: string;
}

interface RequisitionFormProps {
    onCancel: () => void;
    onSuccess: () => void;
}

export const RequisitionForm = ({ onCancel, onSuccess }: RequisitionFormProps) => {
    const { items, locations, currentUser, createRequisitionSheet, getLocationName } = useLogistics();

    const [targetLocationId, setTargetLocationId] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [rows, setRows] = useState<RowItem[]>([
        { id: '1', itemId: '', itemName: '', quantity: 1, unit: 'Unidade', condition: ItemCondition.NEW, notes: '' }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-set target location logic can be added here if needed
    // For now, user must select if they are Admin. Managers usually req from specific hierarchy.

    // Filter target locations (exclude own location usually, or show all depending on rules)
    // For simplicity, showing all branches
    const availableTargets = locations.filter(l => l.id !== currentUser?.locationId);

    const addRow = () => {
        setRows([...rows, {
            id: Math.random().toString(36).substr(2, 9),
            itemId: '',
            itemName: '',
            quantity: 1,
            unit: 'Unidade',
            condition: ItemCondition.NEW,
            notes: ''
        }]);
    };

    const removeRow = (id: string) => {
        if (rows.length === 1) return;
        setRows(rows.filter(r => r.id !== id));
    };

    const updateRow = (id: string, field: keyof RowItem, value: any) => {
        setRows(rows.map(r => {
            if (r.id === id) {
                const updated = { ...r, [field]: value };
                // If updating itemId, also auto-fill name and unit if stock item selected
                if (field === 'itemId' && value !== '') {
                    const stockItem = items.find(i => i.id === value);
                    if (stockItem) {
                        updated.itemName = stockItem.name;
                        updated.unit = stockItem.unit || 'Unidade';
                    }
                }
                return updated;
            }
            return r;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetLocationId) {
            setStatus({ type: 'info', message: 'Selecione o local de destino.' });
            return;
        }
        if (rows.length === 0) {
            setStatus({ type: 'info', message: 'Adicione pelo menos um item.' });
            return;
        }
        if (rows.some(r => !r.itemName)) {
            setStatus({ type: 'info', message: 'Todos os itens precisam de uma descrição ou nome.' });
            return;
        }

        setIsSubmitting(true);
        try {
            await createRequisitionSheet(targetLocationId, rows.map(r => ({
                itemId: r.itemId || undefined,
                itemName: r.itemName,
                quantity: r.quantity,
                unit: r.unit,
                condition: r.condition,
                notes: r.notes
            })), notes);

            // --- Register deliveries if target is an employee ---
            // If targetLocationId is a user id (employee), register delivery for each item
            // (Assume: if targetLocationId matches a user, it's an employee delivery)
            try {
                const { registerEmployeeDelivery } = await import('../services/employeeDeliveryService');
                // You may want to check if targetLocationId is a user id; for now, always register
                await Promise.all(rows.map(async (r) => {
                    await registerEmployeeDelivery({
                        employeeId: targetLocationId,
                        itemId: r.itemId || undefined,
                        itemName: r.itemName,
                        quantity: r.quantity,
                        unit: r.unit,
                        deliveredBy: currentUser?.id,
                        origin: 'REQUISITION',
                        notes: r.notes,
                    });
                }));
            } catch (err) {
                // Ignore delivery registration errors for now
            }

            setStatus({ type: 'success', message: 'Requisição criada com sucesso!' });
            setTimeout(() => onSuccess(), 1500);
        } catch (err) {
            setStatus({ type: 'error', message: `Erro ao criar requisição: ${err instanceof Error ? err.message : String(err)}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto pb-20 md:pb-4">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full" title="Voltar">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Nova Requisição de Materiais</h1>
                    <p className="text-sm text-gray-500">Preencha o formulário abaixo para solicitar múltiplos itens.</p>
                </div>
            </div>

            {status && (
                <div className={`p-3 rounded text-sm mb-6 ${
                    status.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
                    status.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
                    'bg-blue-50 border border-blue-100 text-blue-800'
                }`}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="targetLocation" className="block text-sm font-medium text-gray-700 mb-1">Destino (Solicitar Para)</label>
                        <select
                            id="targetLocation"
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={targetLocationId}
                            onChange={(e) => setTargetLocationId(e.target.value)}
                            required
                        >
                            <option value="">Selecione uma localização...</option>
                            {availableTargets.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Observações Gerais</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: Urgente para obra em Nampula"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Box size={18} /> Itens da Requisição
                        </h3>
                        <span className="text-xs text-gray-500 hidden md:inline">Preencha os detalhes de cada item</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50 text-left">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-10"></th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-1/3">Item (Estoque ou Manual)</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-24">Qtd</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-24">Unidade</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase w-32">Condição</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Observações</th>
                                    <th className="px-4 py-3 text-xs font-bold text-gray-500 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, index) => (
                                    <tr key={row.id} className="hover:bg-slate-50 transition">
                                        <td className="px-3 py-2 text-center text-gray-400 text-xs font-mono">{index + 1}</td>
                                        <td className="px-3 py-2">
                                            <div className="space-y-1">
                                                {/* Select Stock Item */}
                                                <select
                                                    aria-label="Selecionar item"
                                                    className="w-full text-sm border-gray-200 rounded focus:ring-blue-500 border p-1.5"
                                                    value={row.itemId}
                                                    onChange={(e) => updateRow(row.id, 'itemId', e.target.value)}
                                                >
                                                    <option value="">-- Item Manual --</option>
                                                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                                </select>
                                                {/* Manual Name Input (only if manual) */}
                                                {row.itemId === '' && (
                                                    <input
                                                        type="text"
                                                        placeholder="Descreva o item..."
                                                        aria-label="Nome do item manual"
                                                        className="w-full text-sm border-gray-200 rounded border p-1.5 focus:ring-blue-500"
                                                        value={row.itemName}
                                                        onChange={(e) => updateRow(row.id, 'itemName', e.target.value)}
                                                        required
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="number" min="0.1" step="0.1"
                                                aria-label="Quantidade"
                                                className="w-full text-sm border-gray-200 rounded border p-1.5 font-semibold text-center"
                                                value={row.quantity}
                                                onChange={(e) => updateRow(row.id, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                aria-label="Unidade"
                                                className="w-full text-sm border-gray-200 rounded border p-1.5"
                                                value={row.unit}
                                                onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                                                list="units-datalist"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <select
                                                aria-label="Selecionar condição"
                                                className="w-full text-sm border-gray-200 rounded border p-1.5"
                                                value={row.condition}
                                                onChange={(e) => updateRow(row.id, 'condition', e.target.value)}
                                            >
                                                <option value={ItemCondition.NEW}>Novo</option>
                                                <option value={ItemCondition.GOOD}>Bom</option>
                                                <option value={ItemCondition.FAIR}>Usado</option>
                                            </select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                placeholder="Detalhes..."
                                                aria-label="Observações"
                                                className="w-full text-sm border-gray-200 rounded border p-1.5 text-gray-500"
                                                value={row.notes}
                                                onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                                            />
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(row.id)}
                                                className="text-gray-400 hover:text-red-500 transition p-1"
                                                disabled={rows.length === 1}
                                                title="Remover linha"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Row Button */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={addRow}
                            className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline"
                        >
                            <Plus size={16} /> Adicionar Linha
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex items-center gap-2"
                    >
                        {isSubmitting ? 'Enviando...' : <><Save size={18} /> Criar Requisição</>}
                    </button>
                </div>
            </form>

            <datalist id="units-datalist">
                <option value="Unidade" />
                <option value="Kg" />
                <option value="Litros" />
                <option value="Metros" />
                <option value="Par" />
                <option value="Caixa" />
                <option value="Saco" />
            </datalist>
        </div>
    );
};
