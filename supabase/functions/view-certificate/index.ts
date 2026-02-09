import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async (req) => {
  const url = new URL(req.url);
  const attemptId = url.searchParams.get("attemptId");

  if (!attemptId) {
    return new Response("<h1>Certificate not found</h1>", {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Try to get the certificate HTML from storage
    const fileName = `certificate-${attemptId}.html`;
    const { data, error } = await serviceClient.storage
      .from("certificates")
      .download(fileName);

    if (error || !data) {
      return new Response("<h1>Certificate not found. It may not have been generated yet.</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const html = await data.text();

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving certificate:", error);
    return new Response("<h1>Error loading certificate</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
