-- Create enum for document types
CREATE TYPE public.vehicle_document_type AS ENUM ('ipva', 'licenciamento', 'multa', 'seguro', 'dpvat', 'vistoria', 'outros');

-- Create vehicle_documents table
CREATE TABLE public.vehicle_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type vehicle_document_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  paid_date DATE,
  cost NUMERIC,
  status TEXT NOT NULL DEFAULT 'pendente',
  reference_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own vehicle documents"
ON public.vehicle_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vehicle documents"
ON public.vehicle_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicle documents"
ON public.vehicle_documents
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicle documents"
ON public.vehicle_documents
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vehicle_documents_updated_at
BEFORE UPDATE ON public.vehicle_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();