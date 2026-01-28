import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate the date 10 days ago
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
    const tenDaysAgoISO = tenDaysAgo.toISOString()

    // Find students who completed Version A at least 10 days ago but haven't completed Version B
    const { data: studentsDue, error: studentsError } = await supabase
      .from('reading_recovery_enrollments')
      .select('student_name, parent_email, version_a_completed_at')
      .not('version_a_completed_at', 'is', null)
      .is('version_b_completed_at', null)
      .lte('version_a_completed_at', tenDaysAgoISO)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      throw studentsError
    }

    console.log(`Found ${studentsDue?.length || 0} students due for Version B`)

    if (!studentsDue || studentsDue.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No students due for Version B', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get admin emails from user_roles joined with auth.users
    const { data: adminRoles, error: adminError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (adminError) {
      console.error('Error fetching admin roles:', adminError)
      throw adminError
    }

    if (!adminRoles || adminRoles.length === 0) {
      console.log('No admin users found')
      return new Response(
        JSON.stringify({ message: 'No admin users to notify', count: studentsDue.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get admin emails from auth.users
    const adminUserIds = adminRoles.map(r => r.user_id)
    const { data: { users: adminUsers }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Error fetching admin users:', usersError)
      throw usersError
    }

    const adminEmails = adminUsers
      .filter(u => adminUserIds.includes(u.id))
      .map(u => u.email)
      .filter(Boolean) as string[]

    if (adminEmails.length === 0) {
      console.log('No admin emails found')
      return new Response(
        JSON.stringify({ message: 'No admin emails found', count: studentsDue.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Sending notification to ${adminEmails.length} admin(s)`)

    // Build the email content
    const studentList = studentsDue.map(s => {
      const completedDate = new Date(s.version_a_completed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      return `• ${s.student_name} (Parent: ${s.parent_email}) - Version A completed: ${completedDate}`
    }).join('\n')

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d;">Reading Recovery: Students Due for Version B</h1>
        <p style="color: #4a5568; font-size: 16px;">
          The following ${studentsDue.length} student${studentsDue.length > 1 ? 's are' : ' is'} now eligible to take the Version B assessment 
          (10+ days since completing Version A):
        </p>
        <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 16px; margin: 20px 0;">
          <ul style="margin: 0; padding-left: 20px; color: #2d3748;">
            ${studentsDue.map(s => {
              const completedDate = new Date(s.version_a_completed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
              return `<li style="margin-bottom: 8px;"><strong>${s.student_name}</strong><br/>Parent: ${s.parent_email}<br/>Version A completed: ${completedDate}</li>`
            }).join('')}
          </ul>
        </div>
        <p style="color: #718096; font-size: 14px;">
          Please follow up with these families to schedule their Version B assessment.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #a0aec0; font-size: 12px;">
          This is an automated notification from DEBs Learning Academy Reading Recovery Programme.
          <br/>Contact: info@debslearnacademy.com | 347-364-1906
        </p>
      </div>
    `

    // Send email if Resend is configured
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      
      const { error: emailError } = await resend.emails.send({
        from: 'Reading Recovery <noreply@debslearnacademy.com>',
        to: adminEmails,
        subject: `Reading Recovery: ${studentsDue.length} Student${studentsDue.length > 1 ? 's' : ''} Due for Version B`,
        html: emailHtml,
      })

      if (emailError) {
        console.error('Error sending email:', emailError)
        // Don't throw - still return success with the student data
      } else {
        console.log('Notification email sent successfully')
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping email')
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notification processed',
        studentsDue: studentsDue.length,
        adminNotified: adminEmails.length,
        students: studentsDue.map(s => s.student_name)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in notify-version-b-due:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
