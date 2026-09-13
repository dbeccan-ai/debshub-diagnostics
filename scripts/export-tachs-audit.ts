// Writes the answer-free Content Audit snapshot consumed by /admin/tachs/content-audit.
// Run: bun run audit:tachs  (also part of `bun test`). Contains no stems, keys or rationales.
import { writeFileSync } from "node:fs";
import { buildContentAudit } from "../supabase/functions/tachs-engine/content-audit.ts";
const audit = buildContentAudit();
writeFileSync("src/data/tachs-content-audit.json", JSON.stringify(audit, null, 1));
const warn = audit.versions.flatMap((v) => [...v.warnings, ...v.sections.flatMap((s) => s.warnings.map((w) => `${s.key}: ${w}`))].map((w) => `v${v.version} ${w}`));
console.log(`TACHS content audit written (${audit.versions.map((v) => `v${v.version}: ${v.pool} items`).join(", ")})${warn.length ? `\nWarnings:\n- ${warn.join("\n- ")}` : ""}`);
