-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 40,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create coupon_redemptions table to track per-user usage
CREATE TABLE public.coupon_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  user_id UUID NOT NULL,
  attempt_id UUID NOT NULL REFERENCES public.test_attempts(id),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Coupons are readable by authenticated users (to check validity)
CREATE POLICY "Authenticated users can view active coupons"
ON public.coupons
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions"
ON public.coupon_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Insert the DATA40 coupon
INSERT INTO public.coupons (code, max_uses, is_active)
VALUES ('DATA40', 40, true);