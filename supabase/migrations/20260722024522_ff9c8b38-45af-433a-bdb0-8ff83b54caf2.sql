
-- Needed for RLS policies that reference these functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_school_id(uuid) TO authenticated;
-- Needed for signed-in users completing invitation acceptance from the client
GRANT EXECUTE ON FUNCTION public.accept_invitation(text, uuid) TO authenticated;
