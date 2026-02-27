
import React, { useState } from 'react';
import { useLogistics } from '../context/useLogistics';
import { PaymentMethod, CartItem, TransactionType, Invoice, DocumentType, Client, InvoiceItem } from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';
import InvoiceModal from '../components/InvoiceModal';
import {
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    Search,
    Package,
    TrendingDown,
    History,
    FileText,
    Printer,
    Edit,
    Users,
    UserPlus,
    ArrowRight,
    CheckCircle,
    X
} from 'lucide-react';

export const POS = () => {
    const { items, inventory, currentUser, processSale, registerExpense, transactions, invoices, addInvoice, updateInvoice, getNextInvoiceNumber, hasPermission, locations, clients, addClient, updateClient, getClientBalance, companyInfo, costCenters, expenseCategories, paymentMethods: contextPaymentMethods } = useLogistics();
    const [activeTab, setActiveTab] = useState<'terminal' | 'expenses' | 'invoices' | 'history' | 'clients'>('terminal');

    // POS State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [clientName, setClientName] = useState('Consumidor Final');
    const [clientNuit, setClientNuit] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [searchTerm, setSearchTerm] = useState('');

    // Expense State
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseForm, setExpenseForm] = useState<{
        description: string;
        category: string;
        amount: number;
        paymentMethod: PaymentMethod;
        date: string;
        costCenterId: string;
        receiptNumber: string;
    }>({
        description: '',
        category: '',
        amount: 0,
        paymentMethod: PaymentMethod.CASH,
        date: new Date().toISOString().slice(0, 10),
        costCenterId: '',
        receiptNumber: ''
    });

    // Invoice State
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Partial<Invoice> | undefined>(undefined);
    const [invoiceSearch, setInvoiceSearch] = useState('');

    // Client State
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [clientForm, setClientForm] = useState<Partial<Client>>({});
    const [clientSearch, setClientSearch] = useState('');

    // Flag to track if the modal was opened from POS Checkout
    const [isPosCheckout, setIsPosCheckout] = useState(false);

    // History tab state: filters / pagination / export
    const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'SALE' | 'EXPENSE'>('ALL');
    const [historyStartDate, setHistoryStartDate] = useState<string | null>(null);
    const [historyEndDate, setHistoryEndDate] = useState<string | null>(null);
    const [historySearch, setHistorySearch] = useState('');
    const [historyLocationFilter, setHistoryLocationFilter] = useState<string>('ALL');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyPageSize, setHistoryPageSize] = useState(20);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Helper to apply all history filters consistently
    const applyHistoryFilters = (txList: typeof transactions) => {
        const byLocation = historyLocationFilter !== 'ALL'
            ? txList.filter(tx => tx.locationId === historyLocationFilter)
            : txList;
        const byType = byLocation.filter(tx => historyTypeFilter === 'ALL' ? true : tx.type === historyTypeFilter);
        const byDate = byType.filter(tx => {
            if (!historyStartDate && !historyEndDate) return true;
            const d = tx.date ? tx.date.slice(0, 10) : '';
            if (historyStartDate && d < historyStartDate) return false;
            if (historyEndDate && d > historyEndDate) return false;
            return true;
        });
        return byDate.filter(tx => {
            const q = historySearch.toLowerCase();
            if (!q) return true;
            return (tx.clientName || '').toLowerCase().includes(q) || (tx.description || '').toLowerCase().includes(q) || (tx.category || '').toLowerCase().includes(q);
        });
    };

    const exportTransactionsToCSV = () => {
        const filtered = applyHistoryFilters(transactions);
        if (filtered.length === 0) return;

        const rows = filtered.map(tx => ({
            id: tx.id,
            date: tx.date,
            type: tx.type,
            localizacao: locations.find(l => l.id === tx.locationId)?.name || tx.locationId || '',
            client: tx.clientName || '',
            description: tx.description || '',
            category: tx.category || '',
            amount: tx.amount,
            paymentMethod: tx.paymentMethod || '',
        }));

        const header = Object.keys(rows[0]).join(',') + '\n';
        const csv = header + rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacoes_${historyLocationFilter !== 'ALL' ? locations.find(l => l.id === historyLocationFilter)?.name + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- POS LOGIC ---

    // Get items available in current location
    const availableItems = inventory
        .filter(rec => rec.locationId === currentUser?.locationId && rec.quantity > 0)
        .map(rec => {
            const itemDef = items.find(i => i.id === rec.itemId);
            return {
                ...itemDef,
                stockQty: rec.quantity
            };
        })
        .filter(item => item.id && item.name && item.price) // Ensure valid item
        .filter(item => item.is_for_sale !== false) // Only show items marked for sale
        .filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const addToCart = (item: any) => {
        setCart(prev => {
            const existing = prev.find(i => i.itemId === item.id);
            if (existing) {
                // Check stock limit
                if (existing.quantity >= item.stockQty) return prev;
                return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { itemId: item.id!, name: item.name!, quantity: 1, unitPrice: item.price! }];
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.itemId !== itemId));
    };

    const adjustQty = (itemId: string, delta: number) => {
        setCart(prev => prev.map(i => {
            if (i.itemId === itemId) {
                const newQty = i.quantity + delta;
                if (newQty < 1) return i;

                // Find max stock
                const stockItem = availableItems.find(ai => ai.id === itemId);
                if (newQty > (stockItem?.stockQty || 0)) return i;

                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const selectPosClient = (client: Client) => {
        setClientName(client.name || client.nome || '');
        setClientNuit(client.nuit || '');
        setSelectedClientId(client.id || '');
    };

    const cartTotal = cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const vat = cartTotal * 0.16;
    const grandTotal = cartTotal + vat;

    const handleCheckout = () => {
        if (cart.length === 0) return;

        // Task 1.4: Auto-link POS items to invoice
        // Ensure all items have proper itemId and are tracking inventory items
        const items: InvoiceItem[] = cart.map(item => ({
            itemId: item.itemId,
            descricao: item.name,
            quantidade: item.quantity,
            precoUnitario: item.unitPrice,
            impostoPercent: 16 // Default VAT for POS
        }));

        const draftInvoice: Partial<Invoice> = {
            tipo: 'FATURA_RECIBO', // Default to Receipt since it's POS
            status: 'PAGA', // Assume Paid in POS
            cliente: {
                id: selectedClientId || undefined,
                nome: clientName,
                nuit: clientNuit
            },
            itens: items,
            observacoes: 'Venda via POS Terminal - Rastreabilidade: Itens do inventário'
        };

        setEditingInvoice(draftInvoice);
        setIsPosCheckout(true); // Mark that this comes from POS
        setIsInvoiceModalOpen(true);
    };

    // --- EXPENSE LOGIC ---

    const handleExpenseSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (expenseForm.amount <= 0) return;
        registerExpense(
            expenseForm.description,
            expenseForm.category || expenseCategories?.[0] || 'Outros',
            expenseForm.amount,
            expenseForm.paymentMethod,
            new Date(expenseForm.date).toISOString(),
            expenseForm.costCenterId || null,
            expenseForm.receiptNumber
        );
        setIsExpenseModalOpen(false);
        setExpenseForm({
            ...expenseForm,
            description: '',
            amount: 0,
            receiptNumber: ''
        });
    };

    // --- INVOICE LOGIC ---

    const handleNewInvoice = () => {
        setEditingInvoice(undefined);
        setIsPosCheckout(false);
        setIsInvoiceModalOpen(true);
    }

    const handleEditInvoice = (inv: Invoice) => {
        setEditingInvoice(inv);
        setIsPosCheckout(false);
        setIsInvoiceModalOpen(true);
    }

    const handleSaveInvoice = async (inv: Invoice) => {
        setStatus({ type: 'info', message: 'Gravando documento...' });
        try {
            // Check if ID exists to determine update vs add
            const exists = invoices.find(i => i.id === inv.id);
            if (exists) {
                await updateInvoice(inv);
            } else {
                await addInvoice(inv);
            }
            setIsInvoiceModalOpen(false);

            // If this was a POS Checkout that was successfully saved, clear the cart
            if (isPosCheckout) {
                setCart([]);
                setClientName('Consumidor Final');
                setClientNuit('');
                setSelectedClientId(null);
                setPaymentMethod(PaymentMethod.CASH);
                setIsPosCheckout(false);
            }
            setStatus({ type: 'success', message: 'Documento guardado.' });
            setTimeout(() => setStatus(null), 3500);
        } catch (error: any) {
            setStatus({ type: 'error', message: `Erro ao guardar fatura: ${error?.message || String(error)}` });
        }
    }

    // --- CLIENT LOGIC ---
    const handleClientSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientForm.name) return;

        if (clientForm.id) {
            updateClient(clientForm as Client);
        } else {
            addClient({
                id: `cli-${Date.now()}`,
                name: clientForm.name,
                nuit: clientForm.nuit,
                contact: clientForm.contact,
                email: clientForm.email,
                address: clientForm.address,
                notes: clientForm.notes
            });
        }
        setIsClientModalOpen(false);
        setClientForm({});
    };

    const handleEditClient = (client: Client) => {
        setClientForm(client);
        setIsClientModalOpen(true);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(val);
    };

    const currentLocation = locations.find(l => l.id === currentUser?.locationId);

    return (
        <div className="space-y-4">
            <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto hide-scrollbar">
                <button
                    onClick={() => setActiveTab('terminal')}
                    className={`px-4 py-2 font-black uppercase tracking-widest text-xs rounded-full whitespace-nowrap transition-all ${activeTab === 'terminal' ? 'bg-emerald-600 text-black shadow-lg shadow-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    Terminal
                </button>
                {hasPermission('VIEW_INVOICES') && (
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`px-4 py-2 font-black uppercase tracking-widest text-xs rounded-full whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'invoices' ? 'bg-indigo-600 text-black shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        <FileText size={16} /> Documentos
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`px-4 py-2 font-black uppercase tracking-widest text-xs rounded-full whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'clients' ? 'bg-emerald-100 text-emerald-900 shadow-sm border border-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    <Users size={16} /> Clientes
                </button>
                <button
                    onClick={() => setActiveTab('expenses')}
                    className={`px-4 py-2 font-black uppercase tracking-widest text-xs rounded-full whitespace-nowrap transition-all ${activeTab === 'expenses' ? 'bg-orange-500 text-black shadow-lg shadow-orange-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    Despesas
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 font-black uppercase tracking-widest text-xs rounded-full whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                >
                    Histórico
                </button>
            </div>

            {status && (
                <div className={`mt-3 p-3 rounded ${status.type === 'success' ? 'bg-green-100 border border-green-300 text-green-800' :
                    status.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' : 'bg-blue-50 border border-blue-100 text-blue-800'
                    }`}>
                    {status.message}
                </div>
            )}
            {activeTab === 'terminal' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-220px)] pb-20 lg:pb-0">
                    {/* Left: Product Grid */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-[500px] lg:h-full">
                        <div className="p-4 border-b border-gray-100 flex gap-4 bg-white sticky top-0 z-10">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar produto..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 text-gray-900"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-gray-50">
                            {availableItems.length === 0 ? (
                                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 mt-20">
                                    <Package size={48} className="mb-2 opacity-30" />
                                    <p>Sem itens no estoque.</p>
                                </div>
                            ) : (
                                availableItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => addToCart(item)}
                                        className="bg-white p-3 md:p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition text-left flex flex-col h-full active:scale-95"
                                    >
                                        <div className="flex justify-between items-start mb-2 w-full">
                                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded truncate max-w-[60%]">{item.sku}</span>
                                            <span className="text-[10px] font-bold text-blue-600">{item.stockQty} un</span>
                                        </div>
                                        <h4 className="font-semibold text-gray-800 text-sm mb-auto line-clamp-2 leading-tight">{item.name}</h4>
                                        <div className="mt-3 flex items-end justify-between w-full">
                                            <span className="text-sm md:text-lg font-bold text-gray-900">{formatCurrency(item.price || 0)}</span>
                                            <div className="bg-blue-50 text-blue-600 p-1 rounded-full">
                                                <Plus size={16} />
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right: Cart (Mobile: Sticky Bottom or Stacked) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col lg:h-full order-first lg:order-last mb-4 lg:mb-0">
                        <div className="p-4 border-b border-gray-100 bg-slate-50">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <ShoppingCart size={20} className="text-blue-600" /> Carrinho ({cart.length})
                                </h3>
                                <button
                                    onClick={() => setActiveTab('clients')}
                                    className="text-xs text-blue-600 bg-white border border-blue-100 px-2 py-1 rounded font-medium"
                                >
                                    Cliente
                                </button>
                            </div>
                            <div className="mt-2 space-y-2">
                                {clients.length > 0 && (
                                    <select
                                        aria-label="Selecionar cliente rápido"
                                        className="w-full border rounded p-1.5 text-sm bg-white text-gray-900"
                                        value={selectedClientId || ''}
                                        onChange={(e) => {
                                            const c = clients.find(cl => cl.id === e.target.value);
                                            if (c) selectPosClient(c);
                                            else {
                                                setSelectedClientId(null);
                                                setClientName('Consumidor Final');
                                                setClientNuit('');
                                            }
                                        }}
                                    >
                                        <option value="">-- Cliente Rápido --</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                )}
                                <input
                                    type="text"
                                    placeholder="Nome do Cliente"
                                    className="w-full border rounded p-1.5 text-sm bg-white text-gray-900"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px] lg:min-h-0">
                            {cart.length === 0 ? (
                                <div className="text-center text-gray-400 mt-10">
                                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Carrinho vazio</p>
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <div className="flex-1 min-w-0 mr-2">
                                            <h4 className="font-medium text-gray-800 text-sm truncate">{item.name}</h4>
                                            <p className="text-xs text-blue-600 font-bold">{formatCurrency(item.unitPrice)}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="flex items-center gap-0 bg-white rounded border border-gray-200">
                                                <button aria-label="Diminuir quantidade" title="Diminuir quantidade" onClick={() => adjustQty(item.itemId, -1)} className="p-1 hover:bg-gray-100 text-gray-600 w-6 h-6 flex items-center justify-center"><Minus size={10} /></button>
                                                <span className="text-xs font-bold w-6 text-center" aria-label={`Quantidade: ${item.quantity}`}>{item.quantity}</span>
                                                <button aria-label="Aumentar quantidade" title="Aumentar quantidade" onClick={() => adjustQty(item.itemId, 1)} className="p-1 hover:bg-gray-100 text-gray-600 w-6 h-6 flex items-center justify-center"><Plus size={10} /></button>
                                            </div>
                                            <button aria-label="Remover item do carrinho" title="Remover" onClick={() => removeFromCart(item.itemId)} className="text-red-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200 shadow-inner">
                            <div className="flex justify-between text-sm mb-1 text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-3 text-gray-600">
                                <span>IVA (16%)</span>
                                <span>{formatCurrency(vat)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 mb-4">
                                <span>Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {[
                                    { id: PaymentMethod.CASH, label: 'Dinheiro', icon: Banknote },
                                    { id: PaymentMethod.CARD, label: 'POS', icon: CreditCard },
                                    { id: PaymentMethod.MOBILE_MONEY, label: 'M-Pesa', icon: Smartphone },
                                    { id: PaymentMethod.BANK_TRANSFER, label: 'Transf.', icon: Receipt },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        aria-label={`Método de pagamento: ${m.label}`}
                                        title={`Selecionar ${m.label}`}
                                        onClick={() => setPaymentMethod(m.id)}
                                        className={`flex items-center justify-center gap-1 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-tighter border transition-all ${paymentMethod === m.id ? 'bg-emerald-600 text-black shadow-lg shadow-emerald-200 border-emerald-600' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <m.icon size={12} /> {m.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full bg-emerald-600 text-black py-3 rounded-xl font-black hover:bg-emerald-500 transition shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                            >
                                <CheckCircle size={20} /> Finalizar Venda
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'invoices' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-220px)]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar documento..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 text-gray-900 text-sm"
                                value={invoiceSearch}
                                onChange={e => setInvoiceSearch(e.target.value)}
                            />
                        </div>
                        <button onClick={handleNewInvoice} className="bg-emerald-600 text-black p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-500 shadow-lg shadow-emerald-100 ml-2 shrink-0 font-black uppercase text-xs tracking-widest transition-all">
                            <Plus size={18} /> <span className="hidden md:inline">Novo</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0">
                                <tr>
                                    <th className="p-4 border-b">Documento</th>
                                    <th className="p-4 border-b hidden md:table-cell">Cliente</th>
                                    <th className="p-4 border-b text-right">Total</th>
                                    <th className="p-4 border-b text-center">Status</th>
                                    <th className="p-4 border-b text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {invoices.filter(i =>
                                    i.numero.includes(invoiceSearch) ||
                                    i.cliente.nome.toLowerCase().includes(invoiceSearch.toLowerCase())
                                ).map(inv => {
                                    const total = inv.itens.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario * (1 + (item.impostoPercent || 0) / 100)), 0);
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900">{inv.numero}</div>
                                                <div className="text-xs text-gray-500 md:hidden">{inv.cliente.nome}</div>
                                                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 mt-1 inline-block">{inv.tipo.replace('_', ' ')}</span>
                                            </td>
                                            <td className="p-4 text-gray-600 hidden md:table-cell">{inv.cliente.nome}</td>
                                            <td className="p-4 text-right font-bold text-gray-800">{formatCurrency(total)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-full ${inv.status === 'PAGA' ? 'bg-green-100 text-green-700' :
                                                    inv.status === 'EMITIDA' ? 'bg-blue-100 text-blue-700' :
                                                        inv.status === 'CANCELADA' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <button aria-label="Editar documento" title="Editar" onClick={() => handleEditInvoice(inv)} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {invoices.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum documento encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ABA DE GESTÃO DE CLIENTES */}
            {activeTab === 'clients' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-220px)]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <div className="relative w-full max-w-xs">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:border-blue-500 text-gray-900 text-sm"
                                value={clientSearch}
                                onChange={e => setClientSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => {
                                setClientForm({});
                                setIsClientModalOpen(true);
                            }}
                            className="bg-emerald-600 text-black p-2 md:px-4 md:py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-500 ml-2 shrink-0 shadow-lg shadow-emerald-100 font-black uppercase tracking-widest text-xs transition-all"
                        >
                            <UserPlus size={18} /> <span className="hidden md:inline">Novo</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0">
                                <tr>
                                    <th className="p-4 border-b">Nome</th>
                                    <th className="p-4 border-b hidden md:table-cell">Contacto</th>
                                    <th className="p-4 border-b text-right">Saldo</th>
                                    <th className="p-4 border-b text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {clients.filter(c => (c.name || c.nome || '').toLowerCase().includes(clientSearch.toLowerCase())).map(client => {
                                    const debt = getClientBalance(client.id || '');
                                    return (
                                        <tr key={client.id} className="hover:bg-slate-50">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{client.name}</div>
                                                <div className="text-xs text-gray-500 md:hidden">{client.nuit}</div>
                                            </td>
                                            <td className="p-4 text-gray-600 hidden md:table-cell">{client.contact || '-'}</td>
                                            <td className={`p-4 text-right font-bold ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(debt)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button aria-label="Editar cliente" title="Editar" onClick={() => handleEditClient(client)} className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg">
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {clients.length === 0 && (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum cliente registrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-220px)]">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10 bg-white">
                        <div className="flex items-center gap-3">
                            <History size={20} className="text-gray-600" />
                            <h3 className="font-bold text-gray-800">Histórico Financeiro</h3>
                        </div>
                        {historyLocationFilter !== 'ALL' && (
                            <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                📍 {locations.find(l => l.id === historyLocationFilter)?.name}
                            </span>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="p-4 border-b border-gray-100 flex flex-col gap-3 bg-white">
                        {/* Location filter pills */}
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Setor:</span>
                            <button
                                onClick={() => { setHistoryLocationFilter('ALL'); setHistoryPage(1); }}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${historyLocationFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >Todos</button>
                            {locations.map(loc => (
                                <button key={loc.id}
                                    onClick={() => { setHistoryLocationFilter(loc.id); setHistoryPage(1); }}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${historyLocationFilter === loc.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >{loc.name}</button>
                            ))}
                        </div>

                        {/* Type / date / search filters */}
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <label htmlFor="historyType" className="text-xs text-gray-500">Tipo</label>
                                <select id="historyType" value={historyTypeFilter} onChange={(e) => { setHistoryTypeFilter(e.target.value as any); setHistoryPage(1); }} className="border px-2 py-1 rounded text-sm bg-white">
                                    <option value="ALL">Todos</option>
                                    <option value="SALE">Recebimentos</option>
                                    <option value="EXPENSE">Despesas</option>
                                </select>

                                <label htmlFor="historyStartDate" className="text-xs text-gray-500 ml-2">De</label>
                                <input id="historyStartDate" type="date" value={historyStartDate || ''} onChange={(e) => { setHistoryStartDate(e.target.value || null); setHistoryPage(1); }} className="border px-2 py-1 rounded text-sm bg-white" />

                                <label htmlFor="historyEndDate" className="text-xs text-gray-500 ml-2">Até</label>
                                <input id="historyEndDate" type="date" value={historyEndDate || ''} onChange={(e) => { setHistoryEndDate(e.target.value || null); setHistoryPage(1); }} className="border px-2 py-1 rounded text-sm bg-white" />

                                <input id="historySearch" placeholder="Buscar..." value={historySearch} onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }} className="border rounded px-2 py-1 text-sm bg-white ml-2" />
                            </div>

                            <div className="flex items-center gap-2">
                                <button aria-label="Exportar para CSV" onClick={() => exportTransactionsToCSV()} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded border border-blue-100">Exportar CSV</button>
                                <label htmlFor="historyPageSize" className="text-xs text-gray-500">Linhas:</label>
                                <select id="historyPageSize" value={historyPageSize} onChange={(e) => { setHistoryPageSize(Number(e.target.value)); setHistoryPage(1); }} className="border px-2 py-1 rounded text-sm bg-white">
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pagination info */}
                    {(() => {
                        const filtered = applyHistoryFilters(transactions);
                        const total = filtered.length;
                        const start = (historyPage - 1) * historyPageSize;
                        return (
                            <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between text-sm text-gray-600">
                                <span>Mostrando {total === 0 ? 0 : start + 1}–{Math.min(start + historyPageSize, total)} de {total}</span>
                                <div className="flex items-center gap-2">
                                    <button disabled={historyPage === 1} onClick={() => setHistoryPage(historyPage - 1)} className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50">Anterior</button>
                                    <span>Pág. {historyPage}</span>
                                    <button disabled={(historyPage * historyPageSize) >= total} onClick={() => setHistoryPage(historyPage + 1)} className="px-3 py-1 bg-gray-100 rounded text-sm disabled:opacity-50">Próxima</button>
                                </div>
                            </div>
                        );
                    })()}

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0">
                                <tr>
                                    <th className="p-3 border-b">Data</th>
                                    <th className="p-3 border-b">Tipo</th>
                                    <th className="p-3 border-b">Localização</th>
                                    <th className="p-3 border-b">Origem / Descrição</th>
                                    <th className="p-3 border-b text-right">Valor</th>
                                    <th className="p-3 border-b">Método</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {(() => {
                                    const filtered = applyHistoryFilters(transactions);
                                    const total = filtered.length;
                                    const start = (historyPage - 1) * historyPageSize;
                                    const pageItems = filtered.slice(start, start + historyPageSize);

                                    if (total === 0) {
                                        return <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma transação encontrada.</td></tr>;
                                    }

                                    return pageItems.map(tx => {
                                        const loc = locations.find(l => l.id === tx.locationId);
                                        return (
                                            <tr key={tx.id} className={`hover:bg-slate-50 ${tx.type === 'EXPENSE' ? 'bg-red-50/20' : ''}`}>
                                                <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{formatFlexibleDate(tx.date, { time: true })}</td>
                                                <td className="p-3">
                                                    <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full ${tx.type === 'SALE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {tx.type === 'SALE' ? 'Receita' : 'Despesa'}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    {loc ? <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{loc.name}</span> : <span className="text-gray-400 text-xs">—</span>}
                                                </td>
                                                <td className="p-3 text-gray-700 max-w-xs truncate">{tx.clientName || tx.description || tx.category || '-'}</td>
                                                <td className={`p-3 text-right font-bold ${tx.type === 'SALE' ? 'text-green-700' : 'text-red-600'}`}>{formatCurrency(tx.amount)}</td>
                                                <td className="p-3 text-xs text-gray-600">{tx.paymentMethod}</td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {activeTab === 'expenses' && (
                <div className="space-y-6 pb-20 md:pb-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 leading-none">Gestão de Despesas</h2>
                            <p className="text-sm text-slate-500 font-medium">Controle de gastos e compras da filial</p>
                        </div>
                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-red-200"
                        >
                            + Nova Despesa
                        </button>
                    </div>

                    {/* Location filter for expenses */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filtrar por localização:</span>
                        <button
                            onClick={() => setHistoryLocationFilter('ALL')}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${historyLocationFilter === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >Todas</button>
                        {locations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => setHistoryLocationFilter(loc.id)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${historyLocationFilter === loc.id ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            >{loc.name}</button>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <th className="p-4">Data</th>
                                        <th className="p-4">Localização</th>
                                        <th className="p-4">Descrição</th>
                                        <th className="p-4">Categoria</th>
                                        <th className="p-4">Nº Recibo</th>
                                        <th className="p-4 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {(() => {
                                        const expenseTxs = transactions
                                            .filter(t => t.type === TransactionType.EXPENSE)
                                            .filter(t => historyLocationFilter === 'ALL' || t.locationId === historyLocationFilter);
                                        if (expenseTxs.length === 0) {
                                            return <tr><td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50/50">Nenhuma despesa registrada{historyLocationFilter !== 'ALL' ? ' para esta localização' : ''}.</td></tr>;
                                        }
                                        const totalExpenses = expenseTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
                                        return [
                                            ...expenseTxs.slice(0, 50).map(tx => {
                                                const loc = locations.find(l => l.id === tx.locationId);
                                                return (
                                                    <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-4 whitespace-nowrap text-slate-600">{formatFlexibleDate(tx.date || '')}</td>
                                                        <td className="p-4">{loc ? <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">{loc.name}</span> : <span className="text-slate-400 text-xs">-</span>}</td>
                                                        <td className="p-4 max-w-xs truncate text-slate-900 font-medium">{tx.description || '-'}</td>
                                                        <td className="p-4"><span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-xs font-bold">{tx.category || '-'}</span></td>
                                                        <td className="p-4 text-slate-500 font-medium">{(tx as any).receiptNumber || '-'}</td>
                                                        <td className="p-4 text-right font-black text-red-600">
                                                            {(tx.amount || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}
                                                        </td>
                                                    </tr>
                                                );
                                            }),
                                            <tr key="total-row" className="bg-red-50 border-t-2 border-red-200">
                                                <td colSpan={5} className="p-4 font-black text-red-700 uppercase tracking-wide text-xs">Total {historyLocationFilter !== 'ALL' ? `— ${locations.find(l => l.id === historyLocationFilter)?.name}` : 'Geral'}</td>
                                                <td className="p-4 text-right font-black text-red-700">{totalExpenses.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' })}</td>
                                            </tr>
                                        ];
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Expense Modal */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-t-2xl md:rounded-xl shadow-xl p-6 animate-in slide-in-from-bottom-10 md:zoom-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingDown className="text-red-500" /> Nova Despesa
                            </h3>
                            <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleExpenseSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                    <input required type="date" className="w-full border rounded-lg p-3 bg-white text-gray-900"
                                        value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nº Recibo / Doc</label>
                                    <input type="text" className="w-full border rounded-lg p-3 bg-white text-gray-900"
                                        value={expenseForm.receiptNumber} onChange={e => setExpenseForm({ ...expenseForm, receiptNumber: e.target.value })} placeholder="Opcional" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localização / Centro de Custo</label>
                                <select className="w-full border rounded-lg p-3 bg-white text-gray-900" required
                                    value={expenseForm.costCenterId} onChange={e => setExpenseForm({ ...expenseForm, costCenterId: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {locations.length > 0 && (
                                        <optgroup label="── Localizações Registradas">
                                            {locations.map(loc => (
                                                <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {costCenters?.length > 0 && (
                                        <optgroup label="── Centros de Custo">
                                            {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                                        </optgroup>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select className="w-full border rounded-lg p-3 bg-white text-gray-900" required
                                    value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {expenseCategories?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input required type="text" className="w-full border rounded-lg p-3 bg-white text-gray-900"
                                    value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Ex: Compra de material" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (MZN)</label>
                                    <input required type="number" min="0" step="0.01" className="w-full border rounded-lg p-3 bg-white text-gray-900"
                                        value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                                    <select className="w-full border rounded-lg p-3 bg-white text-gray-900"
                                        value={expenseForm.paymentMethod} onChange={e => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as PaymentMethod })}>
                                        {contextPaymentMethods?.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 text-gray-700 bg-gray-100 py-3 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 shadow-md">Gravar Despesa</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            <InvoiceModal
                open={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                onSave={handleSaveInvoice}
                initial={editingInvoice}
                companyDefaults={{
                    empresa: companyInfo,
                    moeda: "MZN",
                    gerarNumero: getNextInvoiceNumber,
                    locationId: currentUser?.locationId || '',
                    userId: currentUser?.id || ''
                }}
            />

            {/* Client Modal */}
            {isClientModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-xl shadow-xl p-6 animate-in slide-in-from-bottom-10 md:zoom-in">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{clientForm.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                        <form onSubmit={handleClientSubmit} className="space-y-3">
                            <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Nome</label>
                                <input id="clientName" className="w-full border rounded-lg p-3 bg-white text-gray-900" required value={clientForm.name || ''} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label htmlFor="clientNuit" className="block text-sm font-medium text-gray-700">NUIT</label>
                                <input id="clientNuit" className="w-full border rounded-lg p-3 bg-white text-gray-900" value={clientForm.nuit || ''} onChange={e => setClientForm({ ...clientForm, nuit: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="clientContact" className="block text-sm font-medium text-gray-700">Telefone</label>
                                    <input id="clientContact" className="w-full border rounded-lg p-3 bg-white text-gray-900" value={clientForm.contact || ''} onChange={e => setClientForm({ ...clientForm, contact: e.target.value })} />
                                </div>
                                <div>
                                    <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">Email</label>
                                    <input id="clientEmail" className="w-full border rounded-lg p-3 bg-white text-gray-900" value={clientForm.email || ''} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="clientAddress" className="block text-sm font-medium text-gray-700">Endereço</label>
                                <input id="clientAddress" className="w-full border rounded-lg p-3 bg-white text-gray-900" value={clientForm.address || ''} onChange={e => setClientForm({ ...clientForm, address: e.target.value })} />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 text-gray-700 bg-gray-100 py-3 font-bold rounded-xl">Cancelar</button>
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};