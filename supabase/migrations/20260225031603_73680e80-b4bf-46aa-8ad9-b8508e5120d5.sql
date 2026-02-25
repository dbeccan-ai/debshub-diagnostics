-- Add discount_amount column to coupons table
ALTER TABLE public.coupons ADD COLUMN discount_amount numeric NULL;

-- Update ENROLL7 coupon with $99 discount (minimum allowed)
UPDATE public.coupons SET discount_amount = 99 WHERE code = 'ENROLL7';

-- Add a validation trigger to enforce $99-$198 range for coupons with a discount_amount
CREATE OR REPLACE FUNCTION public.validate_coupon_discount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.discount_amount IS NOT NULL AND (NEW.discount_amount < 99 OR NEW.discount_amount > 198) THEN
    RAISE EXCEPTION 'discount_amount must be between $99 and $198';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_coupon_discount_trigger
BEFORE INSERT OR UPDATE ON public.coupons
FOR EACH ROW
EXECUTE FUNCTION public.validate_coupon_discount();