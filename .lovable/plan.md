## What's actually happening

Jordyn Diallo-Coleman's account exists and works — the login is not a bad password.

Confirmed from the database and auth logs:
- Account: `Jordyndiallo23` / `bernisha10469@gmail.com`, created 2026-07-27 18:44 UTC.
- `email_confirmed_at` is **null** — the email was never verified, and she has never signed in successfully (`last_sign_in_at` is null).
- Auth logs for her sign-in attempts return `400 email_not_confirmed`.

The login screen turns every failure into the same message, "Invalid username or password", so an unconfirmed-email block looks identical to a wrong password. That is why this keeps being reported as a password problem.

She is currently the only unconfirmed account out of 17 users, but any new student signup hits the same wall until they click a verification email.

## Fix

1. **Unblock Jordyn now** — mark her email as confirmed so she can sign in with her existing password (and send a fresh reset link if she also forgot the password).

2. **Stop new students from being blocked** — turn on auto-confirm for email signups, so students who sign up with a parent email can log in immediately instead of waiting on a verification email that often lands in spam. (This is a backend auth setting change; it does not affect password reset emails, which keep working.)

3. **Show the real reason on the login page** — in the student login screen, distinguish the failure cases instead of one generic message:
   - Email not confirmed → "Your account isn't verified yet. Check the parent email for the verification link, or ask your teacher to activate the account," with a **Resend verification email** button.
   - Username not found → "We couldn't find that username."
   - Wrong password → "Incorrect password. Use Forgot Password to reset it."

4. **Same treatment on the admin/teacher login screen**, which shares the identical masking behavior.

## Technical notes

- Backend: set `email_confirmed_at` for user `eaf3432d-0766-41a7-8f96-80a5ea985130`; enable `auto_confirm_email` in auth settings.
- Frontend: `src/pages/Auth.tsx` `handleAuth` — branch on `error.message` / `error.code` (`email_not_confirmed`, `invalid_credentials`) and on a null username lookup, instead of the single `toast.error("Invalid username or password")`. Add a resend action using `supabase.auth.resend({ type: 'signup', email })`.
- Mirror the error-branching in `src/pages/AdminAuth.tsx`.
- No schema changes; no changes to test/grading logic.
