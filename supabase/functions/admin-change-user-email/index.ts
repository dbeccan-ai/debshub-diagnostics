import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Admin access required" }, 403);

    const { userId, newEmail } = await req.json();
    if (!userId || typeof newEmail !== "string") {
      return json({ error: "userId and newEmail are required" }, 400);
    }

    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Please enter a valid email address" }, 400);
    }

    // Reject if another account already uses this email
    let taken = false;
    for (let page = 1; page <= 20 && !taken; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      taken = data.users.some((u) => (u.email ?? "").toLowerCase() === email && u.id !== userId);
      if (data.users.length < 200) break;
    }
    if (taken) return json({ error: "Another account already uses this email address" }, 409);

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email,
      email_confirm: true,
    });
    if (updateError) return json({ error: updateError.message }, 500);

    await supabaseAdmin.from("profiles").update({ parent_email: email }).eq("id", userId);

    return json({ success: true, email });
  } catch (error) {
    console.error("admin-change-user-email error:", error);
    return json({ error: "Unexpected error" }, 500);
  }
});
