import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async (req) => {
  const url = new URL(req.url);
  const attemptId = url.searchParams.get("attemptId");
  const download = url.searchParams.get("download");

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

    // If download requested, serve as attachment
    if (download === "true") {
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="certificate-${attemptId}.html"`,
        },
      });
    }

    // Inject download/print buttons before closing </body>
    const downloadUrl = `${url.origin}${url.pathname}?attemptId=${attemptId}&download=true`;
    const downloadButton = `
      <div style="text-align: center; margin: 20px auto; max-width: 800px;">
        <button onclick="window.print()" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; border: none; padding: 14px 32px; font-size: 16px;
          border-radius: 8px; cursor: pointer; margin: 0 8px;
          font-family: Georgia, serif; font-weight: bold;
        ">🖨️ Print / Save as PDF</button>
        <a href="${downloadUrl}" style="
          display: inline-block; background: #22c55e; color: white;
          text-decoration: none; padding: 14px 32px; font-size: 16px;
          border-radius: 8px; margin: 0 8px;
          font-family: Georgia, serif; font-weight: bold;
        ">⬇️ Download Certificate</a>
      </div>
      <style>@media print { div:last-of-type { display: none !important; } }</style>
    `;

    const enhancedHtml = html.replace("</body>", `${downloadButton}</body>`);

    return new Response(enhancedHtml, {
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
