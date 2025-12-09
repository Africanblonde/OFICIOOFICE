
import React, { useState } from 'react';
import { Invoice, PaymentMethod, InvoicePayment } from '../types';
import { calcularTotais, valorPago } from '../utils/invoice';
import { X, DollarSign, CreditCard, CheckCircle } from 'lucide-react';

interface Props {
  invoice: Invoice | null;
  onClose: () => void;
  onConfirm: (payment: InvoicePayment) => void;
}

export default function PaymentModal({ invoice, onClose, onConfirm }: Props) {
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [ref, setRef] = useState('');

  if (!invoice) return null;

  const { total } = calcularTotais(invoice.itens);
  const paid = valorPago(invoice.pagamentos);
  const remaining = Math.max(0, total - paid);

  const handlePay = () => {
    if (amount <= 0) {
        alert("Insira um valor válido.");
        return;
    }
    if (amount > remaining + 0.1) {
        if (!confirm("O valor excede o saldo restante. Deseja continuar e registrar como troco/crédito?")) return;
    }

    const newPayment: InvoicePayment = {
        data: new Date().toISOString(),
        valor: amount,
        modalidade: method,
        referencia: ref
    };

    onConfirm(newPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold flex items-center gap-2">
                <DollarSign size={20} /> Receber Pagamento
            </h3>
            <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded"><X size={20}/></button>
        </div>
        
        <div className="p-6">
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
                <p className="text-gray-500 text-sm">Fatura Nº {invoice.numero}</p>
                <div className="flex justify-between items-end mt-2">
                    <div className="text-left">
                        <p className="text-xs text-gray-400">Total Fatura</p>
                        <p className="font-bold text-gray-800">{total.toFixed(2)} {invoice.moeda}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Saldo Devedor</p>
                        <p className="font-bold text-2xl text-red-600">{remaining.toFixed(2)} {invoice.moeda}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor a Pagar</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">{invoice.moeda}</span>
                        <input 
                            type="number" step="0.01"
                            className="w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-gray-900 bg-white"
                            value={amount || ''}
                            onChange={e => setAmount(parseFloat(e.target.value))}
                            placeholder={remaining.toFixed(2)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setAmount(remaining)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 font-medium hover:bg-blue-100">
                            Pagar Total
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                        <select 
                            className="w-full border rounded-lg p-2 bg-white text-gray-900"
                            value={method}
                            onChange={e => setMethod(e.target.value as PaymentMethod)}
                        >
                            <option value="CASH">Dinheiro</option>
                            <option value="CARD">POS / Cartão</option>
                            <option value="MOBILE_MONEY">M-Pesa / E-Mola</option>
                            <option value="BANK_TRANSFER">Transferência</option>
                            <option value="CHEQUE">Cheque</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Referência</label>
                         <input 
                            type="text"
                            className="w-full border rounded-lg p-2 bg-white text-gray-900"
                            placeholder="Ex: Talão 123"
                            value={ref}
                            onChange={e => setRef(e.target.value)}
                         />
                    </div>
                </div>

                <button 
                    onClick={handlePay}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md flex items-center justify-center gap-2 mt-4"
                >
                    <CheckCircle size={18} /> Confirmar Recebimento
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
