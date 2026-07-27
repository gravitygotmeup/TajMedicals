-- Create medicines table
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT,
  stock INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed medicines
INSERT INTO public.medicines (name, description, price, category, stock) VALUES
('Paracetamol 650mg', 'Effective relief from fever and mild to moderate pain.', 15.00, 'Analgesics', 150),
('Amoxicillin 500mg', 'Antibiotic used to treat bacterial infections.', 85.00, 'Antibiotics', 80),
('Ibuprofen 400mg', 'Non-steroidal anti-inflammatory drug (NSAID) for pain relief.', 22.50, 'Analgesics', 120),
('Metformin 500mg', 'Oral diabetes medicine that helps control blood sugar levels.', 35.00, 'Antidiabetics', 200),
('Atorvastatin 10mg', 'Statin medication used to prevent cardiovascular disease.', 110.00, 'Cardiovascular', 90),
('Cetirizine 10mg', 'Antihistamine used to treat allergy symptoms.', 18.00, 'Antihistamines', 300),
('Omeprazole 20mg', 'Proton pump inhibitor that decreases stomach acid.', 45.00, 'Gastrointestinal', 140),
('Multivitamin Capsules', 'Daily essential dietary vitamins and minerals supplement.', 120.00, 'Wellness', 250)
ON CONFLICT DO NOTHING;

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_email TEXT,
  user_phone TEXT,
  user_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  prescription_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending_review', -- pending_review, packaging, ready_to_pay, ready_for_pickup, completed, cancelled
  total_price NUMERIC(10, 2) DEFAULT 0.00,
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- unpaid, paid
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Turn off Row Level Security (RLS) or create wide-open policies to facilitate local developer client access
ALTER TABLE public.medicines DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.medicines TO anon, authenticated, service_role;
GRANT ALL ON public.orders TO anon, authenticated, service_role;
