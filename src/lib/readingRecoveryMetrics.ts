// Shared Reading Recovery metrics: WCPM, accuracy, and pre/post pairing.
// Used by the diagnostic save flow, the cohort report, and results views so
// every surface computes the same numbers.

export interface TranscriptMetricRow {
  id: string;
  user_id: string;
  student_id?: string | null;
  school_id?: string | null;
  student_name: string;
  version: string;
  final_error_count: number | null;
  wcpm?: number | null;
  reading_duration_seconds?: number | null;
  created_at: string;
  completion_status?: string | null;
}

/** Words correct per minute from a timed oral reading. */
export const computeWcpm = (wordCount: number, readingSeconds: number | null): number | null => {
  if (!readingSeconds || readingSeconds <= 0 || wordCount <= 0) return null;
  return Math.round((wordCount / readingSeconds) * 60);
};

/** Accuracy percentage from error count over passage length. */
export const computeAccuracy = (wordCount: number, errorCount: number | null): number | null => {
  if (errorCount === null || wordCount <= 0) return null;
  return Math.max(0, Math.round(((wordCount - errorCount) / wordCount) * 1000) / 10);
};

export interface PrePostPair {
  pre: TranscriptMetricRow;
  post: TranscriptMetricRow;
  errorDelta: number | null;
  wcpmDelta: number | null;
  daysBetween: number;
}

/**
 * Pair a student's Version A (pre) with their latest Version C (post)
 * transcript. Returns null when either side is missing — no pairing is ever
 * fabricated from incomplete data.
 */
export const pairPrePost = (rows: TranscriptMetricRow[]): PrePostPair | null => {
  const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const pre = sorted.find((r) => r.version === "A");
  const post = [...sorted].reverse().find((r) => r.version === "C");
  if (!pre || !post) return null;
  const daysBetween = Math.round(
    (new Date(post.created_at).getTime() - new Date(pre.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  return {
    pre,
    post,
    errorDelta:
      pre.final_error_count !== null && post.final_error_count !== null
        ? post.final_error_count - pre.final_error_count
        : null,
    wcpmDelta:
      pre.wcpm != null && post.wcpm != null ? post.wcpm - pre.wcpm : null,
    daysBetween,
  };
};

/** De-identified CSV row for cohort export (no names, emails, or user ids). */
export const toCohortCsvRow = (r: TranscriptMetricRow, index: number) => ({
  student_ref: `S${String(index + 1).padStart(3, "0")}`,
  version: r.version,
  errors: r.final_error_count ?? "",
  wcpm: r.wcpm ?? "",
  reading_seconds: r.reading_duration_seconds ?? "",
  status: r.completion_status ?? "",
  date: r.created_at.slice(0, 10),
});

export const toCsv = (rows: Array<Record<string, string | number>>): string => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};
