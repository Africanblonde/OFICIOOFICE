-- ============================================
-- DELETE POLICIES AND FUNCTIONS FOR ADMIN
-- ============================================

-- Allow ADMIN to delete items (RLS policy)
CREATE POLICY "Allow admin to delete items" ON public.items 
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS(
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'ADMIN'
  ));

-- Allow ADMIN to delete users (RLS policy)
CREATE POLICY "Allow admin to delete users" ON public.users 
  FOR DELETE USING (auth.role() = 'authenticated' AND EXISTS(
    SELECT 1 FROM public.users AS admin_users
    WHERE admin_users.id = auth.uid() AND admin_users.role = 'ADMIN'
  ));

-- Function to cascade delete user-related data
CREATE OR REPLACE FUNCTION public.cascade_delete_user(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Delete performance records
  DELETE FROM public.daily_performance WHERE worker_id = user_id;
  
  -- Delete requisition logs where user is actor
  DELETE FROM public.requisition_logs WHERE actor_id = user_id;
  
  -- Delete requisitions created by user
  DELETE FROM public.requisitions WHERE requester_id = user_id;
  
  -- Delete transactions by user
  DELETE FROM public.transactions WHERE user_id = user_id;
  
  -- Delete invoices created by user
  DELETE FROM public.invoices WHERE created_by = user_id;
  
  -- Finally delete the user
  DELETE FROM public.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete items (check if in inventory first)
CREATE OR REPLACE FUNCTION public.safe_delete_item(item_id UUID)
RETURNS TABLE(success boolean, message text) AS $$
BEGIN
  -- Check if item exists
  IF NOT EXISTS(SELECT 1 FROM public.items WHERE id = item_id) THEN
    RETURN QUERY SELECT false::boolean, 'Item não encontrado'::text;
    RETURN;
  END IF;
  
  -- Check if item has inventory
  IF EXISTS(SELECT 1 FROM public.inventory WHERE item_id = item_id AND quantity > 0) THEN
    RETURN QUERY SELECT false::boolean, 'Item tem estoque registrado. Remova o estoque primeiro.'::text;
    RETURN;
  END IF;
  
  -- Delete the item
  DELETE FROM public.items WHERE id = item_id;
  
  RETURN QUERY SELECT true::boolean, 'Item apagado com sucesso'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
