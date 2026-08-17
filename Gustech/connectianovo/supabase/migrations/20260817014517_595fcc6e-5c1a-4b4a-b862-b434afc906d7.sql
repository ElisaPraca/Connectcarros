CREATE TABLE public.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technicians TO anon, authenticated;
GRANT ALL ON public.technicians TO service_role;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
CREATE POLICY "technicians_public_manage" ON public.technicians FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plate text NOT NULL UNIQUE,
  label text,
  technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO anon, authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_public_manage" ON public.vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'vehicle',
  technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  technician_name text,
  plate text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'concluido',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  fuel_level text,
  km integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO anon, authenticated;
GRANT ALL ON public.checklists TO service_role;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklists_public_manage" ON public.checklists FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX checklists_performed_at_idx ON public.checklists (performed_at DESC);
CREATE INDEX checklists_vehicle_idx ON public.checklists (vehicle_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER technicians_set_updated_at BEFORE UPDATE ON public.technicians
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER vehicles_set_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_plate()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.plate = upper(trim(NEW.plate));
  IF NEW.plate !~ '^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$' THEN
    RAISE EXCEPTION 'Placa invalida: %', NEW.plate;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER vehicles_validate_plate BEFORE INSERT OR UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.validate_plate();

INSERT INTO public.technicians (full_name) VALUES
  ('Flavio Roberto Alves da Silva'),
  ('Ricardo Nunes da Costa'),
  ('Edson Pedro dos Santos'),
  ('Jefferson Ferreira da Silva'),
  ('Kaique Anderson Souza Silva'),
  ('Luis Felipe de Almeida Silva'),
  ('Kazuaki Okada Junior'),
  ('Emerson Paulo do Espirito Santo'),
  ('Rogerio Alves Pereira');

INSERT INTO public.vehicles (plate, label, technician_id) VALUES
  ('FZC-7G15', 'Veiculo 01', (SELECT id FROM public.technicians WHERE full_name = 'Flavio Roberto Alves da Silva')),
  ('FCO-6H53', 'Veiculo 02', (SELECT id FROM public.technicians WHERE full_name = 'Ricardo Nunes da Costa')),
  ('SSX-5B37', 'Veiculo 03', (SELECT id FROM public.technicians WHERE full_name = 'Edson Pedro dos Santos')),
  ('SWQ-8G95', 'Veiculo 04', (SELECT id FROM public.technicians WHERE full_name = 'Jefferson Ferreira da Silva')),
  ('FPV-1G27', 'Veiculo 05', (SELECT id FROM public.technicians WHERE full_name = 'Kaique Anderson Souza Silva')),
  ('RMF-0F96', 'Veiculo 06', (SELECT id FROM public.technicians WHERE full_name = 'Luis Felipe de Almeida Silva')),
  ('DVD-2E60', 'Veiculo 07', (SELECT id FROM public.technicians WHERE full_name = 'Kazuaki Okada Junior')),
  ('STF-8E45', 'Veiculo 08', (SELECT id FROM public.technicians WHERE full_name = 'Emerson Paulo do Espirito Santo')),
  ('EFQ-1E05', 'Veiculo 09', (SELECT id FROM public.technicians WHERE full_name = 'Rogerio Alves Pereira')),
  ('FWZ-0I62', 'Veiculo 10', NULL),
  ('DWK-8C09', 'Veiculo 11', NULL),
  ('ITY-3I95', 'Veiculo 12', NULL),
  ('PBT-3H71', 'Veiculo 13', NULL),
  ('FNY-2382', 'Veiculo 14', NULL);