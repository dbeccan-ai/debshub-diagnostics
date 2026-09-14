// TACHS-only pricing: Tier 1 $1,000, $175 Diagnostic Enrollment Credit (7-day window), Stripe gross-up, exact figures, no live links.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  TACHS_PROGRAMS, PROGRAM_KEYS, STRIPE_FEE_RATE, STRIPE_FEE_FIXED_CENTS, DIAGNOSTIC_CREDIT_CENTS, DIAGNOSTIC_CREDIT_WINDOW_DAYS,
  DIAGNOSTIC_FEE_NOT_CREDITED_CENTS, grossUpCents, pricingBreakdown, addDaysIso, creditIsActive, CREDIT_TERMS, usd2,
  PROGRAM_FOR_TIER, programSessions, programHours, programScheduleLabel,
} from "../supabase/functions/_shared/tachs-programs.ts";
import { defaultCreditExpiry, defaultParentReportContent, parentReportView, parentReportEmailHtml, sanitizeParentReportContent, findForbiddenParentKeys, findForbiddenParentPhrases } from "../supabase/functions/_shared/tachs-report.ts";
import { STORED_RESULTS } from "./tachs-fixtures";

describe("fee constants and gross-up calculator", () => {
  it("uses configurable 2.9% + $0.30 and rounds to the nearest cent", () => {
    expect(STRIPE_FEE_RATE).toBe(0.029); expect(STRIPE_FEE_FIXED_CENTS).toBe(30);
    expect(grossUpCents(82_500)).toBe(84_995);
    expect(grossUpCents(132_500)).toBe(136_488);
    expect(grossUpCents(222_500)).toBe(229_176);
    expect(grossUpCents(27_500)).toBe(28_352);
    expect(grossUpCents(26_500)).toBe(27_322);
    expect(grossUpCents(44_500)).toBe(45_860);
    // Nets the stated amount after Stripe takes its cut (within a cent of rounding).
    for (const net of [82_500, 132_500, 222_500, 27_500]) {
      const charge = grossUpCents(net);
      expect(Math.abs(charge - Math.round(charge * STRIPE_FEE_RATE) - STRIPE_FEE_FIXED_CENTS - net)).toBeLessThanOrEqual(1);
    }
  });
});

describe("program tuition and exact parent figures", () => {
  const T = { tachs_strategy: 100_000, tachs_skill_builder: 150_000, tachs_intensive_phase1: 240_000, tachs_8_week_intensive: 150_000 } as const;
  it("Tier 1 regular tuition is $1,000; Tier 2 $1,500; Tier 3 $2,400", () => {
    for (const k of PROGRAM_KEYS) expect(TACHS_PROGRAMS[k].total_cents).toBe(T[k]);
  });
  it("credit is $175, 7 calendar days, never called complimentary/refunded; $5.54 fee not credited", () => {
    expect(DIAGNOSTIC_CREDIT_CENTS).toBe(17_500); expect(DIAGNOSTIC_CREDIT_WINDOW_DAYS).toBe(7); expect(DIAGNOSTIC_FEE_NOT_CREDITED_CENTS).toBe(554);
    expect(CREDIT_TERMS).toMatch(/\$175 Diagnostic Enrollment Credit/); expect(CREDIT_TERMS).toMatch(/7 calendar days/); expect(CREDIT_TERMS).toMatch(/\$5\.54 .*not credited/);
    expect(CREDIT_TERMS).not.toMatch(/complimentary|refund/i);
  });
  const cases = [
    { key: "tachs_strategy", balance: 82_500, full: 84_995, count: 3, each: 28_352, netEach: 27_500, total: 85_056 },
    { key: "tachs_skill_builder", balance: 132_500, full: 136_488, count: 5, each: 27_322, netEach: 26_500, total: 136_610 },
    { key: "tachs_intensive_phase1", balance: 222_500, full: 229_176, count: 5, each: 45_860, netEach: 44_500, total: 229_300 },
  ] as const;
  for (const c of cases) {
    it(`${c.key}: balance, pay-in-full and installments match the owner's figures`, () => {
      const p = TACHS_PROGRAMS[c.key];
      const b = pricingBreakdown({ regular_tuition_cents: p.total_cents, installment_count: p.installments.count, credit_applied: true });
      expect(b.credit_cents).toBe(17_500);
      expect(b.balance_cents).toBe(c.balance);
      expect(b.total_full_cents).toBe(c.full);
      expect(b.fee_full_cents).toBe(c.full - c.balance);
      expect(b.installments).toMatchObject({ count: c.count, charge_each_cents: c.each, net_each_cents: c.netEach, total_charged_cents: c.total });
      expect(b.installments.total_charged_cents).toBeGreaterThan(b.total_full_cents);
      expect(b.installment_fee_note).toMatch(/30-cent fee on each/);
      expect(b.domestic_card_note).toMatch(/international-card/);
    });
  }
  it("8-week intensive: 8 weeks, 16 two-hour sessions, 32 hours, Wed/Sat, and exact pricing", () => {
    const p = TACHS_PROGRAMS.tachs_8_week_intensive;
    expect(p).toMatchObject({ tier: "red", name: "TACHS 8-Week Intensive Readiness", duration_weeks: 8, sessions_per_week: 2, session_minutes: 120, total_cents: 150_000 });
    expect(p.schedule_days).toEqual(["Wednesday", "Saturday"]);
    expect(programSessions(p)).toBe(16); expect(programHours(p)).toBe(32);
    expect(programScheduleLabel(p)).toContain("Wednesday and Saturday");
    const b = pricingBreakdown({ regular_tuition_cents: p.total_cents, installment_count: p.installments.count, credit_applied: true });
    expect(b.balance_cents).toBe(132_500);
    expect(usd2(b.fee_full_cents)).toBe("$39.88");
    expect(usd2(b.total_full_cents)).toBe("$1,364.88");
    expect(b.installments.count).toBe(4);
    expect(usd2(b.installments.charge_each_cents)).toBe("$341.45");
    expect(usd2(b.installments.total_charged_cents)).toBe("$1,365.80");
    // Adding the option must not change automatic Tier 3 placement.
    expect(PROGRAM_FOR_TIER.red).toBe("tachs_intensive_phase1");
  });
  it("formats receipt amounts with two decimals", () => {
    expect(usd2(84_995)).toBe("$849.95"); expect(usd2(136_488)).toBe("$1,364.88"); expect(usd2(229_176)).toBe("$2,291.76");
    expect(usd2(28_352)).toBe("$283.52"); expect(usd2(27_322)).toBe("$273.22"); expect(usd2(45_860)).toBe("$458.60");
    expect(usd2(85_056)).toBe("$850.56"); expect(usd2(136_610)).toBe("$1,366.10"); expect(usd2(229_300)).toBe("$2,293.00");
  });
  it("no credit → full tuition balance", () => {
    expect(pricingBreakdown({ regular_tuition_cents: 100_000, installment_count: 3, credit_applied: false }).balance_cents).toBe(100_000);
  });
});

