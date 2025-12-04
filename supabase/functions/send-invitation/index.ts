import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: "teacher" | "admin";
  schoolName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role, schoolName }: InvitationRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation already exists
    const { data: existingInvite } = await supabaseAdmin
      .from("invitations")
      .select("id")
      .eq("email", email.toLowerCase())
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "An active invitation already exists for this email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("invitations")
      .insert({
        email: email.toLowerCase(),
        role,
        invited_by: user.id,
        school_name: schoolName || null,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: "Failed to create invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Invitation created for ${email} with token ${invitation.token}`);

    // Build registration URL
    const baseUrl = req.headers.get("origin") || "https://id-preview--1b1860d1-016f-41ba-b0ef-bce65eedc08e.lovable.app";
    const registerUrl = `${baseUrl}/register?token=${invitation.token}`;

    // Try to send email if Resend is configured
    let emailSent = false;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const roleName = role === "admin" ? "Administrator" : "Teacher";
        
        await resend.emails.send({
          from: "D.E.Bs LEARNING ACADEMY <onboarding@resend.dev>",
          to: [email],
          subject: `You've been invited to join DEBs Diagnostic Hub as a ${roleName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #1e293b; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #0f172a; }
                .tagline { font-size: 12px; color: #64748b; }
                .content { background: #f8fafc; border-radius: 8px; padding: 30px; }
                .button { display: inline-block; background: #0f172a; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">D.E.Bs LEARNING ACADEMY</div>
                  <div class="tagline">Unlocking Brilliance Through Learning</div>
                </div>
                <div class="content">
                  <h2>You're Invited!</h2>
                  <p>You have been invited to join <strong>DEBs Diagnostic Hub</strong> as a <strong>${roleName}</strong>${schoolName ? ` for ${schoolName}` : ""}.</p>
                  <p>As a ${roleName.toLowerCase()}, you'll be able to:</p>
                  <ul>
                    ${role === "teacher" ? `
                      <li>Create and manage your classes</li>
                      <li>View your students' diagnostic test results</li>
                      <li>Access detailed skill analysis reports</li>
                      <li>Print teacher copies of completed tests</li>
                    ` : `
                      <li>Manage all school data and users</li>
                      <li>Invite teachers to the platform</li>
                      <li>View all student results across the school</li>
                      <li>Access comprehensive analytics</li>
                    `}
                  </ul>
                  <p>Click the button below to create your account:</p>
                  <a href="${registerUrl}" class="button">Create Your Account</a>
                  <p style="font-size: 12px; color: #64748b;">This invitation expires in 7 days.</p>
                </div>
                <div class="footer">
                  <p><strong>D.E.Bs LEARNING ACADEMY</strong></p>
                  <p>Phone: 347-364-1906 | Email: info@debslearnacademy.com</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        emailSent = true;
        console.log(`Invitation email sent to ${email}`);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue even if email fails - invitation still created
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          token: invitation.token,
          registerUrl,
        },
        emailSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-invitation:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
