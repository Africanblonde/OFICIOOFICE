import React from 'react';
import { RequisitionSheet, CompanyInfo } from '../types';
import { formatFlexibleDate } from '../utils/dateFormatter';

interface RequisitionPrintViewProps {
    sheet: RequisitionSheet;
    companyInfo?: CompanyInfo;
    onClose: () => void;
}

export const RequisitionPrintView = ({ sheet, companyInfo, onClose }: RequisitionPrintViewProps) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 overflow-y-auto flex justify-center items-start p-4">
            <div className="bg-gray-100 min-h-screen w-full max-w-4xl flex flex-col items-center">
                {/* Toolbar */}
                <div className="w-full bg-white p-4 shadow-sm mb-4 flex justify-between items-center rounded-lg no-print">
                    <h2 className="font-bold text-gray-700">Visualização de Impressão</h2>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                            Fechar
                        </button>
                        <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Printable Area - A4 Size Simulation */}
                <div className="bg-white w-[210mm] min-h-[297mm] p-10 shadow-lg text-sm text-gray-800 print-content" id="printable-area">

                    {/* Header */}
                    <div className="border-b-2 border-gray-800 pb-4 mb-6 flex justify-between items-start">
                        <div>
                            {companyInfo?.logo ? (
                                <img src={companyInfo.logo} alt="Logo" className="h-16 mb-2" />
                            ) : (
                                <h1 className="text-2xl font-bold uppercase tracking-wider">{companyInfo?.nome || 'EMPRESA DEMO'}</h1>
                            )}
                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                <p>{companyInfo?.endereco || 'Endereço da Empresa'}</p>
                                <p>NUIT: {companyInfo?.nuit || '000000000'} | Tel: {companyInfo?.contacto || '82 000 0000'}</p>
                                <p>{companyInfo?.email || 'contato@empresa.com'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-gray-900 uppercase">Ficha de Requisição</h2>
                            <p className="text-gray-500 font-mono text-lg mt-1">{sheet.requisitionNumber}</p>
                            <div className="mt-2 text-xs">
                                <p>Data: <strong>{formatFlexibleDate(sheet.createdAt, { dateOnly: true })}</strong></p>
                                <p>Status: <span className="uppercase font-bold">{sheet.status}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Info Block */}
                    <div className="flex justify-between border border-gray-200 rounded p-4 mb-6 bg-gray-50">
                        <div className="w-1/2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Origem (Fornecedor Interno)</h3>
                            <p className="font-semibold text-lg">{sheet.sourceLocationName}</p>
                        </div>
                        <div className="w-1/2 border-l border-gray-200 pl-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-1">Destino (Requisitante)</h3>
                            <p className="font-semibold text-lg">{sheet.targetLocationName}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full mb-8 border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b-2 border-gray-800">
                                <th className="py-2 px-2 text-left font-bold uppercase text-xs w-10">#</th>
                                <th className="py-2 px-2 text-left font-bold uppercase text-xs">Item / Descrição</th>
                                <th className="py-2 px-2 text-center font-bold uppercase text-xs w-20">Qtd</th>
                                <th className="py-2 px-2 text-center font-bold uppercase text-xs w-20">Unid.</th>
                                <th className="py-2 px-2 text-center font-bold uppercase text-xs w-24">Condição</th>
                                <th className="py-2 px-2 text-left font-bold uppercase text-xs w-1/4">Obs.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sheet.items.map((item, idx) => (
                                <tr key={item.id}>
                                    <td className="py-3 px-2 text-gray-500">{idx + 1}</td>
                                    <td className="py-3 px-2 font-medium">{item.itemName}</td>
                                    <td className="py-3 px-2 text-center">{item.quantity}</td>
                                    <td className="py-3 px-2 text-center text-xs text-gray-500">{item.unit}</td>
                                    <td className="py-3 px-2 text-center text-xs">{item.condition}</td>
                                    <td className="py-3 px-2 text-xs text-gray-500 italic">{item.notes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Notes */}
                    {sheet.notes && (
                        <div className="mb-8 p-4 border border-gray-200 rounded bg-yellow-50">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">Observações Gerais</h4>
                            <p className="text-sm text-gray-800 italic">{sheet.notes}</p>
                        </div>
                    )}

                    {/* Signatures */}
                    <div className="mt-auto pt-12 grid grid-cols-2 gap-12">
                        <div className="text-center">
                            <div className="border-t border-gray-400 w-3/4 mx-auto mb-2"></div>
                            <p className="text-xs font-bold uppercase">Solicitante</p>
                            <p className="text-[10px] text-gray-400">Assinatura e Carimbo</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-gray-400 w-3/4 mx-auto mb-2"></div>
                            <p className="text-xs font-bold uppercase">Autorizado Por</p>
                            <p className="text-[10px] text-gray-400">Assinatura e Carimbo</p>
                        </div>
                    </div>

                    <div className="text-center mt-8 pt-4 border-t border-gray-100 text-[10px] text-gray-400">
                        Processado via OFICE Logistics System | {formatFlexibleDate(new Date().toISOString(), { time: true })}
                    </div>

                </div>
            </div>

            <style>{`
        @media print {
          .no-print { display: none !important; }
          .bg-gray-100 { background: white !important; }
          .fixed { position: static !important; overflow: visible !important; }
          .min-h-screen { min-height: 0 !important; }
          @page { margin: 10mm; }
        }
      `}</style>
        </div>
    );
};
