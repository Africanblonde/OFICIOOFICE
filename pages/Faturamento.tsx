import React, { useState } from 'react';
import { useLogistics } from '../context/useLogistics';
import { Plus, Edit, Trash2, DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { CostCenter, CostCenterType, PendingInvoiceItem, PendingItemStatus } from '../types';

const Faturamento: React.FC = () => {
  const {
    costCenters,
    pendingInvoiceItems,
    clients,
    items,
    locations,
    currentUser,
    isAdminOrGM,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    createPendingInvoiceItem,
    updatePendingInvoiceItem,
    deletePendingInvoiceItem,
    getClientName,
    getItemName,
    getLocationName
  } = useLogistics();

  const [activeTab, setActiveTab] = useState('centros-custo');

  // Estados para formulários
  const [costCenterForm, setCostCenterForm] = useState<{
    name: string;
    description: string;
    type: CostCenterType;
    locationId: string;
    managerId?: string;
    isActive: boolean;
  }>({
    name: '',
    description: '',
    type: CostCenterType.PRODUCTION,
    locationId: '',
    managerId: '',
    isActive: true
  });

  const [pendingItemForm, setPendingItemForm] = useState<{
    clientId: string;
    itemId: string;
    costCenterId: string;
    quantity: number;
    unitPrice: number;
    referenceDocument?: string;
    documentDate?: string;
    notes?: string;
  }>({
    clientId: '',
    itemId: '',
    costCenterId: '',
    quantity: 0,
    unitPrice: 0,
    referenceDocument: '',
    documentDate: '',
    notes: ''
  });

  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [editingPendingItem, setEditingPendingItem] = useState<PendingInvoiceItem | null>(null);
  const [isCostCenterDialogOpen, setIsCostCenterDialogOpen] = useState(false);
  const [isPendingItemDialogOpen, setIsPendingItemDialogOpen] = useState(false);

  const handleCreateCostCenter = async () => {
    if (!costCenterForm.name.trim()) return;

    const newCostCenter = {
      name: costCenterForm.name,
      description: costCenterForm.description,
      type: costCenterForm.type,
      locationId: costCenterForm.locationId || undefined,
      managerId: costCenterForm.managerId || undefined,
      isActive: costCenterForm.isActive
    };

    if (editingCostCenter) {
      await updateCostCenter({ ...editingCostCenter, ...newCostCenter });
    } else {
      await addCostCenter(newCostCenter);
    }

    resetCostCenterForm();
    setIsCostCenterDialogOpen(false);
  };

  const handleCreatePendingItem = async () => {
    if (!pendingItemForm.clientId || !pendingItemForm.itemId || pendingItemForm.quantity <= 0) return;

    const newItem = {
      clientId: pendingItemForm.clientId,
      itemId: pendingItemForm.itemId,
      costCenterId: pendingItemForm.costCenterId || undefined,
      quantity: pendingItemForm.quantity,
      unitPrice: pendingItemForm.unitPrice,
      referenceDocument: pendingItemForm.referenceDocument || undefined,
      documentDate: pendingItemForm.documentDate || undefined,
      notes: pendingItemForm.notes || undefined,
      status: 'PENDING' as PendingItemStatus,
      createdBy: currentUser!.id
    };

    if (editingPendingItem) {
      await updatePendingInvoiceItem({ ...editingPendingItem, ...newItem });
    } else {
      await createPendingInvoiceItem(newItem);
    }

    resetPendingItemForm();
    setIsPendingItemDialogOpen(false);
  };

  const resetCostCenterForm = () => {
    setCostCenterForm({
      name: '',
      description: '',
      type: CostCenterType.PRODUCTION,
      locationId: '',
      managerId: '',
      isActive: true
    });
    setEditingCostCenter(null);
  };

  const resetPendingItemForm = () => {
    setPendingItemForm({
      clientId: '',
      itemId: '',
      costCenterId: '',
      quantity: 0,
      unitPrice: 0,
      referenceDocument: '',
      documentDate: '',
      notes: ''
    });
    setEditingPendingItem(null);
  };

  const editCostCenter = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setCostCenterForm({
      name: costCenter.name,
      description: costCenter.description || '',
      type: costCenter.type,
      locationId: costCenter.locationId || '',
      managerId: costCenter.managerId || '',
      isActive: costCenter.isActive
    });
    setIsCostCenterDialogOpen(true);
  };

  const editPendingItem = (item: PendingInvoiceItem) => {
    setEditingPendingItem(item);
    setPendingItemForm({
      clientId: item.clientId,
      itemId: item.itemId,
      costCenterId: item.costCenterId || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      referenceDocument: item.referenceDocument || '',
      documentDate: item.documentDate || '',
      notes: item.notes || ''
    });
    setIsPendingItemDialogOpen(true);
  };

  const getStatusBadge = (status: PendingItemStatus) => {
    const variants = {
      PENDING: 'bg-gray-100 text-gray-800',
      PARTIALLY_INVOICED: 'bg-yellow-100 text-yellow-800',
      FULLY_INVOICED: 'bg-green-100 text-green-800'
    } as const;

    const classes = variants[status] || variants.PENDING;
    return <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes}`}>{status.replace(/_/g, ' ')}</span>;
  };

  const getCostCenterTypeLabel = (type: CostCenterType) => {
    const labels = {
      PRODUCTION: 'Produção',
      ADMIN: 'Administração',
      TRANSPORT: 'Transporte',
      SALES: 'Vendas'
    };
    return labels[type] || type;
  };

  if (!isAdminOrGM) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acesso Restrito</h2>
          <p className="text-gray-600">Você não tem permissão para acessar o módulo de faturamento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Faturamento (modo de diagnóstico)</h1>
      <p className="text-sm text-gray-600">Conteúdo principal temporariamente oculto para diagnóstico.</p>
    </div>
  );
};

export default Faturamento;