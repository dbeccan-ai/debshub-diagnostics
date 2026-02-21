

## Fix Plan: Certificate Tier Mismatch + Curriculum Generation Failure

### Issue 1: Downloaded Certificate Shows Wrong Tier (Tier 2 instead of Tier 3)

**Root Cause:** The `generate-certificate` edge function was run when the tier was still "Tier 2". It saved that stale tier into:
- The `certificates` table (still shows `tier: "Tier 2"`)
- The stored HTML file in storage (`certificate-{attemptId}.html`)

The `view-certificate` function serves this cached HTML, so it still shows Tier 2 even though `test_attempts` now correctly says Tier 3.

**Fix:** Update the `generate-result-download` edge function so it also regenerates the certificate record and stored HTML whenever it runs. This way, downloading the result always syncs the certificate to the latest tier. Specifically:
- After generating `resultHTML`, also regenerate the certificate HTML and upsert it to storage and the `certificates` table (same logic as `generate-certificate` but inline).
- Alternatively, have `generate-result-download` call the certificate regeneration at the end.

Additionally, update `certificates` table record for the specific attempt to "Tier 3" via a database fix.

---

### Issue 2: Curriculum and Practice Questions Not Generating

**Root Cause:** The `generate-curriculum` edge function (line 65) filters the query with `.eq("user_id", user.id)`. When an admin views a student's results and clicks "Generate Curriculum", the logged-in user is the admin, not the student. The query returns 0 rows, causing the "PGRST116" error.

**Fix:** Update `generate-curriculum` to:
1. First try fetching with the user's ID (for students viewing their own results).
2. If no result, check if the user has an admin role, and if so, fetch the attempt without the `user_id` filter (using service role client which is already available).

---

### Technical Changes

**File 1: `supabase/functions/generate-curriculum/index.ts`**
- Remove `.eq("user_id", user.id)` from the attempt query on the `adminClient` (service role client).
- Instead, fetch the attempt by `attemptId` only, then verify ownership OR admin role before proceeding.
- Add admin role check similar to `generate-result-download`.

**File 2: `supabase/functions/generate-certificate/index.ts`**
- Add admin role check so admins can also regenerate certificates for any student.

**File 3: `supabase/functions/generate-result-download/index.ts`**
- After generating and uploading the result HTML, also regenerate and upsert the certificate HTML and `certificates` table record to keep them in sync with the current tier from `test_attempts`.

**Database Fix:**
- Update the stale `certificates` record for the specific attempt to `tier = 'Tier 3'`.

