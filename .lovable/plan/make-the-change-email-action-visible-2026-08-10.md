# Make the "Change email" action visible

The Change email button and its dialog already exist in the admin All User Logins page (they call the new admin-change-user-email backend function). Your screenshot still shows only "Verify email", which means the view you're looking at is the published (live) site, which hasn't been republished since that change.

Two things to do:

## 1. Republish
The live app needs a fresh publish to pick up the new button. Until then, only the preview shows it.

## 2. Make the action easier to find
Right now the actions are crammed into the Status column, so on narrower screens they get pushed off to the side. Change to:

- Add a dedicated "Actions" column at the end of the table (after Joined).
- Move "Verify email" and "Change email" there, rendered as small outline buttons with icons (check-circle and pencil) so they read as actions, not text.
- Keep the pause/resume toggle in the Status column where it belongs.
- Keep the table horizontally scrollable so nothing gets cut off on small screens.

## Technical notes
- File: `src/pages/AdminUserLogins.tsx` (presentation only — the dialog, state, and function call stay as-is).
- No backend or database changes; `admin-change-user-email` is already deployed.
