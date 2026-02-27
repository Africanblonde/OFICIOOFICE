import { supabase } from './supabaseClient';

export interface EmployeeDeliveryInput {
  employeeId: string;
  itemId?: string;
  itemName: string;
  quantity: number;
  unit: string;
  deliveredBy?: string;
  origin: string; // 'RH', 'REQUISITION', etc
  requisitionId?: string;
  notes?: string;
}

export async function registerEmployeeDelivery(input: EmployeeDeliveryInput) {
  const { data, error } = await supabase
    .from('employee_deliveries')
    .insert({
      employee_id: input.employeeId,
      item_id: input.itemId,
      item_name: input.itemName,
      quantity: input.quantity,
      unit: input.unit,
      delivered_by: input.deliveredBy,
      origin: input.origin,
      requisition_id: input.requisitionId,
      notes: input.notes,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getEmployeeDeliveries(employeeId: string) {
  const { data, error } = await supabase
    .from('employee_deliveries')
    .select('*')
    .eq('employee_id', employeeId)
    .order('delivery_date', { ascending: false });
  if (error) throw error;
  return data;
}
