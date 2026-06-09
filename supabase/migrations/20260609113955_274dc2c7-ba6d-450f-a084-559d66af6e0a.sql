-- Add share token to checklists
ALTER TABLE public.checklists
  ADD COLUMN IF NOT EXISTS share_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS checklists_share_token_key ON public.checklists(share_token);

-- Public read of a shared checklist by token
CREATE OR REPLACE FUNCTION public.get_shared_checklist(_token uuid)
RETURNS TABLE(id uuid, title text, description text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.title, c.description
  FROM public.checklists c
  WHERE c.share_token = _token
$$;

-- Public read of items by token
CREATE OR REPLACE FUNCTION public.get_shared_checklist_items(_token uuid)
RETURNS TABLE(id uuid, item_text text, is_checked boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.item_text, i.is_checked
  FROM public.checklist_items i
  JOIN public.checklists c ON c.id = i.checklist_id
  WHERE c.share_token = _token
  ORDER BY i.created_at ASC
$$;

-- Public toggle of an item by token
CREATE OR REPLACE FUNCTION public.toggle_shared_checklist_item(_token uuid, _item_id uuid, _checked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.checklist_items i
  SET is_checked = _checked
  WHERE i.id = _item_id
    AND i.checklist_id IN (SELECT c.id FROM public.checklists c WHERE c.share_token = _token);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_checklist(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_checklist_items(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_shared_checklist_item(uuid, uuid, boolean) TO anon, authenticated;