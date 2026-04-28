# Fix Admin/Teacher Password Reset Redirecting to Login

## Root Cause

The Supabase JS client defaults to the **PKCE flow** for password recovery. The email link arrives as `/admin/login?code=<pkce_code>`, not the older hash-fragment format (`#access_token=...&type=recovery`).

Both `AdminAuth.tsx` and `Auth.tsx` only check `window.location.hash` for recovery tokens. They never see the PKCE `?code=` query param, so:

1. The supabase client auto-exchanges the code in the background and fires a `PASSWORD_RECOVERY` event.
2. But the `onAuthStateChange` listener is only attached **after** an `await` in `handleRecovery()` — by then the event may have already fired and been missed.
3. The user ends up signed in OR the page just shows the login form, where their old password fails with "invalid credentials" (matching the network log we see).

## Fix

In both `src/pages/AdminAuth.tsx` and `src/pages/Auth.tsx`:

1. **Register the `onAuthStateChange` listener synchronously at the very top of the effect**, before any `await`. Inside it, when `event === 'PASSWORD_RECOVERY'`, set `isPasswordReset = true` and `isLoggedIn = false`.
2. **Detect PKCE recovery via query string**: read `new URLSearchParams(window.location.search).get('code')`. If a `code` is present, call `await supabase.auth.exchangeCodeForSession(window.location.href)`. On success, set `isPasswordReset = true`, clear the URL (`history.replaceState`), and skip the auto-login path.
3. Keep the existing hash-token branch as a fallback for older email links.
4. Use a `isPasswordResetRef = useRef(false)` flag (set whenever recovery is detected) so the `SIGNED_IN` branch in the listener can skip navigating to the dashboard during recovery — `isPasswordReset` state is stale inside the listener closure.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/AdminAuth.tsx` | Register auth listener first; handle `?code=` PKCE recovery via `exchangeCodeForSession`; use ref to gate `SIGNED_IN` during recovery |
| `src/pages/Auth.tsx` | Same fix for student auth flow |

No DB or config changes. No new dependencies.
