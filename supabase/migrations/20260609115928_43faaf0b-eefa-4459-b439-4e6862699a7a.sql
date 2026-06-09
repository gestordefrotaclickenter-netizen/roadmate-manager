CREATE TABLE public.tires (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  brand text,
  position text NOT NULL,
  change_date date NOT NULL,
  install_odometer integer NOT NULL DEFAULT 0,
  removal_odometer integer,
  purchase_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tires TO authenticated;
GRANT ALL ON public.tires TO service_role;

ALTER TABLE public.tires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tires"
ON public.tires FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tires"
ON public.tires FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tires"
ON public.tires FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tires"
ON public.tires FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_tires_updated_at
BEFORE UPDATE ON public.tires
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();