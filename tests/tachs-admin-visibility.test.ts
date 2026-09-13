import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { matchRoutes } from "react-router-dom";
import {
  PINNED_ATTEMPTS, buildAuditRows, carryoverSummary, codesNotInBank, compareVersions, countsByMode, filterByMode, filterItems,
  isEmptyData, isLoadError, type ListLoad, type VersionSummary,
} from "../src/lib/tachsAdminHelpers";
import audit from "../src/data/tachs-content-audit.json";

const MCKENZIE = "90ebaec6-415a-45bd-a6f0-32b9421aedf2";
const attempts = [
  { id: MCKENZIE, test_mode: false },
  { id: "677b1531-67ff-4a55-b3cd-1eb5153abefd", test_mode: false },
  { id: "46a6997d-f907-463c-945e-c2aa87050d44", test_mode: true },
  { id: "c221cf02-3be1-4477-a59f-22cacd0841d1", test_mode: true },
  { id: "976cef18-72e4-4a27-84b4-4a16a426e7da", test_mode: true },
  { id: "7bddf014-326b-41a4-8902-500f52b1672b", test_mode: true },
  { id: "a58558b3-7071-4410-8f3d-a2ba1953b7e9", test_mode: true },
];

describe("admin attempt list: errors are not empty data", () => {
  it("distinguishes an API failure from zero attempts", () => {
    const err: ListLoad<unknown> = { kind: "error", message: "Could not embed because more than one relationship was found" };
    const empty: ListLoad<unknown> = { kind: "ok", source: "engine", attempts: [] };
    expect(isLoadError(err)).toBe(true); expect(isEmptyData(err)).toBe(false);
    expect(isLoadError(empty)).toBe(false); expect(isEmptyData(empty)).toBe(true);
  });
  it("page renders an alert + retry on error and never an empty table", () => {
    const src = readFileSync("src/pages/AdminTachs.tsx", "utf8");
    expect(src).toMatch(/r\.kind === "error"[\s\S]*setLoadError\(r\.message\)/);
    expect(src).toMatch(/role="alert"[\s\S]*Retry/);
    expect(src).not.toMatch(/catch[^}]*toast\.error\([^)]*Could not load the TACHS attempts/);
  });
  it("engine surfaces query errors instead of returning an empty list, and disambiguates the profiles FK", () => {
    const engine = readFileSync("supabase/functions/tachs-engine/index.ts", "utf8");
    expect(engine).toMatch(/profiles!tachs_attempts_user_id_fkey/);
    expect(engine).toMatch(/profiles!tachs_orders_user_id_fkey/);
    expect(engine).not.toMatch(/[^!]profiles\(full_name/);
    expect(engine).toMatch(/if \(listErr \|\| ordErr\) return json\(\{ error/);
    const sender = readFileSync("supabase/functions/send-tachs-results/index.ts", "utf8");
    expect(sender).toMatch(/profiles!tachs_attempts_user_id_fkey/);
  });
});

describe("test-mode filtering and counts", () => {
  it("derives All (7) / Student (2) / TEST MODE (5) dynamically", () => {
    expect(countsByMode(attempts)).toEqual({ all: 7, student: 2, test: 5 });
    expect(filterByMode(attempts, "all")).toHaveLength(7);
    expect(filterByMode(attempts, "student").map((a) => a.id)).toContain(MCKENZIE);
    expect(filterByMode(attempts, "test")).toHaveLength(5);
    expect(filterByMode(attempts, "test").map((a) => a.id)).toContain("46a6997d-f907-463c-945e-c2aa87050d44");
  });
});

describe("direct Mckenzie route and route precedence", () => {
  const routes = [
    { path: "/admin/tachs", element: "list" },
    { path: "/admin/tachs/content-audit", element: "audit" },
    { path: "/admin/tachs/:attemptId", element: "detail" },
  ];
  it("App.tsx declares the three admin TACHS routes", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    for (const r of routes) expect(app).toContain(`path="${r.path}"`);
  });
  it("content-audit is not swallowed by :attemptId", () => {
    const m = matchRoutes(routes, "/admin/tachs/content-audit")!;
    expect(m[m.length - 1].route.element).toBe("audit");
  });
  it("Mckenzie's exact attempt ID resolves to the detail route and is pinned without score data", () => {
    const m = matchRoutes(routes, `/admin/tachs/${MCKENZIE}`)!;
    expect(m[m.length - 1].route.element).toBe("detail");
    expect(m[m.length - 1].params.attemptId).toBe(MCKENZIE);
    const pin = PINNED_ATTEMPTS.find((p) => p.id === MCKENZIE)!;
    expect(pin.label).toMatch(/Mckenzie Gray/);
    expect(JSON.stringify(pin)).not.toMatch(/accuracy|score|band|\d+%/i);
  });
});

describe("immutable snapshot audit rows", () => {
  it("binds responses to their original question rows and flags V2-R/V2-W carry-over", () => {
    const rows = buildAuditRows(
      [{ question_id: "q1", section_id: "s1", position: 2, skill: "inference", difficulty: 2, selected_key: "B", is_correct: true, is_flagged: false, time_spent_seconds: 30, presented_at: "t", answered_at: "t" },
       { question_id: "q2", section_id: "s1", position: 1, skill: "main_idea", difficulty: 1, selected_key: "A", is_correct: false, is_flagged: true, time_spent_seconds: 20, presented_at: "t", answered_at: null }],
      [{ id: "q1", code: "V2-R-001", section_key: "reading", stem: "S1", correct_key: "B", rationale: "R1" }, { id: "q2", code: "V2-R-002", section_key: "reading", stem: "S2", correct_key: "C", rationale: "R2" }],
      [{ id: "s1", section_key: "reading" }],
    );
    expect(rows.map((r) => r.position)).toEqual([1, 2]);
    expect(rows[1]).toMatchObject({ code: "V2-R-001", correct_key: "B", rationale: "R1", selected_key: "B" });
    const co = carryoverSummary(rows.map((r) => r.code));
    expect(co).toMatchObject({ v2r: 2, v2w: 0, flagged: true });
    expect(co.note).toMatch(/not the revised RD2\/WR2/);
    expect(codesNotInBank(rows.map((r) => r.code), [{ code: "RD2-001" }]).sort()).toEqual(["V2-R-001", "V2-R-002"]);
    expect(codesNotInBank(["RD2-001"], [{ code: "RD2-001" }])).toEqual([]);
  });
});

describe("v1 frozen vs v2 revised comparison", () => {
  const v1 = audit.versions.find((v) => v.version === 1) as unknown as VersionSummary;
  const v2 = audit.versions.find((v) => v.version === 2) as unknown as VersionSummary;
  it("compares every section side by side with pool deltas and choice changes", () => {
    const rows = compareVersions(v1, v2);
    expect(rows).toHaveLength(6);
    const pf = rows.find((r) => r.key === "paper_folding")!;
    expect(pf.left?.pool).toBe(15); expect(pf.right?.pool).toBe(32); expect(pf.pool_delta).toBe(17);
    expect(pf.choices_changed).toBe(true); expect(pf.left?.choices).toBe(4); expect(pf.right?.choices).toBe(5);
    const rd = rows.find((r) => r.key === "reading")!;
    expect(rd.choices_changed).toBe(false);
    expect(rd.difficulty.every((d) => d.left_share != null && d.right_share != null)).toBe(true);
  });
  it("applies identical filters to both panes", () => {
    const items = [
      { code: "A", section_key: "reading", skill: "inference", difficulty: 1, stem: "x", passage_title: null },
      { code: "B", section_key: "mathematics", skill: "algebra", difficulty: 3, stem: "y", passage_title: null },
    ] as never[];
    expect(filterItems(items, { section: "reading" }).map((i) => i.code)).toEqual(["A"]);
    expect(filterItems(items, { difficulty: "3" }).map((i) => i.code)).toEqual(["B"]);
    expect(filterItems(items, { query: "b" }).map((i) => i.code)).toEqual(["B"]);
  });
});

describe("keys and rationales stay admin-only", () => {
  it("engine gates admin_content_audit / admin_detail / admin_list behind the admin check", () => {
    const engine = readFileSync("supabase/functions/tachs-engine/index.ts", "utf8");
    for (const a of ["admin_content_audit", "admin_list", "admin_detail"]) {
      expect(engine).toMatch(new RegExp(`action === "${a}"\\) \\{[\\s\\S]{0,200}if \\(!admin\\) return json\\(\\{ error: "Forbidden" \\}, 403\\)`));
    }
  });
  it("the content-audit and admin pages require the admin role before rendering", () => {
    for (const f of ["src/pages/AdminTachsContentAudit.tsx", "src/pages/AdminTachs.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src).toMatch(/eq\("role", "admin"\)/);
      expect(src).toMatch(/This page is for administrators only/);
    }
  });
  it("student pages never import the admin direct-read helpers", () => {
    for (const f of ["src/pages/TachsResults.tsx", "src/pages/TachsAttempt.tsx", "src/pages/TachsStart.tsx"]) {
      const src = readFileSync(f, "utf8");
      expect(src).not.toMatch(/tachsAdminDirect|loadAdminDetail|tachsAdminHelpers|adminContentAudit/);
    }
  });
});

describe("admin report workspace separation", () => {
  const page = readFileSync("src/pages/AdminTachs.tsx", "utf8");
  const parent = page.slice(page.indexOf('<TabsContent value="parent"'), page.indexOf('<TabsContent value="internal"'));
  const internal = page.slice(page.indexOf('<TabsContent value="internal"'), page.indexOf("{/* Grant access */"));

  it("defaults to the parent report and gives both surfaces unmistakable labels", () => {
    expect(page).toMatch(/useState<"parent" \| "internal">\("parent"\)/);
    expect(page).toContain("Parent Report — Edit &amp; Preview");
    expect(page).toContain("Internal Diagnostic Audit — Never Sent");
    expect(parent).toContain("This tab shows exactly what Kecha will receive. Nothing in the Internal Diagnostic Audit tab is included.");
    expect(internal).toContain("ADMIN ONLY — this information is never included in the parent page, printable parent report, or parent email.");
  });

  it("keeps internal records and controls out of the parent tab", () => {
    for (const text of ["Bank note:", "Historical payment details", "Stripe Session:", "Difficulty path", "Skill metrics", "Answer audit, keys and rationales", "Activity and email log", "Reopen section"]) {
      expect(parent).not.toContain(text);
      expect(internal).toContain(text);
    }
  });

  it("has distinct safe and internal print boundaries", () => {
    expect(parent).toContain("Print Parent Report");
    expect(parent).toContain('data-print-surface="parent"');
    expect(parent).not.toMatch(/Print internal report|Print Internal Audit/);
    expect(internal).toContain("Print Internal Audit — not for families");
    expect(internal).toContain('data-print-surface="internal"');
    expect(page).toMatch(/body\.printing-tachs-parent \[data-print-surface="parent"\]/);
  });

  it("separates approval from sending and requires an explicit safe-content confirmation", () => {
    expect(parent).toContain("Confirm approval — do not send");
    expect(page).toContain("Approved. No email has been sent. Review the parent preview, then choose Send Parent Report.");
    expect(parent).toContain("Send Parent Report to Kecha’s saved email:");
    expect(parent).toContain("overall score and tier; six section scores and tiers; consultant interpretation; next-step plan; approved program and pricing; disclaimer");
    expect(parent).toContain("Confirm Send Parent Report");
  });

  it("shows delivery state outside the printable family report", () => {
    expect(parent).toContain('data-testid="delivery-status"');
    expect(parent).toContain("Email sent:");
    expect(parent.indexOf('data-testid="delivery-status"')).toBeLessThan(parent.indexOf('data-print-surface="parent"'));
  });
});
