import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAccountStatus() {
  const [accountStatus, setAccountStatus] = useState<string>("active");
  const [pauseReason, setPauseReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from("profiles")
          .select("account_status, pause_reason")
          .eq("id", user.id)
          .single();

        if (data) {
          setAccountStatus((data as any).account_status || "active");
          setPauseReason((data as any).pause_reason || null);
        }
      } catch (err) {
        console.error("Account status fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { accountStatus, pauseReason, isPaused: accountStatus === "paused", loading };
}
