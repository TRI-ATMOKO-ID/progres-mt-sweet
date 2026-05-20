-- USER SETTINGS
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  prayer_method INTEGER NOT NULL DEFAULT 20, -- Aladhan: Kemenag RI
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  push_subscription JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own settings select" ON public.user_settings FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (get_role(auth.uid()) = 'tri'::couple_role AND user_id = user_id_for_role('mutia'::couple_role)));

CREATE POLICY "own settings insert" ON public.user_settings FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "own settings update" ON public.user_settings FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- MESSAGES (chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Both Tri & Mutia can read all messages between them
CREATE POLICY "couple messages select" ON public.messages FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "send messages" ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "update own sent" ON public.messages FOR UPDATE TO authenticated
USING (receiver_id = auth.uid()); -- mark as read

CREATE POLICY "delete own messages" ON public.messages FOR DELETE TO authenticated
USING (sender_id = auth.uid());

CREATE INDEX idx_messages_pair ON public.messages (sender_id, receiver_id, created_at DESC);

-- GAME SESSIONS (mabar)
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type TEXT NOT NULL, -- 'tictactoe' | 'tebakangka'
  invited_by UUID NOT NULL,
  invited_to UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting | active | finished | declined
  current_turn UUID,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  winner_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game select participants" ON public.game_sessions FOR SELECT TO authenticated
USING (invited_by = auth.uid() OR invited_to = auth.uid());

CREATE POLICY "game insert by host" ON public.game_sessions FOR INSERT TO authenticated
WITH CHECK (invited_by = auth.uid());

CREATE POLICY "game update by participant" ON public.game_sessions FOR UPDATE TO authenticated
USING (invited_by = auth.uid() OR invited_to = auth.uid());

CREATE POLICY "game delete by host" ON public.game_sessions FOR DELETE TO authenticated
USING (invited_by = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER user_settings_touch BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER game_sessions_touch BEFORE UPDATE ON public.game_sessions
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();