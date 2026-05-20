
-- Role enum
CREATE TYPE public.couple_role AS ENUM ('tri', 'mutia');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.couple_role NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_role(_user_id UUID)
RETURNS public.couple_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.user_id_for_role(_role public.couple_role)
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT user_id FROM public.user_roles WHERE role = _role LIMIT 1 $$;

CREATE POLICY "anyone authed can read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);

-- Prayers
CREATE TABLE public.prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subuh BOOLEAN NOT NULL DEFAULT false,
  dzuhur BOOLEAN NOT NULL DEFAULT false,
  ashar BOOLEAN NOT NULL DEFAULT false,
  maghrib BOOLEAN NOT NULL DEFAULT false,
  isya BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own prayers select" ON public.prayers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (public.get_role(auth.uid()) = 'tri' AND user_id = public.user_id_for_role('mutia')));
CREATE POLICY "own prayers insert" ON public.prayers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own prayers update" ON public.prayers FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own prayers delete" ON public.prayers FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Meals
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  food_name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own meals select" ON public.meals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (public.get_role(auth.uid()) = 'tri' AND user_id = public.user_id_for_role('mutia')));
CREATE POLICY "own meals insert" ON public.meals FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own meals update" ON public.meals FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own meals delete" ON public.meals FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lainnya',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own expenses select" ON public.expenses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (public.get_role(auth.uid()) = 'tri' AND user_id = public.user_id_for_role('mutia')));
CREATE POLICY "own expenses insert" ON public.expenses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own expenses update" ON public.expenses FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own expenses delete" ON public.expenses FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Trigger: auto-assign role on signup based on email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _role public.couple_role;
BEGIN
  IF NEW.email = 'tri@strawberry.app' THEN _role := 'tri';
  ELSIF NEW.email = 'mutia@strawberry.app' THEN _role := 'mutia';
  ELSE
    RAISE EXCEPTION 'Hanya 2 akun yang diizinkan: tri@strawberry.app atau mutia@strawberry.app';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role)
    ON CONFLICT (role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
