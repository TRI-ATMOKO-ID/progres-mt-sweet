
-- Cycles (haid) — only Mutia uses, but generic schema
CREATE TABLE public.cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own cycles select" ON public.cycles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (get_role(auth.uid()) = 'tri' AND user_id = user_id_for_role('mutia')));
CREATE POLICY "own cycles insert" ON public.cycles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "own cycles update" ON public.cycles FOR UPDATE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "own cycles delete" ON public.cycles FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Fasts (puasa events)
CREATE TABLE public.fasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  fast_type text NOT NULL DEFAULT 'sunnah', -- sunnah_senin_kamis, sunnah_ayyamul_bidh, sunnah_syawal, sunnah_arafah, sunnah_asyura, ramadhan, qadha
  completed boolean NOT NULL DEFAULT false,
  tarawih boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own fasts select" ON public.fasts FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (get_role(auth.uid()) = 'tri' AND user_id = user_id_for_role('mutia')));
CREATE POLICY "own fasts insert" ON public.fasts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "own fasts update" ON public.fasts FOR UPDATE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "own fasts delete" ON public.fasts FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Tadarus
CREATE TABLE public.tadarus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  surah text NOT NULL,
  from_ayah integer,
  to_ayah integer,
  pages numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tadarus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own tadarus select" ON public.tadarus FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (get_role(auth.uid()) = 'tri' AND user_id = user_id_for_role('mutia')));
CREATE POLICY "own tadarus insert" ON public.tadarus FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
CREATE POLICY "own tadarus update" ON public.tadarus FOR UPDATE TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "own tadarus delete" ON public.tadarus FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_cycles_user_date ON public.cycles(user_id, start_date);
CREATE INDEX idx_fasts_user_date ON public.fasts(user_id, date);
CREATE INDEX idx_tadarus_user_date ON public.tadarus(user_id, date);
