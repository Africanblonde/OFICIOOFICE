import type { Invoice, InvoiceItem, InvoicePayment } from '../types';

export const calcularTotais = (itens: InvoiceItem[]) => {
  const subtotal = itens.reduce((acc, i) => acc + i.quantidade * i.precoUnitario, 0);
  const impostos = itens.reduce((acc, i) => {
    const iva = (i.impostoPercent ?? 0) / 100;
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
