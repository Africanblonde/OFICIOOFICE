
import React, { useMemo, useRef, useState, useEffect } from "react";
import { Invoice, InvoiceItem, InvoicePayment, DocumentType, InvoiceStatus, Client } from "../types";
import { useLogistics } from '../context/useLogistics';
import { formatFlexibleDate } from '../utils/dateFormatter';
import { Printer, X, Plus, Save, Download, DollarSign, Search, User } from 'lucide-react';
import PaymentModal from "./PaymentModal";

// Declarar html2pdf globalmente (vindo do CDN)
declare const html2pdf: any;

interface Props {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Invoice>;
  onSave: (invoice: Invoice) => Promise<void>;
  companyDefaults: {
    empresa: Invoice["empresa"];
    moeda: Invoice["moeda"];
    gerarNumero: () => string;
    locationId: string;
    userId: string;
  };
}

import { calcularTotais, valorPago, statusFinanceiro } from "../utils/invoice";

export default function InvoiceModal({ open, onClose, initial, onSave, companyDefaults }: Props) {
  const { clients, registerPayment } = useLogistics();
  const [invoice, setInvoice] = useState<Invoice>(() => ({
    id: initial?.id || `doc-${Date.now()}`,
    numero: initial?.numero || companyDefaults.gerarNumero(),
    tipo: (initial?.tipo ?? "FATURA") as DocumentType,
    status: (initial?.status ?? "RASCUNHO") as InvoiceStatus,
    locationId: initial?.locationId || companyDefaults.locationId,
    empresa: companyDefaults.empresa,
    cliente: {
      nome: initial?.cliente?.nome ?? "",
      nuit: initial?.cliente?.nuit ?? "",
      endereco: initial?.cliente?.endereco ?? "",
      contacto: initial?.cliente?.contacto ?? "",
      id: initial?.cliente?.id
    },
    itens: initial?.itens ?? [],
    pagamentos: initial?.pagamentos ?? [],
    moeda: companyDefaults.moeda,
    dataEmissao: initial?.dataEmissao || new Date().toISOString().slice(0, 10),
    vencimento: initial?.vencimento,
    observacoes: initial?.observacoes ?? "",
    createdBy: initial?.createdBy || companyDefaults.userId
  }));

  const [novoItem, setNovoItem] = useState<InvoiceItem>({
    descricao: "",
    quantidade: 1,
    precoUnitario: 0,
    impostoPercent: 16,
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientList, setShowClientList] = useState(false);

  const totals = useMemo(() => calcularTotais(invoice.itens), [invoice.itens]);
  const fin = useMemo(() => statusFinanceiro(invoice), [invoice]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(open && !initial) {
       setInvoice({
            id: `doc-${Date.now()}`,
            numero: companyDefaults.gerarNumero(),
            tipo: "FATURA",
            status: "RASCUNHO",
            locationId: companyDefaults.locationId,
            empresa: companyDefaults.empresa,
            cliente: { nome: "", nuit: "", endereco: "", contacto: "" },
            itens: [],
            pagamentos: [],
            moeda: companyDefaults.moeda,
            dataEmissao: new Date().toISOString().slice(0, 10),
            observacoes: "",
            createdBy: companyDefaults.userId
       });
    } else if (open && initial) {
        setInvoice(prev => ({...prev, ...initial}));
    }
  }, [open, initial]);

  if (!open) return null;

  const addItem = () => {
    if (!novoItem.descricao || novoItem.quantidade <= 0) return;
    setInvoice((prev) => ({ ...prev, itens: [...prev.itens, novoItem] }));
    setNovoItem({ descricao: "", quantidade: 1, precoUnitario: 0, impostoPercent: 16 });
  };

  const removeItem = (idx: number) => {
    setInvoice(prev => ({ ...prev, itens: prev.itens.filter((_, i) => i !== idx) }));
  };

  const emitir = async () => {
    try {
      const nextStatus = invoice.status === 'RASCUNHO' ? 'EMITIDA' : invoice.status;
      const finalInvoice = { ...invoice, status: nextStatus };
      await onSave(finalInvoice);
      onClose();
    } catch (error) {
      console.error('Erro ao emitir fatura:', error);
      alert('Erro ao guardar fatura. Por favor tente novamente.');
    }
  };

  const selectClient = (client: Client) => {
      setInvoice(prev => ({
          ...prev,
          cliente: {
              id: client.id,
              nome: client.name,
              nuit: client.nuit || '',
              endereco: client.address || '',
              contacto: client.contact || ''
          }
      }));
      setShowClientList(false);
  };

  const handlePaymentConfirmed = (payment: InvoicePayment) => {
      // 1. Atualizar o estado local imediatamente para refletir na UI
      setInvoice(prev => {
          const newPayments = [...prev.pagamentos, payment];
          const totalPaid = newPayments.reduce((acc, p) => acc + p.valor, 0);
          
          // Recalcular status localmente
          const { total } = calcularTotais(prev.itens);
          let newStatus = prev.status;
          if (totalPaid >= total - 0.1) newStatus = 'PAGA';
          else if (totalPaid > 0) newStatus = 'PAGA_PARCIAL';

          return {
              ...prev,
              pagamentos: newPayments,
              status: newStatus
          };
      });

      // 2. Persistir no sistema global
      registerPayment(invoice.id, payment);
  };

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;
    
    element.style.display = 'block';
    
    const opt = {
      margin: 10,
      filename: `Fatura_${invoice.numero.replace('/', '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
    });
  };

  const imprimir = () => {
    const printContents = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${invoice.tipo} ${invoice.numero}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
            .sheet { width: 100%; max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { display:flex; justify-content:space-between; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #111; text-transform: uppercase; }
            .meta { font-size: 14px; color: #666; margin-top: 5px; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #888; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #f9f9f9; padding: 10px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ddd; }
            td { padding: 10px; font-size: 13px; border-bottom: 1px solid #eee; }
            .right { text-align: right; }
            .totals { margin-top: 30px; display: flex; justify-content: flex-end; }
            .totals-box { width: 250px; }
            .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .grand-total { font-weight: bold; font-size: 16px; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
          </style>
        </head>
        <body onload="window.print(); setTimeout(()=>window.close(), 300);">
          <div class="sheet">${printContents}</div>
        </body>
      </html>
    `);
    win.document.close();
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <>
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white w-[1000px] max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <select 
                    aria-label="Tipo de documento"
                    value={invoice.tipo}
                    onChange={(e) => setInvoice({...invoice, tipo: e.target.value as DocumentType})}
                    className="bg-transparent border-none font-bold text-xl focus:ring-0 cursor-pointer"
                 >
                     <option value="FATURA">FATURA</option>
                     <option value="COTACAO">COTAÇÃO</option>
                     <option value="PRO_FORMA">PRO FORMA</option>
                     <option value="FATURA_RECIBO">FATURA RECIBO</option>
                 </select>
            </div>
            <div className="text-sm text-gray-500 mt-1">Nº {invoice.numero} • Status: <span className="font-bold text-blue-600">{invoice.status}</span></div>
          </div>
          <div className="flex gap-2">
            <button aria-label="Fechar modal" title="Fechar" className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2" onClick={onClose}>
                <X size={18} />
            </button>
            <button aria-label="Descarregar PDF" title="Descarregar PDF" className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-200" onClick={handleDownloadPDF}>
                <Download size={18} /> PDF
            </button>
            <button aria-label="Imprimir" title="Imprimir" className="px-3 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2 hover:bg-gray-900" onClick={imprimir}>
                <Printer size={18} /> Print
            </button>
            <button aria-label="Salvar fatura" title="Salvar e emitir" className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm" onClick={emitir}>
                <Save size={18} /> Salvar
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className="p-8 grid grid-cols-2 gap-8">
          {/* Empresa */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase mb-2">Emissor (Sua Empresa)</div>
            <div className="text-sm text-gray-800 space-y-1">
              <div className="font-bold text-lg">{invoice.empresa.nome}</div>
              <div>NUIT: {invoice.empresa.nuit}</div>
              <div>{invoice.empresa.endereco}</div>
              {invoice.empresa.contacto && <div>Tel: {invoice.empresa.contacto}</div>}
            </div>
          </div>

          {/* Cliente */}
          <div className="border border-gray-200 p-4 rounded-lg relative">
            <div className="flex justify-between items-center mb-2">
                 <div className="text-xs font-bold text-gray-400 uppercase">Cliente / Destinatário</div>
                 <button onClick={() => setShowClientList(!showClientList)} className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <Search size={12}/> Buscar Registrado
                 </button>
            </div>
            
            {showClientList && (
                <div className="absolute top-10 right-0 left-0 bg-white shadow-xl border border-gray-200 rounded-lg z-10 max-h-40 overflow-y-auto">
                    <input 
                        className="w-full p-2 text-sm border-b" 
                        placeholder="Filtrar clientes..." 
                        autoFocus
                        value={clientSearch}
                        onChange={e => setClientSearch(e.target.value)}
                    />
                    {filteredClients.map(c => (
                        <div key={c.id} onClick={() => selectClient(c)} className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50">
                            <span className="font-bold">{c.name}</span>
                            <span className="text-gray-400 text-xs ml-2">{c.nuit}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="relative">
                  <User size={16} className="absolute top-2.5 left-2.5 text-gray-400" />
                  <input className="border border-gray-300 p-2 pl-8 rounded text-sm w-full font-bold focus:outline-blue-500 bg-white text-gray-900" placeholder="Nome do cliente"
                        value={invoice.cliente.nome}
                        onChange={(e)=>setInvoice({...invoice, cliente:{...invoice.cliente, nome:e.target.value}})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                  <input className="border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" placeholder="NUIT"
                        value={invoice.cliente.nuit ?? ""}
                        onChange={(e)=>setInvoice({...invoice, cliente:{...invoice.cliente, nuit:e.target.value}})} />
                  <input className="border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" placeholder="Contacto"
                        value={invoice.cliente.contacto ?? ""}
                        onChange={(e)=>setInvoice({...invoice, cliente:{...invoice.cliente, contacto:e.target.value}})} />
              </div>
              <input className="border border-gray-300 p-2 rounded text-sm bg-white text-gray-900" placeholder="Endereço"
                     value={invoice.cliente.endereco ?? ""}
                     onChange={(e)=>setInvoice({...invoice, cliente:{...invoice.cliente, endereco:e.target.value}})} />
            </div>
          </div>

          {/* Itens */}
          <div className="col-span-2">
            <div className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">Itens do Documento</div>
            
            {invoice.status === 'RASCUNHO' && (
                <div className="grid grid-cols-12 gap-2 mb-4 bg-gray-50 p-2 rounded border border-gray-200 items-end">
                <div className="col-span-5">
                    <label className="text-[10px] text-gray-500">Descrição</label>
                    <input className="w-full border p-2 rounded text-sm bg-white text-gray-900" placeholder="Descrição do item"
                            value={novoItem.descricao} onChange={(e)=>setNovoItem({...novoItem, descricao:e.target.value})}/>
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] text-gray-500">Qtd</label>
                    <input aria-label="Quantidade de item" className="w-full border p-2 rounded text-sm bg-white text-gray-900" type="number" min={1}
                            value={novoItem.quantidade} onChange={(e)=>setNovoItem({...novoItem, quantidade:+e.target.value})}/>
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] text-gray-500">Preço</label>
                    <input aria-label="Preço unitário" className="w-full border p-2 rounded text-sm bg-white text-gray-900" type="number" step="0.01"
                            value={novoItem.precoUnitario} onChange={(e)=>setNovoItem({...novoItem, precoUnitario:+e.target.value})}/>
                </div>
                <div className="col-span-2">
                    <label className="text-[10px] text-gray-500">IVA%</label>
                    <input aria-label="Percentagem de imposto IVA" className="w-full border p-2 rounded text-sm bg-white text-gray-900" type="number" step="0.01"
                            value={novoItem.impostoPercent} onChange={(e)=>setNovoItem({...novoItem, impostoPercent:+e.target.value})}/>
                </div>
                <div className="col-span-1">
                    <button aria-label="Adicionar item à fatura" title="Adicionar item" className="w-full bg-gray-800 text-white rounded p-2 flex justify-center" onClick={addItem}><Plus size={18}/></button>
                </div>
                </div>
            )}

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <th className="p-3 text-left">Descrição</th>
                  <th className="p-3 text-right">Qtd</th>
                  <th className="p-3 text-right">Preço</th>
                  <th className="p-3 text-right">IVA %</th>
                  <th className="p-3 text-right">Total</th>
                  {invoice.status === 'RASCUNHO' && <th className="p-3 w-10"></th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoice.itens.length === 0 && (
                    <tr><td colSpan={6} className="text-center p-4 text-gray-400">Nenhum item adicionado.</td></tr>
                )}
                {invoice.itens.map((i, idx)=>(
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="p-3">{i.descricao}</td>
                    <td className="p-3 text-right">{i.quantidade}</td>
                    <td className="p-3 text-right">{i.precoUnitario.toFixed(2)} {invoice.moeda}</td>
                    <td className="p-3 text-right">{(i.impostoPercent ?? 0).toFixed(0)}%</td>
                    <td className="p-3 text-right font-medium">{(i.quantidade*i.precoUnitario*(1+(i.impostoPercent??0)/100)).toFixed(2)} {invoice.moeda}</td>
                    {invoice.status === 'RASCUNHO' && (
                        <td className="p-3 text-right">
                             <button aria-label="Remover item" title="Remover" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                        </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2 bg-gray-50 p-4 rounded border border-gray-100">
                <div className="flex justify-between text-sm"><span>Subtotal:</span> <span>{totals.subtotal.toFixed(2)} {invoice.moeda}</span></div>
                <div className="flex justify-between text-sm"><span>Impostos:</span> <span>{totals.impostos.toFixed(2)} {invoice.moeda}</span></div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 text-gray-900">
                    <span>Total:</span> <span>{totals.total.toFixed(2)} {invoice.moeda}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                    <span>Saldo a Pagar:</span> <span className={`${fin.saldo > 0 ? 'text-red-600 font-bold' : 'text-green-600'}`}>{fin.saldo.toFixed(2)} {invoice.moeda}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pagamentos */}
          <div className="col-span-2 border-t border-gray-200 pt-6">
            <div className="flex justify-between items-center mb-4">
                 <div className="text-sm font-bold text-gray-800">Pagamentos & Recebimentos</div>
                 {invoice.tipo !== 'COTACAO' && invoice.tipo !== 'PRO_FORMA' && invoice.status !== 'CANCELADA' && (
                     <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-700 flex items-center gap-2 text-sm font-bold"
                     >
                         <DollarSign size={16} /> Receber Pagamento
                     </button>
                 )}
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Modalidade</th>
                  <th className="p-2 text-left">Ref.</th>
                  <th className="p-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {invoice.pagamentos.length === 0 && (
                    <tr><td colSpan={4} className="text-center p-2 text-gray-400 text-xs">Nenhum pagamento registrado.</td></tr>
                )}
                {invoice.pagamentos.map((p, idx)=>(
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="p-2">{formatFlexibleDate(p.data, { time: true })}</td>
                    <td className="p-2">{p.modalidade}</td>
                    <td className="p-2">{p.referencia ?? "-"}</td>
                    <td className="p-2 text-right font-medium text-green-600">{p.valor.toFixed(2)} {invoice.moeda}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    {/* MODAL DE PAGAMENTO DEDICADO */}
    {isPaymentModalOpen && (
        <PaymentModal 
            invoice={invoice}
            onClose={() => setIsPaymentModalOpen(false)}
            onConfirm={handlePaymentConfirmed}
        />
    )}

    {/* ÁREA INVISÍVEL PARA GERAÇÃO DO PDF */}
    <div style={{display:'none'}}>
        <div ref={printRef} className="sheet" style={{
            width: '210mm', 
            minHeight: '297mm', 
            padding: '20mm',
            backgroundColor: 'white',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#333'
        }}>
            <div className="header" style={{display:'flex', justifyContent:'space-between', marginBottom:'30px', borderBottom:'2px solid #eee', paddingBottom:'20px'}}>
                <div>
                    <h1 className="title" style={{fontSize:'24px', fontWeight:'bold', textTransform:'uppercase', margin:0}}>{invoice.tipo.replace("_", " ")}</h1>
                    <div className="meta" style={{color:'#666', fontSize:'14px', marginTop:'5px'}}>Nº Documento: <strong>{invoice.numero}</strong></div>
                    <div className="meta" style={{color:'#666', fontSize:'14px'}}>Data Emissão: {invoice.dataEmissao}</div>
                    {invoice.vencimento && <div className="meta" style={{color:'#666', fontSize:'14px'}}>Vencimento: {invoice.vencimento}</div>}
                </div>
                <div className="right" style={{textAlign:'right'}}>
                    <div className="section-title" style={{fontSize:'12px', fontWeight:'bold', textTransform:'uppercase', color:'#888', marginBottom:'5px'}}>EMITIDO POR</div>
                    <div style={{fontWeight:'bold'}}>{invoice.empresa.nome}</div>
                    <div style={{fontSize:'14px'}}>NUIT: {invoice.empresa.nuit}</div>
                    <div style={{fontSize:'14px'}}>{invoice.empresa.endereco}</div>
                    {invoice.empresa.contacto && <div style={{fontSize:'14px'}}>{invoice.empresa.contacto}</div>}
                </div>
            </div>

            <div style={{marginBottom: '30px', padding:'15px', backgroundColor:'#f9f9f9', borderRadius:'5px'}}>
                <div className="section-title" style={{fontSize:'12px', fontWeight:'bold', textTransform:'uppercase', color:'#888', marginBottom:'5px'}}>CLIENTE</div>
                <div style={{fontWeight:'bold', fontSize:'16px'}}>{invoice.cliente.nome}</div>
                {invoice.cliente.nuit && <div style={{fontSize:'14px'}}>NUIT: {invoice.cliente.nuit}</div>}
                {invoice.cliente.endereco && <div style={{fontSize:'14px'}}>{invoice.cliente.endereco}</div>}
                {invoice.cliente.contacto && <div style={{fontSize:'14px'}}>{invoice.cliente.contacto}</div>}
            </div>

            <table style={{width:'100%', borderCollapse:'collapse', marginBottom:'20px'}}>
                <thead>
                <tr style={{backgroundColor:'#eee'}}>
                    <th style={{padding:'10px', textAlign:'left', borderBottom:'1px solid #ddd'}}>Descrição</th>
                    <th style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #ddd'}}>Qtd</th>
                    <th style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #ddd'}}>Preço Un.</th>
                    <th style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #ddd'}}>IVA %</th>
                    <th style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #ddd'}}>Total</th>
                </tr>
                </thead>
                <tbody>
                {invoice.itens.map((i, idx)=>(
                    <tr key={idx}>
                    <td style={{padding:'10px', borderBottom:'1px solid #eee'}}>{i.descricao}</td>
                    <td style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #eee'}}>{i.quantidade}</td>
                    <td style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #eee'}}>{i.precoUnitario.toFixed(2)}</td>
                    <td style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #eee'}}>{(i.impostoPercent ?? 0).toFixed(0)}%</td>
                    <td style={{padding:'10px', textAlign:'right', borderBottom:'1px solid #eee'}}>{(i.quantidade*i.precoUnitario*(1+(i.impostoPercent??0)/100)).toFixed(2)}</td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="totals" style={{display:'flex', justifyContent:'flex-end'}}>
                <div className="totals-box" style={{width:'250px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', padding:'5px 0'}}><span>Subtotal:</span> <span>{totals.subtotal.toFixed(2)} {invoice.moeda}</span></div>
                    <div style={{display:'flex', justifyContent:'space-between', padding:'5px 0'}}><span>Impostos:</span> <span>{totals.impostos.toFixed(2)} {invoice.moeda}</span></div>
                    <div style={{display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #333', fontWeight:'bold', fontSize:'16px'}}><span>Total:</span> <span>{totals.total.toFixed(2)} {invoice.moeda}</span></div>
                    {valorPago(invoice.pagamentos) > 0 && (
                         <div style={{display:'flex', justifyContent:'space-between', padding:'5px 0', marginTop:'10px', borderTop:'1px dashed #ccc'}}>
                            <span>Valor Pago:</span> <span>{valorPago(invoice.pagamentos).toFixed(2)} {invoice.moeda}</span>
                         </div>
                    )}
                </div>
            </div>
            
            <div style={{marginTop: '50px', fontSize: '12px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px'}}>
                <p>Processado por OFFICIO Software. Documento gerado eletronicamente.</p>
                {invoice.observacoes && <p>Obs: {invoice.observacoes}</p>}
            </div>
        </div>
    </div>
    </>
  );
}
