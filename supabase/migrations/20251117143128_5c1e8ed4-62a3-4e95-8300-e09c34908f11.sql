-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plate TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  odometer INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_category TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drivers"
  ON public.drivers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drivers"
  ON public.drivers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drivers"
  ON public.drivers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drivers"
  ON public.drivers FOR DELETE
  USING (auth.uid() = user_id);

-- Create checklists table
CREATE TABLE public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checklists"
  ON public.checklists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklists"
  ON public.checklists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklists"
  ON public.checklists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklists"
  ON public.checklists FOR DELETE
  USING (auth.uid() = user_id);

-- Create checklist items
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE NOT NULL,
  item_text TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checklist items"
  ON public.checklist_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.checklists
    WHERE checklists.id = checklist_items.checklist_id
    AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can create checklist items"
  ON public.checklist_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.checklists
    WHERE checklists.id = checklist_items.checklist_id
    AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can update checklist items"
  ON public.checklist_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.checklists
    WHERE checklists.id = checklist_items.checklist_id
    AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete checklist items"
  ON public.checklist_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.checklists
    WHERE checklists.id = checklist_items.checklist_id
    AND checklists.user_id = auth.uid()
  ));

-- Create checklist shares
CREATE TABLE public.checklist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID REFERENCES public.checklists(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(checklist_id, driver_id)
);

ALTER TABLE public.checklist_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their checklist shares"
  ON public.checklist_shares FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.checklists
    WHERE checklists.id = checklist_shares.checklist_id
    AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can create checklist shares"
  ON public.checklist_shares FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.checklists
    WHERE checklists.id = checklist_shares.checklist_id
    AND checklists.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete checklist shares"
  ON public.checklist_shares FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.checklists
    WHERE checklists.id = checklist_shares.checklist_id
    AND checklists.user_id = auth.uid()
  ));

-- Create maintenances table
CREATE TABLE public.maintenances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10, 2) NOT NULL,
  maintenance_date DATE NOT NULL,
  odometer INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.maintenances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own maintenances"
  ON public.maintenances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own maintenances"
  ON public.maintenances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maintenances"
  ON public.maintenances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maintenances"
  ON public.maintenances FOR DELETE
  USING (auth.uid() = user_id);

-- Create refuelings table
CREATE TABLE public.refuelings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  fuel_type TEXT NOT NULL,
  liters DECIMAL(8, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  odometer INTEGER NOT NULL,
  refuel_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.refuelings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own refuelings"
  ON public.refuelings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own refuelings"
  ON public.refuelings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own refuelings"
  ON public.refuelings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own refuelings"
  ON public.refuelings FOR DELETE
  USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at
  BEFORE UPDATE ON public.maintenances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refuelings_updated_at
  BEFORE UPDATE ON public.refuelings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();