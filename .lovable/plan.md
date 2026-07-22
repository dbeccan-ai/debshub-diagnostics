# Fix student sign-in "invalid username/password" issue

## Diagnosis (confirmed)

Looking at recent profiles in the database, active students have usernames like `kirktonp`, `Julisza123`, `DemiS`, `Gigi`, `Zahara`, `Abri103`. The RPC `get_email_from_username` already lowercases both sides, so case is not the issue.

The most likely causes of the false-invalid errors on `src/pages/Auth.tsx`:

1. **No trimming.** The username and password inputs are sent as-is. Mobile keyboards, autofill, and copy/paste routinely add a trailing space, which makes the RPC lookup return no email → "Invalid username or password", even though the credentials are correct.
2. **Browser autofill overwrites the username field with the parent's email.** Password managers saved from the signup form (which had `parentEmail` + `username` + `password`) frequently autofill the email into the username input. The RPC then returns no match and the user sees "invalid".
3. **Users who signed up with legacy flows without a username** (two profiles in the DB have `username = NULL`) can never log in via the username lookup.

## Fix

Edit only `src/pages/Auth.tsx` (student login) and mirror the same changes in `src/pages/AdminAuth.tsx` and `src/pages/ReadingRecoveryAuth.tsx` where the same username→email RPC pattern is used.

### 1. Trim inputs before validation and RPC lookup
- `.trim()` `username` (both login and forgot-password paths) before Zod validation and before calling `get_email_from_username`.
- Do NOT trim password (spaces can be intentional), but strip only trailing `\n`/`\r` in case of paste artifacts.

### 2. Email fallback for the username field
- If the trimmed username contains `@`, skip the RPC lookup and pass it directly as `email` to `signInWithPassword`. This covers the autofill-with-email case and also lets legacy users (username = NULL) sign in with their original parent email.
- Same fallback for the password-reset path: if it's an email, call `resetPasswordForEmail` directly without the RPC.

### 3. Distinguish "no such user" from "wrong password" for the console (not the user)
- Keep the user-facing message generic ("Invalid username or password") to avoid user enumeration, but `console.warn` the reason so future debugging is easier.

### 4. Verify
- Read affected sign-in files after edits to confirm the trim + email-fallback are in place.
- Run a quick DB check that at least the three "problem shape" users (email-in-username-field, whitespace, null username) can now authenticate via the new fallback path — no schema changes needed.

## Out of scope

- No changes to the `get_email_from_username` RPC, auth policies, or password reset UI.
- No changes to the admin/teacher creation flow.
