import type { Invoice, InvoiceItem, InvoicePayment } from '../types';

export const calcularTotais = (itens: InvoiceItem[]) => {
  const subtotal = itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
  const impostos = itens.reduce((acc, i) => {
    const iva = (i.impostoPercent ?? 16) / 100; // Task 1.1: Ensure 16% VAT default
    return acc + i.quantidade * i.precoUnitario * iva;
  }, 0);
  const total = subtotal + impostos;
  return { subtotal, impostos, total };
}

export const valorPago = (pagamentos: InvoicePayment[]) => {
  return pagamentos.reduce((acc, p) => acc + p.valor, 0);
}

export const statusFinanceiro = (invoice: Invoice) => {
  const { total } = calcularTotais(invoice.itens);
  const pago = valorPago(invoice.pagamentos);
  // Tolerance for floating point
  if (pago >= total - 0.1) return { saldo: 0, situacao: "Pago" };
  if (pago <= 0) return { saldo: total, situacao: "Por pagar" };
  return { saldo: total - pago, situacao: "Pagamento parcial" };
}

/**
 * Task 1.5: Generate invoice PDF with optional digital signature support
 * @param invoiceHTML - The HTML content of the invoice
 * @param fileName - Name for the PDF file
 * @param signatureData - Optional signature data {name, date, signature_image_url}
 */
export const generateInvoicePDF = async (
  invoiceHTML: string,
  fileName: string,
  signatureData?: { name: string; date: string; signature_image_url?: string }
) => {
  // Check if html2pdf is available globally
  if (typeof (window as any).html2pdf === 'undefined') {
    console.error('html2pdf not loaded');
    throw new Error('PDF library not available');
  }

  const html2pdf = (window as any).html2pdf;

  // If signature is required, append signature block
  let finalHTML = invoiceHTML;
  if (signatureData) {
    const signatureHTML = `
      <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; display: flex; justify-content: space-between;">
        <div style="width: 45%; text-align: center;">
          <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Assinado digitalmente</div>
          ${signatureData.signature_image_url ? `
            <div style="margin: 10px 0; height: 60px; overflow: hidden;">
              <img src="${signatureData.signature_image_url}" style="max-height: 60px; max-width: 100%;" alt="Signature" />
            </div>
          ` : '<div style="height: 60px; border-bottom: 1px solid #000; margin: 10px 0;"></div>'}
          <div style="font-size: 10px; margin-top: 10px;">
            <strong>${signatureData.name}</strong><br/>
            ${signatureData.date}
          </div>
        </div>
      </div>
    `;
    finalHTML = invoiceHTML + signatureHTML;
  }

  const opt = {
    margin: 10,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  return new Promise((resolve, reject) => {
    html2pdf()
      .set(opt)
      .from(finalHTML)
      .save()
      .then(() => resolve({ success: true, message: 'PDF gerado com sucesso' }))
      .catch((err: any) => {
        console.error('PDF generation error:', err);
        reject(err);
      });
  });
}

/**
 * Task 1.5: Validate VAT percent on invoice items
 */
export const validateInvoiceVAT = (itens: InvoiceItem[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  itens.forEach((item, idx) => {
    const vat = item.impostoPercent ?? 16;
    if (vat < 0) {
      errors.push(`Item ${idx + 1}: IVA não pode ser negativo`);
    }
    // In Mozambique, standard VAT is 16%, but 0% is allowed for exempted items
    if (vat !== 0 && vat !== 16 && Math.abs(vat - 16) > 0.01) {
      // Allow variations but warn about non-standard rates
      console.warn(`Item ${idx + 1}: IVA não-padrão (${vat}%). Padrão em MZN é 16%.`);
    }
  });

  return { valid: errors.length === 0, errors };
}
