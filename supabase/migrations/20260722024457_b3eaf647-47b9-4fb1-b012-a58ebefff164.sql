
DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "System can upload certificates" ON storage.objects;

DROP POLICY IF EXISTS "Anyone can submit demo requests" ON public.demo_requests;
CREATE POLICY "Anyone can submit demo requests"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(coalesce(email, '')) between 3 and 320
  AND email like '%@%.%'
  AND char_length(coalesce(name, '')) between 1 and 200
  AND char_length(coalesce(school_name, '')) between 1 and 300
  AND char_length(coalesce(message, '')) <= 4000
);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_payment_status_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_coupon_discount() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_school_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_invitation(text, uuid) FROM PUBLIC, anon;

REVOKE EXECUTE ON FUNCTION public.get_email_from_username(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_from_username(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon, authenticated;