describe("credit eligibility and expiry", () => {
  it("defaults to 7 calendar days after release and expires afterwards", () => {
    const approved = "2026-09-13T20:00:00.000Z";
    expect(defaultCreditExpiry(approved)).toBe("2026-09-20T20:00:00.000Z");
    expect(addDaysIso("2026-12-28T00:00:00.000Z", 7)).toBe("2027-01-04T00:00:00.000Z");
    expect(creditIsActive(defaultCreditExpiry(approved), new Date("2026-09-20T19:59:00Z"))).toBe(true);
    expect(creditIsActive(defaultCreditExpiry(approved), new Date("2026-09-20T20:00:01Z"))).toBe(false);
    expect(creditIsActive(null)).toBe(false);
  });
  it("credit_expires_at is consultant-editable, validated, and defaults to null (old rows untouched)", () => {
    expect(defaultParentReportContent(STORED_RESULTS).credit_expires_at).toBeNull();
    const ok = sanitizeParentReportContent({ credit_expires_at: "2026-10-01" }, STORED_RESULTS);
    expect(ok.ok && ok.content.credit_expires_at).toBe("2026-10-01T00:00:00.000Z");
    expect(sanitizeParentReportContent({ credit_expires_at: "not a date" }, STORED_RESULTS).ok).toBe(false);
    const engine = readFileSync("supabase/functions/tachs-engine/index.ts", "utf8");
    expect(engine).toMatch(/credit_expires_at: approvedContent\.credit_expires_at \?\? defaultCreditExpiry\(approvedAt\)/);
  });
  it("released report and email show the receipt lines and the expiry date; no live payment link", () => {
    const content = { ...defaultParentReportContent(STORED_RESULTS), credit_expires_at: "2026-09-20T20:00:00.000Z" };
    const view = parentReportView(STORED_RESULTS, content, null)!;
    expect(view.program.payment_url).toBeNull();
    expect(view.program.pricing).toMatchObject({ regular_tuition_cents: 240_000, credit_cents: 17_500, balance_cents: 222_500, total_full_cents: 229_176, credit_expires_at: "2026-09-20T20:00:00.000Z" });
    const html = parentReportEmailHtml({ firstName: "M", gradeLevel: 8, completedOn: "x", attemptId: "id", report: view });
    for (const t of ["Regular tuition", "Diagnostic Enrollment Credit", "Tuition after credit", "Pay in full, including processing", "Five-payment option, including processing", "$2,400.00", "$175.00", "$2,225.00", "$2,291.76", "5 × $458.60", "$2,293.00", "September 20, 2026"]) expect(html).toContain(t);
    // Simplified copy: the dense Stripe explanation is gone from the parent email.
    for (const gone of ["30-cent fee", "international-card", "each covers", "Stripe processing fee"]) expect(html).not.toContain(gone);
    expect(html).not.toMatch(/buy\.stripe\.com|checkout\.stripe\.com|complimentary|refund/i);
    expect(findForbiddenParentKeys(view)).toEqual([]);
    expect(findForbiddenParentPhrases(html)).toEqual([]);
  });
  it("parent page and config contain no live payment links", () => {
    for (const f of ["src/pages/TachsResults.tsx", "supabase/functions/_shared/tachs-programs.ts", "supabase/functions/_shared/tachs-report.ts"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/buy\.stripe\.com|checkout\.stripe\.com/);
    }
    for (const k of PROGRAM_KEYS) expect(TACHS_PROGRAMS[k].payment_url).toBeNull();
    expect(readFileSync("src/pages/TachsResults.tsx", "utf8")).toMatch(/data-testid="pricing-panel"/);
  });
});
