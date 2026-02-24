import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, couponCode, studentName } = await req.json();
    if (!email || !couponCode) throw new Error("Missing email or couponCode");

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const emailResponse = await resend.emails.send({
      from: "D.E.Bs Learning Academy <noreply@debslearnacademy.com>",
      to: [email],
      subject: `Your Diagnostic Bundle Coupon Code — ${couponCode}`,
      html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:20px;color:#1C2D5A;">
  <div style="text-align:center;padding:20px 0;border-bottom:3px solid #FFDE59;">
    <h1 style="margin:0;font-size:24px;">D.E.Bs Learning Academy</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#64748b;letter-spacing:2px;text-transform:uppercase;">Unlocking Brilliance Through Learning</p>
  </div>

  <div style="padding:24px 0;">
    <h2 style="color:#1C2D5A;">🎉 Your Diagnostic Bundle Coupon</h2>
    <p>Dear Parent/Guardian of <strong>${studentName || "Student"}</strong>,</p>
    <p>Thank you for purchasing the <strong>Diagnostic Bundle (ELA + Math)</strong>!</p>
    <p>Use the coupon code below to take your <strong>second diagnostic test for free</strong>:</p>

    <div style="background:#f0f4ff;border:2px dashed #1C2D5A;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Your Coupon Code</p>
      <p style="margin:0;font-size:32px;font-weight:bold;letter-spacing:4px;color:#1C2D5A;">${couponCode}</p>
    </div>

    <h3>How to use:</h3>
    <ol style="line-height:1.8;">
      <li>Go to the Tests page and select your second subject</li>
      <li>Choose your grade level and proceed to checkout</li>
      <li>Enter the coupon code above in the coupon field</li>
      <li>The test will be unlocked at no additional charge</li>
    </ol>

    <p style="background:#fef3c7;padding:12px;border-radius:8px;font-size:14px;">
      ⚠️ This coupon is <strong>single-use only</strong> and is tied to your account.
    </p>
  </div>

  <div style="border-top:2px solid #e2e8f0;padding-top:16px;font-size:13px;color:#64748b;">
    <p><strong>D.E.Bs Learning Academy</strong></p>
    <p>📧 info@debslearnacademy.com | 📞 347-364-1906</p>
    <p>🌐 <a href="https://www.debslearnacademy.com" style="color:#1C2D5A;">www.debslearnacademy.com</a></p>
  </div>
</body></html>
      `,
    });

    console.log("[SEND-BUNDLE-COUPON] Email sent", { emailResponse, to: email });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[SEND-BUNDLE-COUPON] Error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
