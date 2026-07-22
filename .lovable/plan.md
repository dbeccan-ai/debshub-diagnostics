## Problem

`PhonicsChip` plays TTS audio by calling `supabase.functions.invoke("phonics-speak")`. That helper parses responses as JSON/text — it doesn't return raw audio bytes. The resulting `data` isn't a usable MP3, so `new Audio(url).play()` errors with "no supported source was found."

## Fix

Replace the `invoke()` call in `src/components/PhonicsChip.tsx` with a direct `fetch()` to the edge function URL so we get the real MP3 body:

- Build the URL from `SUPABASE_URL` (or hardcode the functions endpoint used elsewhere in the project).
- Attach the current user's access token via `supabase.auth.getSession()` in the `Authorization` header (function has `verify_jwt = true`) plus the `apikey` header.
- `await res.arrayBuffer()` → wrap in `Blob([...], { type: "audio/mpeg" })` → `URL.createObjectURL` → cache and play.
- Handle non-OK responses by reading text and toasting.

No backend changes; `phonics-speak` already returns `audio/mpeg` correctly. `phonics-check` continues to use `invoke()` since it returns JSON.

## Verify

Reload a Phonics activity, tap 🔊 on a chip, confirm audio plays and the second tap uses the in-memory cache.