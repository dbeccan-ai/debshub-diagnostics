import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Recovery links must be handled in one place. Allowing the sign-in pages to
// consume them can race with this redirect and invalidate the new session.
const SELF_HANDLED = ["/reset-password"];

/**
 * Catches password-recovery links that land on any other route
 * (e.g. the site root, when the redirect URL falls back to Site URL)
 * and forwards them to the dedicated reset page with the token intact.
 */
const RecoveryRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (SELF_HANDLED.includes(location.pathname)) return;

    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const isRecoveryHash = hashParams.get("type") === "recovery" && hashParams.get("access_token");
    const search = new URLSearchParams(window.location.search);
    const isRecoveryCode = !!search.get("code") && search.get("type") !== "signup";

    if (isRecoveryHash || isRecoveryCode) {
      navigate(`/reset-password${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  return null;
};

export default RecoveryRedirect;
