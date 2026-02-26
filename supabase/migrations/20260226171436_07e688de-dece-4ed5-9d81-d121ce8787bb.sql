
-- Update validation trigger to allow up to $229
CREATE OR REPLACE FUNCTION public.validate_coupon_discount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.discount_amount IS NOT NULL AND (NEW.discount_amount < 99 OR NEW.discount_amount > 229) THEN
    RAISE EXCEPTION 'discount_amount must be between $99 and $229';
  END IF;
  RETURN NEW;
END;
$function$;
